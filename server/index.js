const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Import API service modules
const apiService = require('./apiService');
const wordService = require('./wordService');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Game state storage (in memory for simplicity)
const gameState = {
  currentGame: null,
  activeGames: {}
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Routes

// Start a new round
app.get('/api/new-round', async (req, res) => {
  try {
    // Get a random word and category from the word service
    const { word, category } = await wordService.getRandomWordAndCategory();
    
    res.json({
      success: true,
      secretWord: word,
      category: category
    });
  } catch (error) {
    console.error('Error starting new round:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start new round'
    });
  }
});

// Get a message from the Sender
app.post('/api/sender-message', async (req, res) => {
  try {
    const { secretWord, category, messages, loop } = req.body;
    
    // Call the AI service to get a sender message
    const message = await apiService.getSenderMessage(secretWord, category, messages, loop);
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error getting sender message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sender message'
    });
  }
});

// Get a guess from the Observer
app.post('/api/observer-guess', async (req, res) => {
  try {
    const { category, messages } = req.body;
    
    // Extract the secret word from the last message to check against
    const secretWord = req.query.secretWord || messages[0]?.secretWord;
    
    // Call the AI service to get an observer guess
    const { guess, isCorrect } = await apiService.getObserverGuess(category, messages, secretWord);
    
    res.json({
      success: true,
      guess: guess,
      isCorrect: isCorrect
    });
  } catch (error) {
    console.error('Error getting observer guess:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get observer guess'
    });
  }
});

// Get a guess from the Receiver
app.post('/api/receiver-guess', async (req, res) => {
  try {
    const { category, messages } = req.body;
    
    // Extract the secret word from the last message to check against
    const secretWord = req.query.secretWord || messages[0]?.secretWord;
    
    // Call the AI service to get a receiver guess
    const { guess, isCorrect } = await apiService.getReceiverGuess(category, messages, secretWord);
    
    res.json({
      success: true,
      guess: guess,
      isCorrect: isCorrect
    });
  } catch (error) {
    console.error('Error getting receiver guess:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receiver guess'
    });
  }
});

// Get a response from the Receiver
app.post('/api/receiver-response', async (req, res) => {
  try {
    const { category, messages } = req.body;
    
    // Call the AI service to get a receiver response
    const message = await apiService.getReceiverResponse(category, messages);
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error getting receiver response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receiver response'
    });
  }
});

// Get a refined message from the Sender
app.post('/api/sender-refined-message', async (req, res) => {
  try {
    const { secretWord, category, messages, loop } = req.body;
    
    // Call the AI service to get a refined sender message
    const message = await apiService.getSenderRefinedMessage(secretWord, category, messages, loop);
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error getting sender refined message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sender refined message'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});