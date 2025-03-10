// Game state
const gameState = {
  currentScreen: 'start',
  senderReceiverModel: '',
  observerModel: '',
  totalRounds: 6,
  currentRound: 1,
  currentLoop: 1,
  currentPhase: 'sender',
  currentSecret: '',
  scores: {
    team1: 0, // Sender/Receiver
    team2: 0  // Observer
  },
  history: [],
  currentHistory: [],
  roundHistory: []
};

// DOM elements
const elements = {
  screens: {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
  },
  selects: {
    senderReceiverModel: document.getElementById('sender-receiver-model'),
    observerModel: document.getElementById('observer-model'),
    roundCount: document.getElementById('round-count')
  },
  buttons: {
    startGame: document.getElementById('start-game'),
    nextPhase: document.getElementById('next-phase'),
    newGame: document.getElementById('new-game')
  },
  game: {
    currentSecret: document.getElementById('current-secret'),
    currentRound: document.getElementById('current-round'),
    totalRounds: document.getElementById('total-rounds'),
    currentLoop: document.getElementById('current-loop'),
    currentPhase: document.getElementById('current-phase'),
    team1Score: document.getElementById('team-1-score'),
    team2Score: document.getElementById('team-2-score'),
    srModelDisplay: document.getElementById('sr-model-display'),
    oModelDisplay: document.getElementById('o-model-display'),
    messageContainer: document.getElementById('message-container'),
    historyContainer: document.getElementById('history-container'),
    thinkingArea: document.getElementById('thinking-area')
  },
  results: {
    finalTeam1Score: document.getElementById('final-team-1-score'),
    finalTeam2Score: document.getElementById('final-team-2-score'),
    roundHistory: document.getElementById('round-history')
  },
  templates: {
    message: document.getElementById('message-template'),
    guess: document.getElementById('guess-template')
  }
};

// Initialize the application
async function init() {
  // Load available models
  const models = await fetchModels();
  populateModelSelects(models);
  
  // Add event listeners
  elements.buttons.startGame.addEventListener('click', startGame);
  elements.buttons.nextPhase.addEventListener('click', handleNextPhase);
  elements.buttons.newGame.addEventListener('click', resetGame);
}

