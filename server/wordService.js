const fs = require('fs').promises;
const path = require('path');

// Path to the dictionary file
const DICTIONARY_PATH = path.join(__dirname, '../top_1000_nouns.txt');

// Cache for the dictionary
let dictionary = null;

// Function to load the dictionary from file
async function loadDictionary() {
  if (dictionary) {
    return dictionary;
  }
  
  try {
    const data = await fs.readFile(DICTIONARY_PATH, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    // Parse the word from each line (format: "     1 time")
    dictionary = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      // Return the word (last part of the line)
      return parts[parts.length - 1];
    });
    
    return dictionary;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    throw new Error('Failed to load dictionary');
  }
}

// Function to get a random secret word
async function getRandomSecret() {
  const words = await loadDictionary();
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

module.exports = {
  getRandomSecret
};