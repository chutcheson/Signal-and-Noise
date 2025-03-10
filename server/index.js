const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file if present
dotenv.config();

// Load config from config.js file if present
let config = {};
try {
  config = require('../config');
} catch (err) {
  console.log('No config.js file found, using environment variables');
}

// API services
const apiService = require('./apiService');
const wordService = require('./wordService');

const app = express();
const PORT = process.env.PORT || config.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o-mini' },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude-3.7-Sonnet' }
    ]
  });
});

app.get('/api/secret', async (req, res) => {
  try {
    const secret = await wordService.getRandomSecret();
    res.json({ secret });
  } catch (error) {
    console.error('Error getting secret word:', error);
    res.status(500).json({ error: 'Failed to get secret word' });
  }
});

app.post('/api/message', async (req, res) => {
  try {
    const { model, role, message, secret, history } = req.body;
    
    if (!model || !role || !secret) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await apiService.generateMessage(model, role, message, secret, history);
    res.json(response);
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

app.post('/api/guess', async (req, res) => {
  try {
    const { model, role, message, secret, history } = req.body;
    
    if (!model || !role || !secret) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const response = await apiService.generateGuess(model, role, message, secret, history);
    res.json(response);
  } catch (error) {
    console.error('Error generating guess:', error);
    res.status(500).json({ error: 'Failed to generate guess' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});