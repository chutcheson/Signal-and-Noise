/**
 * Signal & Noise: AI Secret Exchange Game
 * 
 * A game where AI models attempt to communicate a secret word through subtle 
 * messages while preventing a different AI model from intercepting the secret.
 */

// Game configuration and state
const config = {
  maxRounds: 6,
  maxLoops: 4,
  apiEndpoints: {
    models: '/api/models',
    secret: '/api/secret',
    senderMessage: '/api/sender-message',
    receiverGuess: '/api/receiver-guess',
    observerGuess: '/api/observer-guess',
    receiverMessage: '/api/receiver-message'
  }
};

// Game state
const gameState = {
  modelOne: '',
  modelTwo: '',
  currentRound: 1,
  currentLoop: 1,
  currentPhase: 'setup',
  secret: '',
  scores: {
    modelOne: 0,
    modelTwo: 0
  },
  rounds: [],
  currentRoundData: {
    messages: [],
    secret: '',
    outcome: null
  },
  // Returns the current model for Sender/Receiver role (alternates each round)
  getCurrentSenderReceiverModel: function() {
    return this.currentRound % 2 === 1 ? this.modelOne : this.modelTwo;
  },
  // Returns the current model for Observer role (alternates each round)
  getCurrentObserverModel: function() {
    return this.currentRound % 2 === 1 ? this.modelTwo : this.modelOne;
  },
  // Returns which model is currently playing as Sender/Receiver
  getCurrentSenderReceiverModelName: function() {
    return this.currentRound % 2 === 1 ? "Model One" : "Model Two";
  },
  // Returns which model is currently playing as Observer
  getCurrentObserverModelName: function() {
    return this.currentRound % 2 === 1 ? "Model Two" : "Model One";
  }
};

// DOM elements
const elements = {
  setupScreen: document.getElementById('setup-screen'),
  gameScreen: document.getElementById('game-screen'),
  setupForm: document.getElementById('setup-form'),
  modelOneSelect: document.getElementById('model-one'),
  modelTwoSelect: document.getElementById('model-two'),
  roundNumber: document.getElementById('round-number'),
  gameWord: document.getElementById('game-word'),
  senderReceiverDisplay: document.getElementById('sender-receiver-display'),
  observerDisplay: document.getElementById('observer-display'),
  messageArea: document.getElementById('message-area'),
  roundHistory: document.getElementById('round-history'),
  senderReceiverScore: document.getElementById('sender-receiver-score'),
  observerScore: document.getElementById('observer-score'),
  resultSummary: document.getElementById('result-summary'),
  secretWord: document.getElementById('secret-word'),
  finalSenderScore: document.getElementById('final-sender-score'),
  finalObserverScore: document.getElementById('final-observer-score'),
  finalModelOneName: document.getElementById('final-model-one-name'),
  finalModelTwoName: document.getElementById('final-model-two-name'),
  winningTeam: document.getElementById('winning-team'),
  continueViewingBtn: document.getElementById('continue-viewing-btn'),
  newGameBtn: document.getElementById('new-game-btn')
};

// Initialize the game
async function initGame() {
  await loadModels();
  attachEventListeners();
  updateTeamLabels();
}

// Update the score display based on current scores
function updateScoreDisplay() {
  elements.senderReceiverScore.textContent = gameState.scores.modelOne;
  elements.observerScore.textContent = gameState.scores.modelTwo;
}

// Update the team labels in the header
function updateTeamLabels() {
  // This will be called after models are selected
  document.addEventListener('modelsSelected', () => {
    if (gameState.modelOne && gameState.modelTwo) {
      // Get shortened model names with number indicators
      const modelOneName = `${getShortenedModelName(gameState.modelOne)} (#1)`;
      const modelTwoName = `${getShortenedModelName(gameState.modelTwo)} (#2)`;
      
      // Update the header labels
      document.querySelector('.team-score:nth-child(1) .team-name').textContent = modelOneName;
      document.querySelector('.team-score:nth-child(3) .team-name').textContent = modelTwoName;
    }
  });
}

