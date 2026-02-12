import express from 'express';
import {getUsers, postUser} from '../controllers/user-controller.js';

const userRouter = express.Router();

// Users resource endpoints
userRouter
  .route('/')
  // GET all users
  .get(getUsers)
  // POST new user
  .post(postUser);

// TODO: get user by id
// TODO: put user by id
// TODO: delete user by id

export default userRouter;
