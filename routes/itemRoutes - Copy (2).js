// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // create unique filename
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

// GET all items (supports search, pagination, sort via query params)
router.get('/', async (req, res) => {
  try {
    // Query params: q (search), page, limit, sortField, sortDir
    const q = req.query.q || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || 'createdAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({ items, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new item with optional image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const itemData = {
      title: req.body.title,
      description: req.body.description
    };
    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`; // URL path to serve statically
    }
    const item = new Item(itemData);
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update existing item (optional image replaces previous image)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.title = req.body.title ?? item.title;
    item.description = req.body.description ?? item.description;

    if (req.file) {
      // remove old image file if exists
      if (item.image) {
        const oldPath = path.join(__dirname, '..', item.image);
        if (await fs.pathExists(oldPath)) {
          await fs.remove(oldPath);
        }
      }
      item.image = `/uploads/${req.file.filename}`;
    }

    const updated = await item.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an item (and remove its image file)
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });

    if (deletedItem.image) {
      const imgPath = path.join(__dirname, '..', deletedItem.image);
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