// Load available models from the API
async function loadModels() {
  try {
    const response = await fetch(config.apiEndpoints.models);
    const data = await response.json();
    
    // Populate model selects
    populateModelSelect(elements.modelOneSelect, data.models);
    populateModelSelect(elements.modelTwoSelect, data.models);
  } catch (error) {
    console.error('Error loading models:', error);
    showError('Failed to load models. Please refresh the page.');
  }
}

// Populate a select element with model options
function populateModelSelect(selectElement, models) {
  selectElement.innerHTML = '';
  
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    selectElement.appendChild(option);
  });
}

// Attach event listeners
function attachEventListeners() {
  // Setup form submission
  elements.setupForm.addEventListener('submit', handleGameStart);
  
  // Continue viewing button - dismiss summary but keep game visible
  elements.continueViewingBtn.addEventListener('click', () => {
    elements.resultSummary.style.display = 'none';
  });
  
  // New game button
  elements.newGameBtn.addEventListener('click', () => {
    elements.resultSummary.style.display = 'none';
    elements.gameScreen.style.display = 'none';
    elements.setupScreen.style.display = 'block';
    
    // Remove game-active class to revert to normal layout
    document.querySelector('.app-container').classList.remove('game-active');
  });
}

// Handle game start
async function handleGameStart(event) {
  event.preventDefault();
  
  // Get selected models
  gameState.modelOne = elements.modelOneSelect.value;
  gameState.modelTwo = elements.modelTwoSelect.value;
  
  // Reset game state
  gameState.currentRound = 1;
  gameState.scores = { modelOne: 0, modelTwo: 0 };
  gameState.rounds = [];
  
  // Reset viewing index to follow current round
  viewingRoundIndex = -1;
  
  // Update UI
  elements.setupScreen.style.display = 'none';
  elements.gameScreen.style.display = 'block';
  
  // Add game-active class to container for full-screen layout
  document.querySelector('.app-container').classList.add('game-active');
  
  // Trigger custom event to update team labels with model names
  document.dispatchEvent(new Event('modelsSelected'));
  
  // Update the model displays based on their current roles
  updateModelDisplays();
  
  // Start the first round
  await startNewRound();
}

// Update the model displays based on current round (which defines the roles)
function updateModelDisplays() {
  // Update who's currently Sender/Receiver vs Observer
  elements.senderReceiverDisplay.textContent = getShortenedModelName(gameState.getCurrentSenderReceiverModel());
  elements.observerDisplay.textContent = getShortenedModelName(gameState.getCurrentObserverModel());
}

// Get shortened model name for display
function getShortenedModelName(modelId) {
  if (modelId.includes('claude-3-7-sonnet')) return 'Claude-3.7-Sonnet';
  if (modelId.includes('gpt-4o-mini')) return 'GPT-4o Mini';
  if (modelId.includes('gpt-4o')) return 'GPT-4o';
  return modelId;
}

// Start a new round
async function startNewRound() {
  // Reset round data
  gameState.currentLoop = 1;
  gameState.currentPhase = 'sender';
  gameState.currentRoundData = {
    messages: [],
    outcome: null
  };
  
  // Update round number display
  elements.roundNumber.textContent = gameState.currentRound;
  
  // Only clear and update the message area if user is not viewing a historical round
  if (viewingRoundIndex === -1) {
    elements.messageArea.innerHTML = '';
  }
  
  // Get a new secret word
  try {
    const response = await fetch(config.apiEndpoints.secret);
    const data = await response.json();
    gameState.secret = data.secret;
    gameState.currentRoundData.secret = data.secret;
    
    // Show secret word on UI only if viewing current round
    if (viewingRoundIndex === -1) {
      elements.gameWord.textContent = gameState.secret;
    }
    
    // Start the round flow
    await runSenderPhase();
  } catch (error) {
    console.error('Error getting secret word:', error);
    showError('Failed to get secret word. Please try again.');
  }
}

