import bcrypt from 'bcryptjs';
import {
  createUser,
  listUsers,
  findUserByUsername,
  findUserByEmail,
} from '../models/user-model.js';

const getUsers = async (req, res) => {
  const users = await listUsers();
  res.json(users);
};

const postUser = async (req, res) => {
  const {username, password, email} = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({message: 'required fields missing'});
  }

  // Pieni siistiminen: poistaa välilyönnit alusta/lopusta
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Duplikaatti-check: username
  const existingUsername = await findUserByUsername(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({message: 'username already in use'});
  }

  // Duplikaatti-check: email
  const existingEmail = await findUserByEmail(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({message: 'email already in use'});
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await createUser({
    username: cleanUsername,
    email: cleanEmail,
    password: passwordHash,
  });

  if (!result?.user_id) {
    return res.status(500).json({message: 'db error'});
  }

  res.status(201).json({message: 'user created', user_id: result.user_id});
};

export {getUsers, postUser};
