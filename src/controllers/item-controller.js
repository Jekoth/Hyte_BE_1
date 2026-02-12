import items from '../models/item-model.js';

const getItems = (req, res) => {
  res.json(items);
};

const getItemById = (req, res) => {
  console.log('getting item id:', req.params.id);
  const itemFound = items.find((item) => item.id == req.params.id);
  if (itemFound) {
    res.json(itemFound);
  } else {
    res.status(404).json({message: 'item not found'});
  }
};

const putItemById = (req, res) => {
  console.log('updating item id:', req.params.id);
  const itemIndex = items.findIndex((item) => item.id == req.params.id);
  if (itemIndex !== -1) {
    items[itemIndex] = {...items[itemIndex], ...req.body};
    res.json({message: 'item updated', item: items[itemIndex]});
  } else {
    res.status(404).json({message: 'item not found'});
  }
};

const deleteItemById = (req, res) => {
  console.log('deleting item id:', req.params.id);
  const itemIndex = items.findIndex((item) => item.id == req.params.id);
  if (itemIndex !== -1) {
    items.splice(itemIndex, 1);
    res.json({message: 'item deleted'});
  } else {
    res.status(404).json({message: 'item not found'});
  }
};

const postNewItem = (req, res) => {
  //console.log('add item request body', req.body);
  // name is mandatory property for new item
  if (!req.body.name) {
    // jos nimi puuttuu, funktion suoritus loppuu ja palautetaan 400 error
    return res.status(400).json({message: 'bad request'});
  }
  //lisää id listaan lisättävälle objektille
  const newId =
    items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  const newItem = {id: newId, ...req.body};
  items.push(newItem);
  res.status(201).json({message: 'new item added', item: newItem});
};

export {getItems, getItemById, putItemById, deleteItemById, postNewItem};