// Run the Sender phase
async function runSenderPhase() {
  gameState.currentPhase = 'sender';
  
  // Show loading message only if viewing current round
  if (viewingRoundIndex === -1) {
    addMessage('thinking', 'Sender', 'Thinking about how to communicate the secret...');
  }
  
  try {
    // Get previous receiver message if this isn't the first loop
    const receiverMessage = gameState.currentLoop > 1 
      ? gameState.currentRoundData.messages[gameState.currentRoundData.messages.length - 1].content
      : null;
    
    // Call API to get sender message
    const response = await fetch(config.apiEndpoints.senderMessage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: gameState.getCurrentSenderReceiverModel(),
        secret: gameState.secret,
        conversationHistory: gameState.currentRoundData.messages,
        loop: gameState.currentLoop,
        receiverModel: gameState.getCurrentSenderReceiverModel(),
        observerModel: gameState.getCurrentObserverModel()
      })
    });
    
    const data = await response.json();
    
    // Remove temporary thinking/loading messages only
    removeTempThinkingMessages();
    
    // Add sender message and reasoning to UI only if viewing current round
    if (viewingRoundIndex === -1) {
      addMessage('reasoning', 'Sender (Reasoning)', data.reasoning);
      addMessage('sender', 'Sender', data.message);
    }
    
    // Add to messages history
    gameState.currentRoundData.messages.push({
      role: 'sender',
      content: data.message,
      reasoning: data.reasoning
    });
    
    // Move to observer phase
    await runObserverPhase(data.message);
  } catch (error) {
    console.error('Error getting sender message:', error);
    removeThinkingMessages();
    showError('Failed to get sender message. Please try again.');
  }
}

// Run the Observer phase
async function runObserverPhase(senderMessage) {
  gameState.currentPhase = 'observer';
  
  // Show loading message only if viewing current round
  if (viewingRoundIndex === -1) {
    addMessage('thinking', 'Observer', 'Analyzing the message and making a guess...');
  }
  
  try {
    // Call API to get observer guess
    const response = await fetch(config.apiEndpoints.observerGuess, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: gameState.getCurrentObserverModel(),
        secret: gameState.secret,
        senderMessage,
        conversationHistory: gameState.currentRoundData.messages,
        loop: gameState.currentLoop,
        senderModel: gameState.getCurrentSenderReceiverModel(),
        receiverModel: gameState.getCurrentSenderReceiverModel()
      })
    });
    
    const data = await response.json();
    
    // Remove temporary thinking/loading messages only
    removeTempThinkingMessages();
    
    // Add observer reasoning and guess to UI only if viewing current round
    if (viewingRoundIndex === -1) {
      addMessage('reasoning', 'Observer (Reasoning)', data.reasoning);
      addGuessMessage('observer', 'Observer', data.guess, data.correct);
    }
    
    // Add to messages history
    gameState.currentRoundData.messages.push({
      role: 'observer',
      content: data.guess,
      reasoning: data.reasoning,
      correct: data.correct
    });
    
    // Check if Observer guessed correctly
    if (data.correct) {
      // Observer wins the round - increment score for whichever model is Observer
      if (gameState.currentRound % 2 === 1) {
        // Model Two is Observer in odd rounds
        gameState.scores.modelTwo++;
      } else {
        // Model One is Observer in even rounds
        gameState.scores.modelOne++;
      }
      
      // Update score display
      updateScoreDisplay();
      
      // Update round data
      gameState.currentRoundData.outcome = 'observer';
      
      // Save round data
      gameState.rounds.push({...gameState.currentRoundData});
      
      // Update round history
      updateRoundHistory();
      
      // Check if game is over
      if (gameState.currentRound >= config.maxRounds || 
          gameState.scores.modelOne >= Math.ceil(config.maxRounds / 2) ||
          gameState.scores.modelTwo >= Math.ceil(config.maxRounds / 2)) {
        endGame();
      } else {
        // Wait a moment before starting new round
        setTimeout(() => {
          gameState.currentRound++;
          // Update model displays for new round (swapped roles)
          updateModelDisplays();
          startNewRound();
        }, 3000);
      }
    } else {
      // Observer failed, move to receiver phase
      await runReceiverGuessPhase(senderMessage);
    }
  } catch (error) {
    console.error('Error getting observer guess:', error);
    removeThinkingMessages();
    showError('Failed to get observer guess. Please try again.');
  }
}