// Fetch available models
async function fetchModels() {
  try {
    const response = await fetch('/api/models');
    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

// Populate model select dropdowns
function populateModelSelects(models) {
  // Clear existing options
  elements.selects.senderReceiverModel.innerHTML = '';
  elements.selects.observerModel.innerHTML = '';
  
  // Add models to selects
  models.forEach(model => {
    const senderReceiverOption = document.createElement('option');
    senderReceiverOption.value = model.id;
    senderReceiverOption.textContent = model.name;
    elements.selects.senderReceiverModel.appendChild(senderReceiverOption);
    
    const observerOption = document.createElement('option');
    observerOption.value = model.id;
    observerOption.textContent = model.name;
    elements.selects.observerModel.appendChild(observerOption);
  });
  
  // Default select different models
  if (models.length >= 2) {
    elements.selects.senderReceiverModel.value = models[0].id;
    elements.selects.observerModel.value = models[1].id;
  }
}

// Start new game
async function startGame() {
  // Get game settings
  gameState.initialSenderReceiverModel = elements.selects.senderReceiverModel.value;
  gameState.initialObserverModel = elements.selects.observerModel.value;
  gameState.totalRounds = parseInt(elements.selects.roundCount.value, 10);
  
  // Set initial models
  gameState.senderReceiverModel = gameState.initialSenderReceiverModel;
  gameState.observerModel = gameState.initialObserverModel;
  
  // Reset game state
  gameState.currentRound = 1;
  gameState.scores = { team1: 0, team2: 0 };
  gameState.roundHistory = [];
  
  // Update UI
  elements.game.totalRounds.textContent = gameState.totalRounds;
  updateModelDisplay();
  
  // Switch to game screen
  showScreen('game');
  
  // Start first round
  await startRound();
}

// Update the model display in the UI
function updateModelDisplay() {
  elements.game.srModelDisplay.textContent = getModelDisplayName(gameState.senderReceiverModel);
  elements.game.oModelDisplay.textContent = getModelDisplayName(gameState.observerModel);
}

// Get display name for model
function getModelDisplayName(modelId) {
  // Extract just the base model name
  if (modelId.startsWith('gpt')) {
    return modelId.split('-').slice(0, 2).join('-');
  } else if (modelId.startsWith('claude')) {
    // Extract "claude-3-7-sonnet" from the full model ID
    return modelId.split('-').slice(0, 4).join('-');
  }
  return modelId;
}

// Start a new round
async function startRound() {
  // Reset round state
  gameState.currentLoop = 1;
  gameState.currentPhase = 'sender';
  gameState.currentHistory = [];
  
  // Swap models every two rounds (or based on your desired frequency)
  if (gameState.currentRound % 2 === 0) {
    // Swap sender/receiver and observer models
    const temp = gameState.senderReceiverModel;
    gameState.senderReceiverModel = gameState.observerModel;
    gameState.observerModel = temp;
    
    // Update model display
    updateModelDisplay();
  }
  
  // Update UI
  elements.game.currentRound.textContent = gameState.currentRound;
  elements.game.currentLoop.textContent = gameState.currentLoop;
  elements.game.currentPhase.textContent = 'Sender';
  
  // Clear message container
  elements.game.messageContainer.innerHTML = '';
  elements.game.historyContainer.innerHTML = '';
  
  // Get new secret
  await getNewSecret();
  
  // Add round start message
  const roundInfoElement = document.createElement('div');
  roundInfoElement.className = 'message-box';
  roundInfoElement.innerHTML = `
    <div class="message-header">Round ${gameState.currentRound}</div>
    <div class="message-content">
      <strong>Sender/Receiver:</strong> ${getModelDisplayName(gameState.senderReceiverModel)}<br>
      <strong>Observer:</strong> ${getModelDisplayName(gameState.observerModel)}<br>
      <strong>Secret Word:</strong> ${gameState.currentSecret}
    </div>
  `;
  elements.game.messageContainer.appendChild(roundInfoElement);
  
  // Wait for user to start the round
  elements.buttons.nextPhase.textContent = 'Start Round';
}

// Get new secret word
async function getNewSecret() {
  try {
    elements.game.currentSecret.textContent = 'Loading...';
    
    const response = await fetch('/api/secret');
    const data = await response.json();
    
    gameState.currentSecret = data.secret;
    elements.game.currentSecret.textContent = gameState.currentSecret;
  } catch (error) {
    console.error('Error getting secret word:', error);
    elements.game.currentSecret.textContent = 'Error';
  }
}

// Handle next phase button click
async function handleNextPhase() {
  const currentPhase = gameState.currentPhase;
  
  // Hide the next button during processing
  elements.buttons.nextPhase.disabled = true;
  
  if (currentPhase === 'sender') {
    // Sender phase - generate sender message
    await handleSenderPhase();
  } else if (currentPhase === 'observer') {
    // Observer phase - generate observer guess
    await handleObserverPhase();
  } else if (currentPhase === 'receiver') {
    // Receiver phase - generate receiver guess
    await handleReceiverPhase();
  } else if (currentPhase === 'receiver_response') {
    // Receiver response phase - generate receiver response message
    await handleReceiverResponsePhase();
  }
  
  // Re-enable the button
  elements.buttons.nextPhase.disabled = false;
}

// Handle sender phase
async function handleSenderPhase() {
  showThinking(true);
  
  try {
    // Get last receiver message if it exists
    const lastReceiverMessage = gameState.currentHistory.filter(item => 
      item.role === 'receiver' && item.type === 'message'
    ).pop()?.message || null;
    
    // Create history for API
    const apiHistory = gameState.currentHistory.map(item => ({
      role: item.role,
      message: item.message
    }));
    
    // Call API to generate sender message
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: gameState.senderReceiverModel,
        role: 'sender',
        message: lastReceiverMessage,
        secret: gameState.currentSecret,
        history: apiHistory,
        senderReceiverModel: gameState.senderReceiverModel,
        observerModel: gameState.observerModel
      })
    });
    
    const data = await response.json();
    
    // Add message to history
    const messageEntry = {
      role: 'sender',
      type: 'message',
      message: data.message,
      reasoning: data.reasoning
    };
    
    gameState.currentHistory.push(messageEntry);
    
    // Display message
    displayMessage(messageEntry);
    updateHistoryPanel(messageEntry);
    
    // Update UI for next phase
    gameState.currentPhase = 'observer';
    elements.game.currentPhase.textContent = 'Observer';
    elements.buttons.nextPhase.textContent = 'Continue to Observer Guess';
  } catch (error) {
    console.error('Error in sender phase:', error);
    alert('Error generating sender message. Please try again.');
  } finally {
    showThinking(false);
  }
}

