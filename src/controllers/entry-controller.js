import {
  getAllEntriesByUserId,
  getEntryById as findEntryById,
  createEntry as addEntry,
  updateEntry,
  deleteEntry as removeEntry
} from '../models/entry-model.js';

const getEntries = async (req, res) => {
  // only return logged-in user's entries
  const user_id = req.user.user_id;

  const result = await getAllEntriesByUserId(user_id);

  // your model returns rows array OR null
  if (result !== null) {
    res.json(result);
  } else {
    res.status(500).json({message: 'db error'});
  }
};

const getEntryById = async (req, res) => {
  const user_id = req.user.user_id;
  const entry_id = Number(req.params.id);

  if (!Number.isFinite(entry_id)) return res.sendStatus(400);

  const entry = await findEntryById(entry_id, user_id);

  if (entry) {
    res.json(entry);
  } else {
    res.sendStatus(404);
  }
};

const postEntry = async (req, res) => {
  const {entry_date, mood, weight, sleep_hours, notes} = req.body;
  const user_id = req.user.user_id;

  if (entry_date && (weight || mood || sleep_hours || notes) && user_id) {
    const result = await addEntry({user_id, ...req.body});

    if (result?.entry_id) {
      res.status(201).json({message: 'New entry added.', ...result});
    } else {
      res.status(500).json({message: 'db error'});
    }
  } else {
    res.sendStatus(400);
  }
};

const putEntry = async (req, res) => {
  const entry_id = Number(req.params.id);
  const tokenUserId = req.user.user_id;

  if (!Number.isFinite(entry_id)) return res.sendStatus(400);

  const result = await updateEntry(entry_id, tokenUserId, req.body);

  if (result?.updated) return res.json({message: 'entry updated'});

  // your current model doesn't return notFound; if update affects 0 rows,
  // it can be "not found" OR "not owner" -> returning 403 is acceptable
  return res.status(403).json({message: 'forbidden'});
};

const deleteEntry = async (req, res) => {
  const entry_id = Number(req.params.id);
  const tokenUserId = req.user.user_id;

  if (!Number.isFinite(entry_id)) return res.sendStatus(400);

  const result = await removeEntry(entry_id, tokenUserId);

  if (result?.deleted) return res.json({message: 'entry deleted'});

  return res.status(403).json({message: 'forbidden'});
};

export {getEntries, getEntryById, postEntry, putEntry, deleteEntry};