// Run the Receiver guess phase
async function runReceiverGuessPhase(senderMessage) {
  gameState.currentPhase = 'receiver-guess';
  
  // Show loading message only if viewing current round
  if (viewingRoundIndex === -1) {
    addMessage('thinking', 'Receiver', 'Interpreting the message and making a guess...');
  }
  
  try {
    // Call API to get receiver guess
    const response = await fetch(config.apiEndpoints.receiverGuess, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: gameState.getCurrentSenderReceiverModel(),
        secret: gameState.secret,
        senderMessage,
        conversationHistory: gameState.currentRoundData.messages,
        loop: gameState.currentLoop,
        senderModel: gameState.getCurrentSenderReceiverModel(),
        observerModel: gameState.getCurrentObserverModel()
      })
    });
    
    const data = await response.json();
    
    // Remove temporary thinking/loading messages only
    removeTempThinkingMessages();
    
    // Add receiver reasoning and guess to UI only if viewing current round
    if (viewingRoundIndex === -1) {
      addMessage('reasoning', 'Receiver (Reasoning)', data.reasoning);
      addGuessMessage('receiver', 'Receiver', data.guess, data.correct);
    }
    
    // Add to messages history
    gameState.currentRoundData.messages.push({
      role: 'receiver-guess',
      content: data.guess,
      reasoning: data.reasoning,
      correct: data.correct
    });
    
    // Check if Receiver guessed correctly
    if (data.correct) {
      // Sender/Receiver team wins the round - increment score for whichever model is Sender/Receiver
      if (gameState.currentRound % 2 === 1) {
        // Model One is Sender/Receiver in odd rounds
        gameState.scores.modelOne++;
      } else {
        // Model Two is Sender/Receiver in even rounds
        gameState.scores.modelTwo++;
      }
      
      // Update score display
      updateScoreDisplay();
      
      // Update round data
      gameState.currentRoundData.outcome = 'receiver';
      
      // Save round data
      gameState.rounds.push({...gameState.currentRoundData});
      
      // Update round history
      updateRoundHistory();
      
      // Check if game is over
      if (gameState.currentRound >= config.maxRounds || 
          gameState.scores.modelOne >= Math.ceil(config.maxRounds / 2) ||
          gameState.scores.modelTwo >= Math.ceil(config.maxRounds / 2)) {
        endGame();
      } else {
        // Wait a moment before starting new round
        setTimeout(() => {
          gameState.currentRound++;
          // Update model displays for new round (swapped roles)
          updateModelDisplays();
          startNewRound();
        }, 3000);
      }
    } else {
      // Receiver failed, check if we've hit the max loops
      if (gameState.currentLoop >= config.maxLoops) {
        // Max loops reached, round ends in a tie
        gameState.currentRoundData.outcome = 'tie';
        
        // Save round data
        gameState.rounds.push({...gameState.currentRoundData});
        
        // Update round history
        updateRoundHistory();
        
        // Move to next round or end game
        if (gameState.currentRound >= config.maxRounds || 
            gameState.scores.modelOne >= Math.ceil(config.maxRounds / 2) ||
            gameState.scores.modelTwo >= Math.ceil(config.maxRounds / 2)) {
          endGame();
        } else {
          // Wait a moment before starting new round
          setTimeout(() => {
            gameState.currentRound++;
            // Update model displays for new round (swapped roles)
            updateModelDisplays();
            startNewRound();
          }, 3000);
        }
      } else {
        // Continue to receiver response phase
        await runReceiverResponsePhase(senderMessage, data);
      }
    }
  } catch (error) {
    console.error('Error getting receiver guess:', error);
    removeThinkingMessages();
    showError('Failed to get receiver guess. Please try again.');
  }
}

