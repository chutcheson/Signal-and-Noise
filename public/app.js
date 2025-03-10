// Signal & Noise: AI Secret Exchange Game
// Main frontend JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const setupForm = document.getElementById('setup-form');
  const gameSetup = document.getElementById('game-setup');
  const gameBoard = document.getElementById('game-board');
  const messagesDisplay = document.getElementById('messages-display');
  const gameLog = document.getElementById('game-log');
  const revealWordBtn = document.getElementById('reveal-word-btn');
  const nextPhaseBtn = document.getElementById('next-phase-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  // Game state
  let gameState = {
    senderReceiverModel: null,
    observerModel: null,
    numRounds: 6,
    currentRound: 1,
    currentLoop: 1,
    currentPhase: 0,
    secretWord: null,
    senderReceiverScore: 0,
    observerScore: 0,
    messages: [],
    category: null,
    gameActive: false,
  };

  // DOM update functions
  function updateScoreDisplay() {
    document.getElementById('sender-receiver-score').textContent = gameState.senderReceiverScore;
    document.getElementById('observer-score').textContent = gameState.observerScore;
  }

  function updateGameInfoDisplay() {
    document.getElementById('round-number').textContent = gameState.currentRound;
    document.getElementById('loop-number').textContent = gameState.currentLoop;
    document.getElementById('current-phase').textContent = gameState.currentPhase;
    document.getElementById('game-word').textContent = gameState.secretWord ? gameState.secretWord : '????';
  }

  function addGameLogEntry(text, className = '') {
    const logItem = document.createElement('div');
    logItem.className = `log-item ${className}`;
    logItem.textContent = text;
    gameLog.appendChild(logItem);
    gameLog.scrollTop = gameLog.scrollHeight;
  }

  function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message phase-transition`;
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = role.toUpperCase();
    
    const content = document.createElement('div');
    content.textContent = text;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);
    messagesDisplay.appendChild(messageDiv);
    
    // Auto-scroll to the latest message
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    
    // Store the message in game state
    gameState.messages.push({ role, text });
  }

  function showThinking(role) {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = `message ${role}-message thinking`;
    thinkingDiv.id = 'thinking-indicator';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = `${role.toUpperCase()} THINKING`;
    
    thinkingDiv.appendChild(header);
    messagesDisplay.appendChild(thinkingDiv);
    
    // Auto-scroll to the thinking indicator
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
  }

  function removeThinking() {
    const thinkingIndicator = document.getElementById('thinking-indicator');
    if (thinkingIndicator) {
      thinkingIndicator.remove();
    }
  }

  function showResultOverlay(winner) {
    document.getElementById('secret-word').textContent = gameState.secretWord;
    document.getElementById('final-sender-score').textContent = gameState.senderReceiverScore;
    document.getElementById('final-observer-score').textContent = gameState.observerScore;
    
    const winnerText = winner === 'tie' 
      ? 'Game ended in a tie!'
      : `${winner} wins!`;
    
    document.getElementById('winning-team').textContent = winnerText;
    resultOverlay.style.display = 'flex';
  }

  // Game logic functions
  async function startGame(event) {
    event.preventDefault();
    
    gameState.senderReceiverModel = document.getElementById('sender-receiver-model').value;
    gameState.observerModel = document.getElementById('observer-model').value;
    gameState.numRounds = parseInt(document.getElementById('rounds').value);
    gameState.currentRound = 1;
    gameState.currentLoop = 1;
    gameState.currentPhase = 0;
    gameState.senderReceiverScore = 0;
    gameState.observerScore = 0;
    gameState.gameActive = true;
    
    // Show game board, hide setup
    gameSetup.style.display = 'none';
    gameBoard.style.display = 'grid';
    
    // Update displays
    updateScoreDisplay();
    updateGameInfoDisplay();
    
    // Start the first round
    await startRound();
  }

  async function startRound() {
    // Clear messages and game log
    messagesDisplay.innerHTML = '';
    gameLog.innerHTML = '';
    
    gameState.currentLoop = 1;
    gameState.currentPhase = 0;
    gameState.messages = [];
    
    // Fetch a new secret word and category from the server
    try {
      const response = await fetch('/api/new-round');
      const data = await response.json();
      
      if (data.success) {
        gameState.secretWord = data.secretWord;
        gameState.category = data.category;
        
        // Log the start of the round
        addGameLogEntry(`Round ${gameState.currentRound} started.`, 'phase');
        
        // Update the game info display
        updateGameInfoDisplay();
        
        // Begin with Phase 0
        await executePhase0();
      } else {
        console.error('Failed to start new round:', data.message);
      }
    } catch (error) {
      console.error('Error starting new round:', error);
    }
  }

  async function executePhase0() {
    gameState.currentPhase = 0;
    updateGameInfoDisplay();
    
    addGameLogEntry(`Phase 0: Informing all models about the category: ${gameState.category}`, 'phase');
    
    // Notify all models about the category
    await processCategoryAnnouncement();
    
    // Move to the next phase
    await executePhase1();
  }

  async function processCategoryAnnouncement() {
    // Add a system message about the word being a noun
    addMessage('system', `The secret word is a common noun.`);
  }

  async function executePhase1() {
    gameState.currentPhase = 1;
    updateGameInfoDisplay();
    
    addGameLogEntry(`Phase 1: Sender crafting a message about the secret: ${gameState.secretWord}`, 'phase');
    
    // Show thinking indicator
    showThinking('sender');
    
    // Request message from Sender
    try {
      const response = await fetch('/api/sender-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretWord: gameState.secretWord,
          category: gameState.category,
          messages: gameState.messages,
          loop: gameState.currentLoop
        })
      });
      
      const data = await response.json();
      
      // Remove thinking indicator
      removeThinking();
      
      if (data.success) {
        // Add the sender's message to the display
        addMessage('sender', data.message);
        addGameLogEntry(`Sender sent a message about the secret word`);
        
        // Move to the next phase
        await executePhase2();
      } else {
        console.error('Failed to get sender message:', data.message);
      }
    } catch (error) {
      console.error('Error getting sender message:', error);
      removeThinking();
    }
  }

  async function executePhase2() {
    gameState.currentPhase = 2;
    updateGameInfoDisplay();
    
    addGameLogEntry(`Phase 2: Observer attempting to guess the secret word`, 'phase');
    
    // Show thinking indicator
    showThinking('observer');
    
    // Request guess from Observer
    try {
      const response = await fetch('/api/observer-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: gameState.category,
          messages: gameState.messages,
          secretWord: gameState.secretWord
        })
      });
      
      const data = await response.json();
      
      // Remove thinking indicator
      removeThinking();
      
      if (data.success) {
        // Add the observer's message to the display (or fallback to formatted guess)
        const displayMessage = data.message || `I think the secret word is "${data.guess}"`;
        addMessage('observer', displayMessage);
        
        // Check if the guess is correct
        if (data.isCorrect) {
          addGameLogEntry(`Observer correctly guessed: ${data.guess}`, 'guess-correct');
          
          // Observer gets a point
          gameState.observerScore++;
          updateScoreDisplay();
          
          // End the round
          await endRound('Observer');
        } else {
          addGameLogEntry(`Observer incorrectly guessed: ${data.guess}`, 'guess-incorrect');
          
          // Move to the next phase
          await executePhase3();
        }
      } else {
        console.error('Failed to get observer guess:', data.message);
      }
    } catch (error) {
      console.error('Error getting observer guess:', error);
      removeThinking();
    }
  }

  async function executePhase3() {
    gameState.currentPhase = 3;
    updateGameInfoDisplay();
    
    addGameLogEntry(`Phase 3: Receiver attempting to guess the secret word`, 'phase');
    
    // Show thinking indicator
    showThinking('receiver');
    
    // Request guess from Receiver
    try {
      const response = await fetch('/api/receiver-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: gameState.category,
          messages: gameState.messages,
          secretWord: gameState.secretWord
        })
      });
      
      const data = await response.json();
      
      // Remove thinking indicator
      removeThinking();
      
      if (data.success) {
        // Add the receiver's message to the display (or fallback to formatted guess)
        const displayMessage = data.message || `I think the secret word is "${data.guess}"`;
        addMessage('receiver', displayMessage);
        
        // Check if the guess is correct
        if (data.isCorrect) {
          addGameLogEntry(`Receiver correctly guessed: ${data.guess}`, 'guess-correct');
          
          // Sender/Receiver gets a point
          gameState.senderReceiverScore++;
          updateScoreDisplay();
          
          // End the round
          await endRound('Sender/Receiver');
        } else {
          addGameLogEntry(`Receiver incorrectly guessed: ${data.guess}`, 'guess-incorrect');
          
          // Move to the next phase
          await executePhase4();
        }
      } else {
        console.error('Failed to get receiver guess:', data.message);
      }
    } catch (error) {
      console.error('Error getting receiver guess:', error);
      removeThinking();
    }
  }

  async function executePhase4() {
    gameState.currentPhase = 4;
    updateGameInfoDisplay();
    
    addGameLogEntry(`Phase 4: Receiver sending response back to Sender`, 'phase');
    
    // Show thinking indicator
    showThinking('receiver');
    
    // Request response from Receiver
    try {
      const response = await fetch('/api/receiver-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: gameState.category,
          messages: gameState.messages
        })
      });
      
      const data = await response.json();
      
      // Remove thinking indicator
      removeThinking();
      
      if (data.success) {
        // Add the receiver's response to the display
        addMessage('receiver', data.message);
        addGameLogEntry(`Receiver sent a response to the Sender`);
        
        // Move to the next phase
        await executePhase5();
      } else {
        console.error('Failed to get receiver response:', data.message);
      }
    } catch (error) {
      console.error('Error getting receiver response:', error);
      removeThinking();
    }
  }

  async function executePhase5() {
    gameState.currentPhase = 5;
    updateGameInfoDisplay();
    
    // Check if we've reached the maximum loops (4)
    if (gameState.currentLoop >= 4) {
      addGameLogEntry(`Maximum loops reached. Round ends in a tie.`, 'phase');
      await endRound('tie');
      return;
    }
    
    addGameLogEntry(`Phase 5: Sender refining message (Loop ${gameState.currentLoop})`, 'phase');
    
    // Increment the loop counter
    gameState.currentLoop++;
    updateGameInfoDisplay();
    
    // Show thinking indicator
    showThinking('sender');
    
    // Request refined message from Sender
    try {
      const response = await fetch('/api/sender-refined-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretWord: gameState.secretWord,
          category: gameState.category,
          messages: gameState.messages,
          loop: gameState.currentLoop
        })
      });
      
      const data = await response.json();
      
      // Remove thinking indicator
      removeThinking();
      
      if (data.success) {
        // Add the sender's refined message to the display
        addMessage('sender', data.message);
        addGameLogEntry(`Sender sent a refined message`);
        
        // Restart from Phase 2
        await executePhase2();
      } else {
        console.error('Failed to get sender refined message:', data.message);
      }
    } catch (error) {
      console.error('Error getting sender refined message:', error);
      removeThinking();
    }
  }

  async function endRound(winner) {
    addGameLogEntry(`Round ${gameState.currentRound} ended. Winner: ${winner}`, 'phase');
    
    // Reveal the secret word
    document.getElementById('game-word').textContent = gameState.secretWord;
    
    // Check if we've completed all rounds
    if (gameState.currentRound >= gameState.numRounds) {
      // End the game
      await endGame();
    } else {
      // Wait for a moment before starting the next round
      setTimeout(async () => {
        gameState.currentRound++;
        await startRound();
      }, 3000);
    }
  }

  async function endGame() {
    gameState.gameActive = false;
    
    // Determine the winner
    let winner;
    if (gameState.senderReceiverScore > gameState.observerScore) {
      winner = 'Sender/Receiver';
    } else if (gameState.observerScore > gameState.senderReceiverScore) {
      winner = 'Observer';
    } else {
      winner = 'tie';
    }
    
    // Show the result overlay
    showResultOverlay(winner);
  }

  // Manual controls
  function revealWord() {
    document.getElementById('game-word').textContent = gameState.secretWord;
  }

  function manualNextPhase() {
    switch (gameState.currentPhase) {
      case 0:
        executePhase1();
        break;
      case 1:
        executePhase2();
        break;
      case 2:
        executePhase3();
        break;
      case 3:
        executePhase4();
        break;
      case 4:
        executePhase5();
        break;
      case 5:
        executePhase2();
        break;
      default:
        console.error('Invalid phase');
    }
  }

  function resetGame() {
    // Reset the game state
    gameState = {
      senderReceiverModel: null,
      observerModel: null,
      numRounds: 6,
      currentRound: 1,
      currentLoop: 1,
      currentPhase: 0,
      secretWord: null,
      senderReceiverScore: 0,
      observerScore: 0,
      messages: [],
      category: null,
      gameActive: false,
    };
    
    // Show setup, hide game board and result overlay
    gameSetup.style.display = 'block';
    gameBoard.style.display = 'none';
    resultOverlay.style.display = 'none';
    
    // Clear messages and game log
    messagesDisplay.innerHTML = '';
    gameLog.innerHTML = '';
  }

  // Event listeners
  setupForm.addEventListener('submit', startGame);
  revealWordBtn.addEventListener('click', revealWord);
  nextPhaseBtn.addEventListener('click', manualNextPhase);
  playAgainBtn.addEventListener('click', resetGame);
});