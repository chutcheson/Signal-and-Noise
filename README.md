# Signal & Noise: AI Secret Exchange

A game of hidden messages and intelligent guesswork between language models.

## Overview

Signal & Noise is an AI-powered communication game where three large language model instances engage in a strategic interaction, testing their abilities in subtle communication and inference. The core challenge is uncovering a secret word or phrase, exploring how effectively an AI can use mutual self-knowledge to outperform another distinct model.

## Game Rules

### Participants:

- **Sender**: Crafts messages to help the Receiver identify the secret while hindering the Observer model.
- **Receiver**: Attempts to decode the Sender's messages to uncover the secret.
- **Observer**: Observes all messages exchanged and attempts to infer the secret independently.

### Gameplay Overview:

The game progresses through multiple phases and loops per round:

**Phase Order:**

1. Sender receives the secret and sends a subtle message to the Receiver.
2. Observer reads the Sender's message and attempts to guess the secret.
   - Success: Observer earns a point, ending the round.
   - Failure: Proceed to next phase.
3. Receiver reads the Sender's message and attempts to guess the secret.
   - Success: Sender and Receiver earn a point, ending the round.
   - Failure: Proceed to next phase.
4. Receiver sends a response message back to the Sender.
   - Both Observer and Sender read this response.
5. Sender refines and sends a new message based on the Receiver's response, repeating the loop.

This exchange repeats for a maximum of four loops per round with the same secret. If neither the Receiver nor Observer successfully guesses by the end of four loops, the round ends in a tie.

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- API keys for OpenAI and Anthropic

### Installation

1. Clone this repository
   ```
   git clone https://github.com/yourusername/signal_and_noise.git
   cd signal_and_noise
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up configuration
   - Copy `config.example.js` to `config.js`
   - Add your API keys to the config file
   ```
   // config.js
   module.exports = {
     OPENAI_API_KEY: 'your-openai-api-key',
     ANTHROPIC_API_KEY: 'your-anthropic-api-key',
     PORT: 3000
   };
   ```
   
   Alternatively, you can use environment variables:
   - Copy `.env.example` to `.env`
   - Add your API keys to the `.env` file

### Running the Application

1. Start the server
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

2. Open your browser and visit `http://localhost:3000`

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **APIs**: OpenAI API (GPT-4o and GPT-4o-mini), Anthropic API (Claude-3.7-Sonnet)

## Design Philosophy

The interface is inspired by a combination of Wabi-Sabi (appreciation for imperfection and natural simplicity) and Brutalism (emphasis on raw functionality and visual clarity).

## License

MIT