// Run the Receiver response phase
async function runReceiverResponsePhase(senderMessage, receiverGuessData) {
  gameState.currentPhase = 'receiver-response';
  
  // Show loading message only if viewing current round
  if (viewingRoundIndex === -1) {
    addMessage('thinking', 'Receiver', 'Crafting a response to the Sender...');
  }
  
  try {
    // Call API to get receiver message
    const response = await fetch(config.apiEndpoints.receiverMessage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: gameState.getCurrentSenderReceiverModel(),
        secret: gameState.secret,
        senderMessage,
        receiverGuess: receiverGuessData,
        conversationHistory: gameState.currentRoundData.messages,
        loop: gameState.currentLoop,
        senderModel: gameState.getCurrentSenderReceiverModel(),
        observerModel: gameState.getCurrentObserverModel()
      })
    });
    
    const data = await response.json();
    
    // Remove temporary thinking/loading messages only
    removeTempThinkingMessages();
    
    // Add receiver reasoning and message to UI only if viewing current round
    if (viewingRoundIndex === -1) {
      addMessage('reasoning', 'Receiver (Reasoning)', data.reasoning);
      addMessage('receiver', 'Receiver', data.message);
    }
    
    // Add to messages history
    gameState.currentRoundData.messages.push({
      role: 'receiver',
      content: data.message,
      reasoning: data.reasoning
    });
    
    // Increment loop counter and go back to sender phase
    gameState.currentLoop++;
    
    // Short delay before continuing
    setTimeout(() => {
      runSenderPhase();
    }, 1500);
  } catch (error) {
    console.error('Error getting receiver message:', error);
    removeThinkingMessages();
    showError('Failed to get receiver message. Please try again.');
  }
}

// End the game and show results
function endGame() {
  // Update scores
  elements.secretWord.textContent = gameState.secret;
  elements.finalSenderScore.textContent = gameState.scores.modelOne;
  elements.finalObserverScore.textContent = gameState.scores.modelTwo;
  
  // Set model names in results
  const modelOneName = `${getShortenedModelName(gameState.modelOne)} (#1)`;
  const modelTwoName = `${getShortenedModelName(gameState.modelTwo)} (#2)`;
  elements.finalModelOneName.textContent = modelOneName;
  elements.finalModelTwoName.textContent = modelTwoName;
  
  // Show winner
  if (gameState.scores.modelOne > gameState.scores.modelTwo) {
    elements.winningTeam.textContent = `${modelOneName} Wins!`;
  } else if (gameState.scores.modelTwo > gameState.scores.modelOne) {
    elements.winningTeam.textContent = `${modelTwoName} Wins!`;
  } else {
    elements.winningTeam.textContent = "It's a Tie!";
  }
  
  // Show result summary without blocking the game view
  elements.resultSummary.style.display = 'block';
}

// Add a message to the message area
function addMessage(type, role, content) {
  const messageDiv = document.createElement('div');
  
  if (type === 'thinking') {
    // Temporary loading messages
    messageDiv.className = `message thinking`;
  } else if (type === 'reasoning') {
    // Reasoning messages get their own distinct styling
    messageDiv.className = `message reasoning`;
    // Add role as data attribute for CSS targeting
    messageDiv.dataset.role = role;
  } else {
    // Use the role for styling (sender, receiver, or observer)
    const roleClass = role.toLowerCase().includes('observer') ? 'observer' : 
                     (role.toLowerCase().includes('receiver') ? 'receiver' : 'sender');
    
    messageDiv.className = `message ${roleClass}`;
  }
  
  const roleLabel = document.createElement('div');
  roleLabel.className = 'role-label';
  roleLabel.textContent = role;
  
  const messageContent = document.createElement('div');
  messageContent.textContent = content;
  
  messageDiv.appendChild(roleLabel);
  messageDiv.appendChild(messageContent);
  
  elements.messageArea.appendChild(messageDiv);
  
  // Scroll to bottom with a small delay to ensure proper rendering
  setTimeout(() => {
    elements.messageArea.scrollTop = elements.messageArea.scrollHeight;
  }, 50);
}

// Add a guess message with correct/incorrect indication
function addGuessMessage(type, role, guess, correct) {
  const messageDiv = document.createElement('div');
  
  // Use the role for styling (sender, receiver, or observer)
  const roleClass = role.toLowerCase().includes('observer') ? 'observer' : 
                   (role.toLowerCase().includes('receiver') ? 'receiver' : 'sender');
  
  messageDiv.className = `message ${roleClass}`;
  
  const roleLabel = document.createElement('div');
  roleLabel.className = 'role-label';
  roleLabel.textContent = role;
  
  const messageContent = document.createElement('div');
  messageContent.textContent = `I think the secret word is:`;
  
  const guessSpan = document.createElement('span');
  guessSpan.className = `guess ${correct ? 'correct' : 'incorrect'}`;
  guessSpan.textContent = guess;
  
  messageContent.appendChild(guessSpan);
  
  messageDiv.appendChild(roleLabel);
  messageDiv.appendChild(messageContent);
  
  elements.messageArea.appendChild(messageDiv);
  
  // Scroll to bottom with a small delay to ensure proper rendering
  setTimeout(() => {
    elements.messageArea.scrollTop = elements.messageArea.scrollHeight;
  }, 50);
}

