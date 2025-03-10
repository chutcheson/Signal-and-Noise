const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

/**
 * Get a random word from the word list
 * @returns {Promise<string>} A random word
 */
async function getRandomWord() {
  try {
    const filePath = path.join(__dirname, '../top_1000_nouns.txt');
    const data = await readFile(filePath, 'utf8');
    const words = data.split('\n').filter(word => word.trim().length > 0);
    
    // Get a random word from the list
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex].trim();
  } catch (error) {
    console.error('Error reading word list:', error);
    throw error;
  }
}

module.exports = {
  getRandomWord
};