// Handle observer phase
async function handleObserverPhase() {
  showThinking(true);
  
  try {
    // Create history for API
    const apiHistory = gameState.currentHistory.map(item => ({
      role: item.role,
      message: item.message
    }));
    
    // Call API to generate observer guess
    const response = await fetch('/api/guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: gameState.observerModel,
        role: 'observer',
        message: null,
        secret: gameState.currentSecret,
        history: apiHistory,
        senderReceiverModel: gameState.senderReceiverModel,
        observerModel: gameState.observerModel
      })
    });
    
    const data = await response.json();
    
    // Add guess to history
    const guessEntry = {
      role: 'observer',
      type: 'guess',
      guess: data.guess,
      reasoning: data.reasoning,
      correct: data.guess.toLowerCase().trim() === gameState.currentSecret.toLowerCase().trim()
    };
    
    gameState.currentHistory.push(guessEntry);
    
    // Display guess
    displayGuess(guessEntry);
    updateHistoryPanel(guessEntry);
    
    // Check if observer guessed correctly
    if (guessEntry.correct) {
      // Observer wins the round
      gameState.scores.team2++;
      elements.game.team2Score.textContent = gameState.scores.team2;
      
      // End the round
      await finalizeRound('observer');
    } else {
      // Continue to receiver phase
      gameState.currentPhase = 'receiver';
      elements.game.currentPhase.textContent = 'Receiver';
      elements.buttons.nextPhase.textContent = 'Continue to Receiver Guess';
    }
  } catch (error) {
    console.error('Error in observer phase:', error);
    alert('Error generating observer guess. Please try again.');
  } finally {
    showThinking(false);
  }
}

// Handle receiver phase
async function handleReceiverPhase() {
  showThinking(true);
  
  try {
    // Get last sender message
    const lastSenderMessage = gameState.currentHistory.filter(item => 
      item.role === 'sender' && item.type === 'message'
    ).pop()?.message || '';
    
    // Create history for API
    const apiHistory = gameState.currentHistory.map(item => ({
      role: item.role,
      message: item.message
    }));
    
    // Call API to generate receiver guess
    const response = await fetch('/api/guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: gameState.senderReceiverModel,
        role: 'receiver',
        message: lastSenderMessage,
        secret: gameState.currentSecret,
        history: apiHistory,
        senderReceiverModel: gameState.senderReceiverModel,
        observerModel: gameState.observerModel
      })
    });
    
    const data = await response.json();
    
    // Add guess to history
    const guessEntry = {
      role: 'receiver',
      type: 'guess',
      guess: data.guess,
      reasoning: data.reasoning,
      correct: data.guess.toLowerCase().trim() === gameState.currentSecret.toLowerCase().trim()
    };
    
    gameState.currentHistory.push(guessEntry);
    
    // Display guess
    displayGuess(guessEntry);
    updateHistoryPanel(guessEntry);
    
    // Check if receiver guessed correctly
    if (guessEntry.correct) {
      // Sender/Receiver team wins the round
      gameState.scores.team1++;
      elements.game.team1Score.textContent = gameState.scores.team1;
      
      // End the round
      await finalizeRound('receiver');
    } else {
      // Check if we've reached the max loops
      if (gameState.currentLoop >= 4) {
        // Max loops reached, round ends in a tie
        await finalizeRound('tie');
      } else {
        // Continue to receiver response phase
        gameState.currentPhase = 'receiver_response';
        elements.game.currentPhase.textContent = 'Receiver Response';
        elements.buttons.nextPhase.textContent = 'Continue to Receiver Response';
      }
    }
  } catch (error) {
    console.error('Error in receiver phase:', error);
    alert('Error generating receiver guess. Please try again.');
  } finally {
    showThinking(false);
  }
}

