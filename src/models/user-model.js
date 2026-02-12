import promisePool from '../utils/database.js';

// Käytetään authissa (tarvitaan salasana mukaan)
const findUserByUsernameForAuth = async (username) => {
  const sql = `
    SELECT user_id, username, email, user_level, password
    FROM Users
    WHERE username = ?
  `;
  const [rows] = await promisePool.query(sql, [username]);
  return rows[0];
};

// Käytetään esim. listauksessa (ei salasanaa)
const listUsers = async () => {
  const sql = `
    SELECT user_id, username, email, user_level, created_at
    FROM Users
  `;
  const [rows] = await promisePool.query(sql);
  return rows;
};

// Rekisteröinti
const createUser = async ({username, email, password}) => {
  const sql = `
    INSERT INTO Users (username, email, password)
    VALUES (?, ?, ?)
  `;
  const [result] = await promisePool.query(sql, [username, email, password]);
  return {user_id: result.insertId};
};

// Duplikaatti-check: käyttäjänimi
const findUserByUsername = async (username) => {
  const sql = `
    SELECT user_id, username
    FROM Users
    WHERE username = ?
  `;
  const [rows] = await promisePool.query(sql, [username]);
  return rows[0];
};

// Duplikaatti-check: sähköposti
const findUserByEmail = async (email) => {
  const sql = `
    SELECT user_id, email
    FROM Users
    WHERE email = ?
  `;
  const [rows] = await promisePool.query(sql, [email]);
  return rows[0];
};

// Käytetään esim. tokenin user_id:n perusteella
const findUserById = async (user_id) => {
  const sql = `
    SELECT user_id, username, email, user_level, created_at
    FROM Users
    WHERE user_id = ?
  `;
  const [rows] = await promisePool.query(sql, [user_id]);
  return rows[0];
};

export {
  findUserByUsernameForAuth,
  listUsers,
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
};
