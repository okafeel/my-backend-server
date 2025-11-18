// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); 

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,                       // force TLS
  tlsCAFile: undefined,            // optional
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("Mongo Error:", err));


// Routes
const itemRoutes = require('./routes/itemRoutes');
app.use('/api/items', itemRoutes);

app.get('/', (req, res) => {
  res.send("Backend is running 👍");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
