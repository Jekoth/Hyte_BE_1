// routes/entry-router.js
import express from 'express';
import {
  getEntries,
  getEntryById,
  postEntry,
  putEntry,
  deleteEntry,
} from '../controllers/entry-controller.js';

import {authenticateToken} from '../middlewares/authentication.js';

const entryRouter = express.Router();

entryRouter.get('/', authenticateToken, getEntries);
entryRouter.post('/', authenticateToken, postEntry);
entryRouter.get('/:id', authenticateToken, getEntryById);
entryRouter.put('/:id', authenticateToken, putEntry);
entryRouter.delete('/:id', authenticateToken, deleteEntry);

export default entryRouter;
