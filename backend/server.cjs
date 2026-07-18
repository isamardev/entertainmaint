require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./models/index.cjs');

// Explicitly import models so Sequelize knows about them
const Category = require('./models/Category.cjs');
const Article = require('./models/Article.cjs');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Categories CRUD
app.get('/api/categories', async (req, res) => {
  try {
    const data = await Category.findAll({ order: [['sort_order', 'ASC']] });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const data = await Category.create(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Articles CRUD
app.get('/api/articles', async (req, res) => {
  try {
    const includeCategory = req.query.includeCategory === 'true';
    const options = {
      order: [['created_at', 'DESC']],
      ...(includeCategory && { include: [{ model: Category, as: 'category' }] }),
    };
    const data = await Article.findAll(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/published', async (req, res) => {
  try {
    const options = {
      where: { status: 'published' },
      order: [['published_at', 'DESC']],
      include: [{ model: Category, as: 'category' }],
    };
    if (req.query.limit) options.limit = parseInt(req.query.limit);
    if (req.query.offset) options.offset = parseInt(req.query.offset);
    const data = await Article.findAll(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const data = await Article.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!data) return res.status(404).json({ error: 'Article not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/slug/:slug', async (req, res) => {
  try {
    const data = await Article.findOne({
      where: { slug: req.params.slug },
      include: [{ model: Category, as: 'category' }],
    });
    if (!data) return res.status(404).json({ error: 'Article not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const data = await Article.create(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    await Article.update(req.body, { where: { id: req.params.id } });
    const updated = await Article.findByPk(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await Article.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ imageUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Auto-create tables - use force: true to drop and recreate (only for development!)
    // or alter: true to update existing tables
    await db.sequelize.sync({ alter: true });
    console.log('Tables synced successfully');
    
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();
