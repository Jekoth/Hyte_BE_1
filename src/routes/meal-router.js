import express from 'express';
import { authenticateToken } from '../middlewares/authentication.js';
import mealGuestLimit from '../middlewares/meal-limit.js';
import {
  getMyMeals,
  postMeal,
  deleteMeal,
  analyzeMeal,
} from '../controllers/meal-controller.js';

const mealRouter = express.Router();

mealRouter.post('/analyze', mealGuestLimit, analyzeMeal);

mealRouter
  .route('/')
  .get(authenticateToken, getMyMeals)
  .post(authenticateToken, postMeal);

mealRouter
  .route('/:id')
  .delete(authenticateToken, deleteMeal);

export default mealRouter;
