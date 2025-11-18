const express = require("express");
const router = express.Router(); // IMPORTANT!
const Item = require("../models/Item");
const upload = require("../middleware/upload"); // multer or cloudinary middleware

// CREATE item
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newItem = new Item({
      title: req.body.title,
      description: req.body.description,
      image: req.file ? req.file.path : null, // or Cloudinary URL
    });

    await newItem.save();
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.title = req.body.title || item.title;
    item.description = req.body.description || item.description;
    if (req.file) item.image = req.file.path;

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
router.delete("/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
