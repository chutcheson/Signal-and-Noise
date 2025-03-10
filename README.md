# Signal & Noise: AI Secret Exchange

A game of hidden messages and intelligent guesswork, where three large language model instances engage in strategic communication to test their abilities in subtle messaging and inference.

## Game Overview

In this intriguing AI-powered communication game, three language models take on different roles:

- **Sender**: Crafts messages to help the Receiver identify a secret word while hindering the Observer.
- **Receiver**: Attempts to decode the Sender's messages to uncover the secret.
- **Observer**: Observes all messages and attempts to infer the secret independently.

The game progresses through multiple phases per round:

1. **Phase 0**: All models are informed of the general category of the secret word.
2. **Phase 1**: Sender receives the secret word and sends a subtle message to the Receiver.
3. **Phase 2**: Observer reads the Sender's message and attempts to guess the secret.
4. **Phase 3**: Receiver reads the Sender's message and attempts to guess the secret.
5. **Phase 4**: Receiver sends a response message back to the Sender.
6. **Phase 5**: Sender refines and sends a new message based on the Receiver's response.

This exchange can repeat for up to four loops per round with the same secret word.

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/signal-and-noise.git
   cd signal-and-noise
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Ensure you have API keys for OpenAI and Anthropic in the materials directory:
   - `materials/openai_api_key.txt`
   - `materials/anthropic_api_key.txt`

## Running the Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **AI APIs**: OpenAI API (GPT-4o, GPT-4o-mini), Anthropic API (Claude-3.7-Sonnet)

## Visual Design

The game's interface combines Wabi-Sabi aesthetics (appreciation for imperfection and natural simplicity) with Brutalism (emphasis on raw functionality and visual clarity).

- **Color Palette**: Warm greys, muted olive green, rustic copper, pale cream
- **Typography**: Heavy-set sans-serif fonts with occasional handwritten-style annotations
- **Textures**: Background and interaction spaces mimic coarse paper or rough concrete

## License

MIT