// Handle receiver response phase
async function handleReceiverResponsePhase() {
  showThinking(true);
  
  try {
    // Get last sender message
    const lastSenderMessage = gameState.currentHistory.filter(item => 
      item.role === 'sender' && item.type === 'message'
    ).pop()?.message || '';
    
    // Create history for API
    const apiHistory = gameState.currentHistory.map(item => ({
      role: item.role,
      message: item.message
    }));
    
    // Call API to generate receiver response message
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: gameState.senderReceiverModel,
        role: 'receiver',
        message: lastSenderMessage,
        secret: gameState.currentSecret,
        history: apiHistory,
        senderReceiverModel: gameState.senderReceiverModel,
        observerModel: gameState.observerModel
      })
    });
    
    const data = await response.json();
    
    // Add message to history
    const messageEntry = {
      role: 'receiver',
      type: 'message',
      message: data.message,
      reasoning: data.reasoning
    };
    
    gameState.currentHistory.push(messageEntry);
    
    // Display message
    displayMessage(messageEntry);
    updateHistoryPanel(messageEntry);
    
    // Increment loop counter and update UI
    gameState.currentLoop++;
    elements.game.currentLoop.textContent = gameState.currentLoop;
    
    // Update for next phase (back to sender)
    gameState.currentPhase = 'sender';
    elements.game.currentPhase.textContent = 'Sender';
    elements.buttons.nextPhase.textContent = 'Continue to Sender Message';
  } catch (error) {
    console.error('Error in receiver response phase:', error);
    alert('Error generating receiver response. Please try again.');
  } finally {
    showThinking(false);
  }
}

// Finalize the round
async function finalizeRound(winner) {
  // Add round details to history
  gameState.roundHistory.push({
    round: gameState.currentRound,
    secret: gameState.currentSecret,
    winner: winner,
    loops: gameState.currentLoop,
    history: [...gameState.currentHistory]
  });
  
  // Show round results
  let resultMessage = '';
  
  if (winner === 'observer') {
    resultMessage = 'Observer correctly guessed the secret word!';
  } else if (winner === 'receiver') {
    resultMessage = 'Receiver correctly guessed the secret word!';
  } else {
    resultMessage = 'Round ended in a tie - no one guessed the secret word.';
  }
  
  const resultBox = document.createElement('div');
  resultBox.className = 'message-box';
  resultBox.innerHTML = `
    <div class="message-header">Round ${gameState.currentRound} Result</div>
    <div class="message-content">${resultMessage}</div>
  `;
  
  elements.game.messageContainer.appendChild(resultBox);
  
  // Check if game is over
  if (gameState.currentRound >= gameState.totalRounds) {
    // Game over - show results screen
    elements.buttons.nextPhase.textContent = 'View Final Results';
    elements.buttons.nextPhase.onclick = showResults;
  } else {
    // Prepare for next round
    gameState.currentRound++;
    elements.buttons.nextPhase.textContent = 'Start Next Round';
    elements.buttons.nextPhase.onclick = async () => {
      elements.buttons.nextPhase.onclick = handleNextPhase;
      await startRound();
    };
  }
}

// Show results screen
function showResults() {
  // Update final scores
  elements.results.finalTeam1Score.textContent = gameState.scores.team1;
  elements.results.finalTeam2Score.textContent = gameState.scores.team2;
  
  // Build round history display
  elements.results.roundHistory.innerHTML = '';
  
  gameState.roundHistory.forEach(round => {
    const roundElement = document.createElement('div');
    roundElement.className = 'round-summary';
    
    let winnerText = '';
    if (round.winner === 'observer') {
      winnerText = 'Observer wins';
    } else if (round.winner === 'receiver') {
      winnerText = 'Receiver wins';
    } else {
      winnerText = 'Tie';
    }
    
    roundElement.innerHTML = `
      <h4>Round ${round.round}</h4>
      <div>Secret: <strong>${round.secret}</strong></div>
      <div>Result: <strong>${winnerText}</strong> (${round.loops} loops)</div>
    `;
    
    elements.results.roundHistory.appendChild(roundElement);
  });
  
  // Reset button handler
  elements.buttons.nextPhase.onclick = handleNextPhase;
  
  // Show results screen
  showScreen('results');
}

