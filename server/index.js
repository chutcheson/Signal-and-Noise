const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../config');
const wordService = require('./wordService');
const apiService = require('./apiService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      { id: config.MODELS.GPT4O, name: 'GPT-4o' },
      { id: config.MODELS.GPT4O_MINI, name: 'GPT-4o-mini' },
      { id: config.MODELS.CLAUDE, name: 'Claude-3.7-Sonnet' }
    ]
  });
});

// Get a random secret word
app.get('/api/secret', async (req, res) => {
  try {
    const secretWord = await wordService.getRandomWord();
    res.json({ secret: secretWord });
  } catch (error) {
    console.error('Error getting secret word:', error);
    res.status(500).json({ error: 'Failed to get secret word' });
  }
});

// Handle sender message generation
app.post('/api/sender-message', async (req, res) => {
  try {
    const { model, secret, receiverMessage, loop } = req.body;
    const result = await apiService.generateSenderMessage(model, secret, receiverMessage, loop);
    res.json(result);
  } catch (error) {
    console.error('Error generating sender message:', error);
    res.status(500).json({ error: 'Failed to generate sender message' });
  }
});

// Handle receiver guess
app.post('/api/receiver-guess', async (req, res) => {
  try {
    const { model, secret, senderMessage } = req.body;
    const result = await apiService.generateReceiverGuess(model, secret, senderMessage);
    res.json(result);
  } catch (error) {
    console.error('Error generating receiver guess:', error);
    res.status(500).json({ error: 'Failed to generate receiver guess' });
  }
});

// Handle observer guess
app.post('/api/observer-guess', async (req, res) => {
  try {
    const { model, secret, senderMessage } = req.body;
    const result = await apiService.generateObserverGuess(model, secret, senderMessage);
    res.json(result);
  } catch (error) {
    console.error('Error generating observer guess:', error);
    res.status(500).json({ error: 'Failed to generate observer guess' });
  }
});

// Handle receiver message
app.post('/api/receiver-message', async (req, res) => {
  try {
    const { model, secret, senderMessage, receiverGuess } = req.body;
    const result = await apiService.generateReceiverMessage(model, secret, senderMessage, receiverGuess);
    res.json(result);
  } catch (error) {
    console.error('Error generating receiver message:', error);
    res.status(500).json({ error: 'Failed to generate receiver message' });
  }
});

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});