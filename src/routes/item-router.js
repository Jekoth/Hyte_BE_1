import express from 'express';
import {
  deleteItemById,
  getItemById,
  getItems,
  postNewItem,
  putItemById,
} from '../controllers/item-controller.js';

const itemRouter = express.Router();

// All endpoints for 'items' resource

itemRouter
  // define route
  .route('/')
  // Get all items
  .get(getItems)
  // Add new item
  .post(postNewItem);

itemRouter
  // define sub route
  .route('/:id')
  // Get item based on id
  .get(getItemById)
  // PUT route for items
  .put(putItemById)
  // DELETE route for items
  .delete(deleteItemById);

export default itemRouter;