// Reset the game
function resetGame() {
  showScreen('start');
}

// Display message
function displayMessage(messageEntry) {
  const messageTemplate = elements.templates.message.content.cloneNode(true);
  const messageBox = messageTemplate.querySelector('.message-box');
  
  // Set role
  messageBox.querySelector('.role').textContent = 
    messageEntry.role.charAt(0).toUpperCase() + messageEntry.role.slice(1);
  
  // Set message content
  messageBox.querySelector('.message-content').textContent = messageEntry.message;
  
  // Set reasoning if available
  if (messageEntry.reasoning) {
    const thinkingElement = messageBox.querySelector('.message-thinking');
    thinkingElement.textContent = messageEntry.reasoning;
    thinkingElement.classList.remove('hidden');
  }
  
  // Add to container
  elements.game.messageContainer.appendChild(messageBox);
  
  // Scroll to bottom
  elements.game.messageContainer.scrollTop = elements.game.messageContainer.scrollHeight;
}

// Display guess
function displayGuess(guessEntry) {
  const guessTemplate = elements.templates.guess.content.cloneNode(true);
  const guessBox = guessTemplate.querySelector('.guess-box');
  
  // Set role
  guessBox.querySelector('.role').textContent = 
    guessEntry.role.charAt(0).toUpperCase() + guessEntry.role.slice(1);
  
  // Set guess content
  guessBox.querySelector('.guess-word').textContent = guessEntry.guess;
  
  // Set result
  const resultElement = guessBox.querySelector('.guess-result');
  if (guessEntry.correct) {
    resultElement.textContent = '✓ Correct!';
    resultElement.classList.add('result-correct');
  } else {
    resultElement.textContent = '✗ Incorrect';
    resultElement.classList.add('result-incorrect');
  }
  
  // Set reasoning if available
  if (guessEntry.reasoning) {
    const thinkingElement = guessBox.querySelector('.guess-thinking');
    thinkingElement.textContent = guessEntry.reasoning;
    thinkingElement.classList.remove('hidden');
  }
  
  // Add to container
  elements.game.messageContainer.appendChild(guessBox);
  
  // Scroll to bottom
  elements.game.messageContainer.scrollTop = elements.game.messageContainer.scrollHeight;
}

// Update history panel
function updateHistoryPanel(entry) {
  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  
  if (entry.type === 'message') {
    historyItem.innerHTML = `
      <div class="history-role">${entry.role}:</div>
      <div class="history-content">${entry.message}</div>
    `;
  } else if (entry.type === 'guess') {
    const resultClass = entry.correct ? 'result-correct' : 'result-incorrect';
    const resultSymbol = entry.correct ? '✓' : '✗';
    
    historyItem.innerHTML = `
      <div class="history-role">${entry.role} guess:</div>
      <div class="history-content">
        ${entry.guess} <span class="${resultClass}">${resultSymbol}</span>
      </div>
    `;
  }
  
  elements.game.historyContainer.appendChild(historyItem);
  
  // Scroll to bottom
  elements.game.historyContainer.scrollTop = elements.game.historyContainer.scrollHeight;
}

// Show/hide thinking indicator
function showThinking(show) {
  if (show) {
    elements.game.thinkingArea.classList.remove('hidden');
  } else {
    elements.game.thinkingArea.classList.add('hidden');
  }
}

// Switch between screens
function showScreen(screen) {
  // Hide all screens
  Object.values(elements.screens).forEach(element => {
    element.classList.add('hidden');
  });
  
  // Show requested screen
  elements.screens[screen].classList.remove('hidden');
  
  // Update game state
  gameState.currentScreen = screen;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);