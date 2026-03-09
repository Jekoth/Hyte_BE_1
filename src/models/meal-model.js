import promisePool from '../utils/database.js';

const getMealsByUserId = async (user_id) => {
  const sql = `
    SELECT
      meal_id,
      user_id,
      meal_name,
      items_json,
      calories,
      protein,
      carbs,
      fat,
      sugar,
      fiber,
      salt,
      sodium,
      health_score,
      health_label,
      analysis,
      created_at
    FROM Meals
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await promisePool.query(sql, [user_id]);
  return rows;
};

const addMeal = async (meal) => {
  const sql = `
    INSERT INTO Meals (
      user_id,
      meal_name,
      items_json,
      calories,
      protein,
      carbs,
      fat,
      sugar,
      fiber,
      salt,
      sodium,
      health_score,
      health_label,
      analysis
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    meal.user_id,
    meal.meal_name ?? null,
    JSON.stringify(meal.items_json ?? []),
    meal.calories ?? 0,
    meal.protein ?? 0,
    meal.carbs ?? 0,
    meal.fat ?? 0,
    meal.sugar ?? 0,
    meal.fiber ?? 0,
    meal.salt ?? 0,
    meal.sodium ?? 0,
    meal.health_score ?? 0,
    meal.health_label ?? 'Kohtalainen',
    meal.analysis ?? null,
  ];

  const [result] = await promisePool.query(sql, params);

  if (!result.insertId) return null;

  return {
    meal_id: result.insertId,
    ...meal,
  };
};

const deleteMealByIdAndUserId = async (meal_id, user_id) => {
  const sql = `
    DELETE FROM Meals
    WHERE meal_id = ? AND user_id = ?
  `;
  const [result] = await promisePool.query(sql, [meal_id, user_id]);
  return result.affectedRows > 0;
};

export { getMealsByUserId, addMeal, deleteMealByIdAndUserId };
