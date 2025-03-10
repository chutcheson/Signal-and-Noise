const fs = require('fs');
const path = require('path');

// Read the top 1000 nouns list
const WORDS_FILE_PATH = path.join(__dirname, '../src/data/top_1000_nouns.txt');

// Categories for words
const CATEGORIES = [
  'Common Objects',
  'Natural World',
  'Emotions & Feelings',
  'Abstract Concepts',
  'Technology',
  'Food & Drink',
  'Jobs & Professions',
  'Locations',
  'Activities',
  'Time Periods'
];

// Cache the words list
let wordsList = [];

// Load the words from the file
const loadWords = () => {
  try {
    if (wordsList.length === 0) {
      const wordsData = fs.readFileSync(WORDS_FILE_PATH, 'utf8');
      wordsList = wordsData.split('\n').filter(word => word.trim() !== '');
    }
    return wordsList;
  } catch (error) {
    console.error('Error loading words list:', error);
    throw error;
  }
};

// Get a random word from the list
const getRandomWord = () => {
  const words = loadWords();
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

// Get a random category
const getRandomCategory = () => {
  const randomIndex = Math.floor(Math.random() * CATEGORIES.length);
  return CATEGORIES[randomIndex];
};

// Get a random word and category
const getRandomWordAndCategory = () => {
  return {
    word: getRandomWord(),
    category: getRandomCategory()
  };
};

// Check if a guess matches the secret word (case insensitive)
const checkGuess = (guess, secretWord) => {
  if (!guess || !secretWord) return false;
  return guess.toLowerCase().trim() === secretWord.toLowerCase().trim();
};

module.exports = {
  getRandomWord,
  getRandomCategory,
  getRandomWordAndCategory,
  checkGuess
};