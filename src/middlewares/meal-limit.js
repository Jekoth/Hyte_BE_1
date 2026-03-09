import crypto from 'crypto';
import promisePool from '../utils/database.js';

const MAX_GUEST_MEAL_CALCULATIONS = 3;

const mealGuestLimit = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Jos käyttäjä on kirjautunut, ei rajoiteta
    if (token) {
      return next();
    }

    let guestId = req.cookies?.guest_meal_id;

    console.log('guestId from cookie:', guestId);

    if (!guestId) {
      guestId = crypto.randomUUID();

      res.cookie('guest_meal_id', guestId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 30,
        path: '/',
      });

      console.log('new guestId created:', guestId);
    }

    const [rows] = await promisePool.query(
      'SELECT usage_count FROM GuestMealUsage WHERE guest_id = ?',
      [guestId]
    );

    if (!rows.length) {
      await promisePool.query(
        'INSERT INTO GuestMealUsage (guest_id, usage_count) VALUES (?, 1)',
        [guestId]
      );

      req.guestUsesRemaining = MAX_GUEST_MEAL_CALCULATIONS - 1;
      console.log('first guest use, remaining:', req.guestUsesRemaining);
      return next();
    }

    const currentCount = Number(rows[0].usage_count || 0);
    console.log('current guest usage_count:', currentCount);

    if (currentCount >= MAX_GUEST_MEAL_CALCULATIONS) {
      return res.status(401).json({
        message: 'Voit laskea ilman kirjautumista 3 kertaa. Kirjaudu jatkaaksesi.',
        requiresLogin: true,
      });
    }

    await promisePool.query(
      'UPDATE GuestMealUsage SET usage_count = usage_count + 1 WHERE guest_id = ?',
      [guestId]
    );

    req.guestUsesRemaining = MAX_GUEST_MEAL_CALCULATIONS - (currentCount + 1);
    console.log('updated guest usage, remaining:', req.guestUsesRemaining);

    next();
  } catch (error) {
    console.error('mealGuestLimit failed:', error);
    res.status(500).json({
      message: 'Laskurajoituksen tarkistus epäonnistui.',
    });
  }
};

export default mealGuestLimit;