// Remove temporary thinking/loading messages from the UI (but keep reasoning messages)
function removeTempThinkingMessages() {
  // Only remove thinking messages that don't have "Reasoning" in their text
  // These are the temporary loading messages, not the actual reasoning content
  const tempThinkingMessages = Array.from(elements.messageArea.querySelectorAll('.message.thinking')).filter(msg => {
    const roleLabel = msg.querySelector('.role-label');
    return roleLabel && !roleLabel.textContent.includes('Reasoning');
  });
  
  tempThinkingMessages.forEach(msg => msg.remove());
}

// Legacy function maintained for backward compatibility, but modified to use our new approach
function removeThinkingMessages() {
  removeTempThinkingMessages();
}

// Track which round is being viewed
let viewingRoundIndex = -1; // -1 means viewing the current round

// Update the round history panel
function updateRoundHistory() {
  // Clear current history
  elements.roundHistory.innerHTML = '';
  
  // Keep track of active round 
  const currentRoundIndex = gameState.currentRound - 1;
  
  // Store the most recent round for later display
  const mostRecentRound = gameState.rounds[gameState.rounds.length - 1];
  
  // Add each round
  gameState.rounds.forEach((round, index) => {
    const roundItem = document.createElement('div');
    roundItem.className = 'round-item';
    
    // Mark the current round as active only if we're not viewing a specific round
    if ((viewingRoundIndex === -1 && index === currentRoundIndex) || 
        index === viewingRoundIndex) {
      roundItem.classList.add('active');
    }
    
    const roundNumber = document.createElement('div');
    roundNumber.className = 'round-number';
    roundNumber.textContent = `Round ${index + 1}`;
    
    const roundWord = document.createElement('div');
    roundWord.className = 'round-word';
    roundWord.textContent = round.secret;
    
    const roundResult = document.createElement('div');
    roundResult.className = `round-result ${round.outcome === 'observer' ? 'observer-win' : (round.outcome === 'receiver' ? 'receiver-win' : '')}`;
    
    if (round.outcome === 'observer') {
      roundResult.textContent = 'Observer guessed correctly';
    } else if (round.outcome === 'receiver') {
      roundResult.textContent = 'Receiver guessed correctly';
    } else {
      roundResult.textContent = 'No correct guesses (tie)';
    }
    
    roundItem.appendChild(roundNumber);
    roundItem.appendChild(roundWord);
    roundItem.appendChild(roundResult);
    
    // Add click event to show this round's messages
    roundItem.addEventListener('click', () => {
      // Remove active class from all items
      document.querySelectorAll('.round-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked item
      roundItem.classList.add('active');
      
      // Update the viewing round index
      viewingRoundIndex = index;
      
      // Display the messages from this round
      displayRoundMessages(round);
    });
    
    elements.roundHistory.appendChild(roundItem);
  });
  
  // When game is in progress, only show most recent round if we're not already viewing a specific round
  if (mostRecentRound && viewingRoundIndex === -1) {
    displayRoundMessages(mostRecentRound);
  } else if (viewingRoundIndex >= 0 && viewingRoundIndex < gameState.rounds.length) {
    // If we are viewing a specific round and it still exists, keep it highlighted
    document.querySelectorAll('.round-item').forEach((item, index) => {
      item.classList.toggle('active', index === viewingRoundIndex);
    });
  }
}

// Display messages from the current active round
function displayCurrentRoundMessages() {
  // Clear the message area
  elements.messageArea.innerHTML = '';
  
  // Update game word display
  elements.gameWord.textContent = gameState.secret;
  
  // Add a heading for the current round
  const roundHeading = document.createElement('div');
  roundHeading.className = 'message round-heading';
  roundHeading.innerHTML = `<strong>Current Round (${gameState.currentRound})</strong>`;
  elements.messageArea.appendChild(roundHeading);
  
  // Add each message from the current round
  gameState.currentRoundData.messages.forEach(msg => {
    if (msg.role === 'sender') {
      // Show sender reasoning
      addMessage('reasoning', 'Sender (Reasoning)', msg.reasoning);
      
      // Show sender message
      addMessage('sender', 'Sender', msg.content);
    } 
    else if (msg.role === 'observer') {
      // Show observer reasoning
      addMessage('reasoning', 'Observer (Reasoning)', msg.reasoning);
      
      // Show observer guess with correct/incorrect indicator
      addGuessMessage('observer', 'Observer', msg.content, msg.correct);
    } 
    else if (msg.role === 'receiver-guess') {
      // Show receiver reasoning
      addMessage('reasoning', 'Receiver (Reasoning)', msg.reasoning);
      
      // Show receiver guess with correct/incorrect indicator
      addGuessMessage('receiver', 'Receiver', msg.content, msg.correct);
    } 
    else if (msg.role === 'receiver') {
      // Show receiver reasoning
      addMessage('reasoning', 'Receiver (Reasoning)', msg.reasoning);
      
      // Show receiver message
      addMessage('receiver', 'Receiver', msg.content);
    }
  });
}

// Display messages from a specific round
function displayRoundMessages(round) {
  // Clear the message area
  elements.messageArea.innerHTML = '';
  
  // Update the game word display to show this round's secret
  elements.gameWord.textContent = round.secret;
  
  // Add a "Return to Current Round" button if we're viewing history during an active game
  if (gameState.currentRoundData.messages.length > 0 && round !== gameState.currentRoundData) {
    const returnButton = document.createElement('button');
    returnButton.className = 'secondary-btn return-to-current';
    returnButton.textContent = 'Return to Current Round';
    returnButton.style.alignSelf = 'center';
    returnButton.style.margin = '10px 0';
    
    returnButton.addEventListener('click', () => {
      // Reset the viewing index to indicate we're viewing the current round
      viewingRoundIndex = -1;
      
      // Display current round's messages
      displayCurrentRoundMessages();
      
      // Update active state in round history
      document.querySelectorAll('.round-item').forEach((item, index) => {
        item.classList.toggle('active', index === gameState.currentRound - 1);
      });
    });
    
    elements.messageArea.appendChild(returnButton);
  }
  
  // Display a heading for the round
  const roundHeading = document.createElement('div');
  roundHeading.className = 'message round-heading';
  roundHeading.innerHTML = `<strong>Round ${gameState.rounds.indexOf(round) + 1} Messages</strong>`;
  elements.messageArea.appendChild(roundHeading);
  
  // Add each message in the round
  round.messages.forEach(msg => {
    if (msg.role === 'sender') {
      // Show sender reasoning
      addMessage('reasoning', 'Sender (Reasoning)', msg.reasoning);
      
      // Show sender message
      addMessage('sender', 'Sender', msg.content);
    } 
    else if (msg.role === 'observer') {
      // Show observer reasoning
      addMessage('reasoning', 'Observer (Reasoning)', msg.reasoning);
      
      // Show observer guess with correct/incorrect indicator
      addGuessMessage('observer', 'Observer', msg.content, msg.correct);
    } 
    else if (msg.role === 'receiver-guess') {
      // Show receiver reasoning
      addMessage('reasoning', 'Receiver (Reasoning)', msg.reasoning);
      
      // Show receiver guess with correct/incorrect indicator
      addGuessMessage('receiver', 'Receiver', msg.content, msg.correct);
    } 
    else if (msg.role === 'receiver') {
      // Show receiver reasoning
      addMessage('reasoning', 'Receiver (Reasoning)', msg.reasoning);
      
      // Show receiver message
      addMessage('receiver', 'Receiver', msg.content);
    }
  });
  
  // Scroll to top
  elements.messageArea.scrollTop = 0;
}

// Show an error message
function showError(message) {
  console.error(message);
  alert(`Error: ${message}`);
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);