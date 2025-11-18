const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Upload folder
const upload = multer({
  dest: "uploads/"
});

// GET items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST item with image
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imagePath = null;

    if (req.file) {
      const outputPath = `uploads/${Date.now()}-${req.file.originalname}`;

      await sharp(req.file.path)
        .resize({ width: 300 }) // compress width to 300px
        .jpeg({ quality: 60 }) // compress jpg size
        .toFile(outputPath);

      // Delete original
      fs.unlinkSync(req.file.path);

      imagePath = `/${outputPath}`;
    }

    const item = new Item({
      title: req.body.title,
      description: req.body.description,
      image: imagePath
    });

    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
