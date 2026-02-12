import promisePool from '../utils/database.js';

const getAllEntriesByUserId = async (user_id) => {
  try {
    const sql = `
      SELECT entry_id, mood, weight, sleep_hours, notes, entry_date, user_id
      FROM DiaryEntries
      WHERE user_id = ?
      ORDER BY entry_date DESC
    `;
    const [rows] = await promisePool.query(sql, [user_id]);
    return rows;
  } catch (error) {
    console.error('getAllEntriesByUserId error:', error);
    return null;
  }
};

const getEntryById = async (entry_id, user_id) => {
  try {
    const sql = `
      SELECT entry_id, mood, weight, sleep_hours, notes, entry_date, user_id
      FROM DiaryEntries
      WHERE entry_id = ? AND user_id = ?
    `;
    const [rows] = await promisePool.query(sql, [entry_id, user_id]);
    return rows[0];
  } catch (error) {
    console.error('getEntryById error:', error);
    return null;
  }
};

const createEntry = async (entry) => {
  try {
    const sql = `
      INSERT INTO DiaryEntries (mood, weight, sleep_hours, notes, entry_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      entry.mood ?? null,
      entry.weight ?? null,
      entry.sleep_hours ?? null,
      entry.notes ?? null,
      entry.entry_date ?? null,
      entry.user_id,
    ];

    const [result] = await promisePool.query(sql, params);

    return {
      entry_id: result.insertId,
    };
  } catch (error) {
    console.error('createEntry error:', error);
    return null;
  }
};

const updateEntry = async (entry_id, user_id, entry) => {
  try {
    const sql = `
      UPDATE DiaryEntries
      SET mood = ?, weight = ?, sleep_hours = ?, notes = ?, entry_date = ?
      WHERE entry_id = ? AND user_id = ?
    `;

    const params = [
      entry.mood ?? null,
      entry.weight ?? null,
      entry.sleep_hours ?? null,
      entry.notes ?? null,
      entry.entry_date ?? null,
      entry_id,
      user_id,
    ];

    const [result] = await promisePool.query(sql, params);

    return {
      updated: result.affectedRows === 1,
    };
  } catch (error) {
    console.error('updateEntry error:', error);
    return null;
  }
};

const deleteEntry = async (entry_id, user_id) => {
  try {
    const sql = `
      DELETE FROM DiaryEntries
      WHERE entry_id = ? AND user_id = ?
    `;

    const [result] = await promisePool.query(sql, [entry_id, user_id]);

    return {
      deleted: result.affectedRows === 1,
    };
  } catch (error) {
    console.error('deleteEntry error:', error);
    return null;
  }
};

export {
  getAllEntriesByUserId,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
};
