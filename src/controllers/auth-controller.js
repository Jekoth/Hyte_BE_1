import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import {findUserByUsernameForAuth} from '../models/user-model.js';

const postLogin = async (req, res) => {
  const {username, password} = req.body;

  if (!username || !password) {
    return res.status(400).json({message: 'username and password required'});
  }

  //MUST return password hash from db for comparison
  const user = await findUserByUsernameForAuth(username);
  if (!user) return res.status(401).json({message: 'invalid credentials'});

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({message: 'invalid credentials'});

  //Dont include password hash in token payload or response
  const tokenPayload = {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    user_level: user.user_level,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  });

  res.json({message: 'login ok', user: tokenPayload, token});
};

const getMe = (req, res) => {
  //req.user comes from authenticateToken from jwt.verify()
  res.json({message: 'token ok', user: req.user});
};

export {postLogin, getMe};
