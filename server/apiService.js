const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const wordService = require('./wordService');

// Get API keys from multiple sources in order of preference
let OPENAI_API_KEY, ANTHROPIC_API_KEY;

try {
  // 1. Try to load from config.js first (this is the preferred method)
  let config;
  try {
    config = require('../config');
    OPENAI_API_KEY = config.openaiApiKey;
    ANTHROPIC_API_KEY = config.anthropicApiKey;
    
    // Check if the keys are still placeholder values
    if (OPENAI_API_KEY === 'your_openai_api_key_here') OPENAI_API_KEY = null;
    if (ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') ANTHROPIC_API_KEY = null;
  } catch (configError) {
    console.log('No config.js file found or there was an error in the file. Trying other sources.');
  }
  
  // 2. If keys not found in config, try environment variables
  if (!OPENAI_API_KEY) OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!ANTHROPIC_API_KEY) ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  // 3. As a last resort, try to read from files in materials folder
  if (!OPENAI_API_KEY) {
    const openaiKeyPath = path.join(__dirname, '../materials/openai_api_key.txt');
    if (fs.existsSync(openaiKeyPath)) {
      OPENAI_API_KEY = fs.readFileSync(openaiKeyPath, 'utf8').trim();
    }
  }
  
  if (!ANTHROPIC_API_KEY) {
    const anthropicKeyPath = path.join(__dirname, '../materials/anthropic_api_key.txt');
    if (fs.existsSync(anthropicKeyPath)) {
      ANTHROPIC_API_KEY = fs.readFileSync(anthropicKeyPath, 'utf8').trim();
    }
  }
  
  // Log status without showing actual keys
  console.log(`OpenAI API key ${OPENAI_API_KEY ? 'found' : 'NOT FOUND'}`);
  console.log(`Anthropic API key ${ANTHROPIC_API_KEY ? 'found' : 'NOT FOUND'}`);
  
} catch (error) {
  console.error('Error loading API keys:', error);
}

// Initialize API clients
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

// Prompts for different roles
const PROMPTS = {
  sender: `You are the Sender in a secret word communication game. You have a SECRET WORD that you need to help the Receiver guess, 
while preventing the Observer from guessing it. You'll craft a message that contains subtle clues about the secret word.

RULES:
1. NEVER explicitly mention the secret word in your message.
2. Your message should contain indirect clues, references, or creative allusions to the secret word.
3. Make your message specific enough that someone who knows what to look for (the Receiver) can decode it, but ambiguous enough that a third party (the Observer) would be misled.
4. If this is Loop 1, introduce initial clues. For later loops, refine your approach based on the Receiver's feedback.
5. Keep your message concise, preferably 2-3 sentences.
6. You MUST structure your response with <reasoning> tags for your thought process and <message> tags for your final message.
7. ONLY the content inside <message> tags will be sent to the Receiver.

The SECRET WORD is: "{{secretWord}}"
Category: {{category}}

First think about your clues and strategy:
<reasoning>
Analyze the secret word, brainstorm associations, and decide how to craft a message that hints at it indirectly.
Think about what would help the Receiver while potentially misleading the Observer.
</reasoning>

Then craft your final message:
<message>
Your subtle message here. Keep it concise (2-3 sentences).
</message>`,

  observer: `You are the Observer in a secret word guessing game. You'll read the communications between a Sender and Receiver, and try to guess the SECRET WORD.

RULES:
1. The Sender has a SECRET WORD they're trying to communicate to the Receiver using subtle clues.
2. The Sender will never explicitly state the secret word.
3. Analyze patterns, themes, possible wordplay, and other subtle indicators.
4. Your goal is to guess the secret word before the Receiver does.
5. You MUST structure your response with <reasoning> tags for your thought process and <message> tags for your final guess.
6. ONLY the content inside <message> tags will be shown.
7. In your final message, clearly state your guess in the format: "I think the secret word is [word]"

Category: {{category}}

First analyze the conversation and think through possible words:
<reasoning>
Review all messages exchanged so far, looking for patterns, themes, wordplay, and subtle clues.
Consider how the clues relate to the category and what word they might be hinting at.
</reasoning>

Then make your final guess:
<message>
I think the secret word is "[single word]"
</message>`,

  receiver: `You are the Receiver in a secret word communication game. The Sender knows a SECRET WORD and is trying to help you guess it through subtle hints, while preventing a third-party Observer from guessing it.

RULES:
1. The Sender has provided a message containing subtle clues about the secret word.
2. The Sender will never explicitly state the secret word.
3. Look for patterns, themes, wordplay, and other subtle indicators.
4. You MUST structure your response with <reasoning> tags for your thought process and <message> tags for your final guess.
5. ONLY the content inside <message> tags will be shown.
6. In your final message, clearly state your guess in the format: "I think the secret word is [word]"

Category: {{category}}

First analyze the Sender's message and think through possible words:
<reasoning>
Carefully examine the Sender's message(s) for clues, themes, metaphors, or wordplay.
Consider how the clues relate to the category and what word they might be hinting at.
</reasoning>

Then make your final guess:
<message>
I think the secret word is "[single word]"
</message>`,

  receiverResponse: `You are the Receiver in a secret word communication game. The Sender knows a SECRET WORD and is trying to help you guess it.

You just made a guess, but it wasn't correct. Now you need to send feedback to the Sender to help them refine their clues.

RULES:
1. Don't explicitly ask what the word is.
2. Share your thought process about how you arrived at your guess.
3. Ask for specific types of clues or clarification.
4. You MUST structure your response with <reasoning> tags for your thought process and <message> tags for your final response.
5. ONLY the content inside <message> tags will be sent to the Sender.

Category: {{category}}

First reflect on your incorrect guess and what might help:
<reasoning>
Think about why your guess was wrong and what additional information would help you get closer.
Consider what aspects of the clue led you astray and what clarification would be most helpful.
</reasoning>

Then craft your response to the Sender:
<message>
Your brief explanation of your thinking and request for specific clues or clarification.
</message>`,

  senderRefined: `You are the Sender in a secret word communication game. You have a SECRET WORD that you need to help the Receiver guess, while preventing the Observer from guessing it.

The Receiver has made an incorrect guess and provided feedback. Now you need to refine your approach.

RULES:
1. NEVER explicitly mention the secret word.
2. Address the Receiver's specific feedback/questions.
3. Provide new clues or clarify existing ones.
4. Be more precise while still maintaining ambiguity for the Observer.
5. Keep your message concise, preferably 2-3 sentences.
6. Remember this is loop {{loop}} of 4 possible loops.
7. You MUST structure your response with <reasoning> tags for your thought process and <message> tags for your final message.
8. ONLY the content inside <message> tags will be sent to the Receiver.

The SECRET WORD is: "{{secretWord}}"
Category: {{category}}

First analyze the Receiver's feedback and plan your refined approach:
<reasoning>
Consider what clues worked, what didn't, and how to address the Receiver's specific questions.
Think of new angles or clarifications that might help without making it too obvious to the Observer.
</reasoning>

Then craft your refined message:
<message>
Your refined message with clearer clues. Keep it concise (2-3 sentences).
</message>`
};

// Helper function to choose the API client based on model name
const getApiClient = (modelName) => {
  if (modelName.includes('claude-3-7')) {
    return 'anthropic';
  } else {
    return 'openai';
  }
};

// Function to format messages for API calls
const formatMessages = (role, gameMessages, additionalContext = {}) => {
  // For simplicity, default to using Claude for now
  // In a full implementation, you would use the chosen model for each role
  
  let promptTemplate = PROMPTS[role];
  
  // Replace template variables
  Object.keys(additionalContext).forEach(key => {
    promptTemplate = promptTemplate.replace(`{{${key}}}`, additionalContext[key]);
  });
  
  // Format messages for the API
  const systemMessage = {
    role: 'system',
    content: promptTemplate
  };
  
  // Format game messages for the API
  const formattedMessages = gameMessages.map(msg => ({
    role: msg.role === 'system' ? 'system' : 'user',
    content: msg.text
  }));
  
  return [systemMessage, ...formattedMessages];
};

// Function to call the OpenAI API
const callOpenAI = async (messages, modelName = 'gpt-4o') => {
  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

// Function to call the Anthropic API
const callAnthropic = async (messages, modelName = 'claude-3-7-sonnet-20250219') => {
  try {
    // Format messages for Anthropic
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
    const userMessages = messages.filter(msg => msg.role !== 'system');
    
    const formattedMessages = userMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await anthropic.messages.create({
      model: modelName,
      system: systemMessage,
      messages: formattedMessages,
      max_tokens: 300,
      temperature: 0.7
    });
    
    return response.content[0].text.trim();
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
};

// Function to extract the message content from between <message> tags
const extractMessage = (response) => {
  console.log("Processing response for message extraction");
  
  // Extract content between <message> tags
  const messageMatch = /<message>([\s\S]*?)<\/message>/i.exec(response);
  if (messageMatch && messageMatch[1]) {
    const message = messageMatch[1].trim();
    console.log("Found message content:", message);
    return message;
  }
  
  console.log("No <message> tags found, returning full response");
  return response.trim();
};

// Function to extract the reasoning content from between <reasoning> tags
const extractReasoning = (response) => {
  const reasoningMatch = /<reasoning>([\s\S]*?)<\/reasoning>/i.exec(response);
  if (reasoningMatch && reasoningMatch[1]) {
    return reasoningMatch[1].trim();
  }
  return '';
};

// Function to extract a single word guess from a response
const extractGuess = (response) => {
  console.log("Full response for guess extraction:", response);
  
  // First extract just the message content
  const messageContent = extractMessage(response);
  console.log("Extracted message content:", messageContent);
  
  // First, look for common guess patterns like "I guess: [word]" or "My guess is [word]"
  const guessPatterns = [
    /guess(?:ed)?(?::|\sis|\swould\sbe)?\s+["']?([a-zA-Z]+)["']?/i,
    /(?:^|\s)["']?([a-zA-Z]+)["']?(?:\s+is|\.)?\s+(?:my\s+guess|my\s+answer)(?:\.|\s|$)/i,
    /the\s+(?:secret\s+)?word\s+is\s+["']?([a-zA-Z]+)["']?/i,
    /I\s+think\s+(?:it's|it\s+is)\s+["']?([a-zA-Z]+)["']?/i,
    /my\s+answer\s+is\s+["']?([a-zA-Z]+)["']?/i,
    /I(?:'m)?\s+going\s+to\s+guess\s+["']?([a-zA-Z]+)["']?/i,
    /I(?:'ll)?\s+choose\s+["']?([a-zA-Z]+)["']?/i,
    /answer(?::|\sis)?\s+["']?([a-zA-Z]+)["']?/i
  ];
  
  for (const pattern of guessPatterns) {
    const match = messageContent.match(pattern);
    if (match && match[1]) {
      console.log(`Pattern match found: ${pattern} → "${match[1].toLowerCase()}"`);
      return match[1].toLowerCase();
    }
  }
  
  // Look for any word in quotation marks as a potential guess
  const quotesPattern = /["']([a-zA-Z]+)["']/i;
  const quotesMatch = messageContent.match(quotesPattern);
  if (quotesMatch && quotesMatch[1]) {
    console.log(`Quotes pattern match found: "${quotesMatch[1].toLowerCase()}"`);
    return quotesMatch[1].toLowerCase();
  }
  
  // If no pattern matches, look at the last sentence for a simple word answer
  const sentences = messageContent.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence.split(/\s+/).length <= 3) { // If it's a short sentence, likely just the answer
      const words = lastSentence.split(/\s+/).filter(word => word.length > 0);
      if (words.length > 0) {
        const guess = words[words.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
        console.log(`Short last sentence extraction: "${guess}"`);
        return guess;
      }
    }
  }
  
  // Last resort: return the last word in the message
  const words = messageContent.split(/\s+/).filter(word => word.length > 0);
  if (words.length > 0) {
    // Clean up the word (remove punctuation)
    const guess = words[words.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
    console.log(`Last word extraction: "${guess}"`);
    return guess;
  }
  
  console.log("No guess could be extracted");
  return '';
};

// Service functions for game mechanics
const getSenderMessage = async (secretWord, category, messages, loop) => {
  const formattedMessages = formatMessages('sender', messages, { secretWord, category, loop });
  // In a full implementation, you would choose between OpenAI and Anthropic based on the user's selection
  try {
    const response = await callOpenAI(formattedMessages);
    console.log("Sender raw response:", response.substring(0, 100) + "...");
    
    // Extract just the message part
    const message = extractMessage(response);
    
    // Log reasoning separately (not shown to users)
    const reasoning = extractReasoning(response);
    if (reasoning) {
      console.log("Sender reasoning:", reasoning);
    }
    
    return message;
  } catch (error) {
    console.error('Error getting sender message:', error);
    // Fallback to Anthropic if OpenAI fails
    const response = await callAnthropic(formattedMessages);
    return extractMessage(response);
  }
};

const getObserverGuess = async (category, messages, secretWord) => {
  const formattedMessages = formatMessages('observer', messages, { category });
  
  try {
    // Get response from Anthropic directly without fallback to ensure consistency
    console.log("Requesting observer guess from Anthropic...");
    const response = await callAnthropic(formattedMessages);
    console.log("Observer raw response:", response.substring(0, 100) + "...");
    
    // Extract just the message part
    const messageContent = extractMessage(response);
    
    // Log reasoning separately (not shown to users)
    const reasoning = extractReasoning(response);
    if (reasoning) {
      console.log("Observer reasoning:", reasoning);
    }
    
    // Extract the guess from the message content
    const guess = extractGuess(messageContent);
    console.log("Extracted observer guess:", guess);
    
    const isCorrect = wordService.checkGuess(guess, secretWord);
    console.log(`Observer guess correct? ${isCorrect}`);
    
    return { 
      guess, 
      isCorrect,
      message: messageContent 
    };
  } catch (error) {
    console.error('Error getting observer guess:', error);
    return { guess: 'API Error', isCorrect: false, message: "Error getting response" };
  }
};

const getReceiverGuess = async (category, messages, secretWord) => {
  const formattedMessages = formatMessages('receiver', messages, { category });
  
  try {
    // Get response from OpenAI directly without fallback to ensure consistency
    console.log("Requesting receiver guess from OpenAI...");
    const response = await callOpenAI(formattedMessages);
    console.log("Receiver raw response:", response.substring(0, 100) + "...");
    
    // Extract just the message part
    const messageContent = extractMessage(response);
    
    // Log reasoning separately (not shown to users)
    const reasoning = extractReasoning(response);
    if (reasoning) {
      console.log("Receiver reasoning:", reasoning);
    }
    
    // Extract the guess from the message content
    const guess = extractGuess(messageContent);
    console.log("Extracted receiver guess:", guess);
    
    const isCorrect = wordService.checkGuess(guess, secretWord);
    console.log(`Receiver guess correct? ${isCorrect}`);
    
    return { 
      guess, 
      isCorrect,
      message: messageContent 
    };
  } catch (error) {
    console.error('Error getting receiver guess:', error);
    return { guess: 'API Error', isCorrect: false, message: "Error getting response" };
  }
};

const getReceiverResponse = async (category, messages) => {
  const formattedMessages = formatMessages('receiverResponse', messages, { category });
  
  try {
    console.log("Requesting receiver response from OpenAI...");
    const response = await callOpenAI(formattedMessages);
    console.log("Receiver response raw:", response.substring(0, 100) + "...");
    
    // Extract just the message part
    const messageContent = extractMessage(response);
    
    // Log reasoning separately (not shown to users)
    const reasoning = extractReasoning(response);
    if (reasoning) {
      console.log("Receiver response reasoning:", reasoning);
    }
    
    return messageContent;
  } catch (error) {
    console.error('Error getting receiver response:', error);
    // Fallback to Anthropic if OpenAI fails
    const response = await callAnthropic(formattedMessages);
    return extractMessage(response);
  }
};

const getSenderRefinedMessage = async (secretWord, category, messages, loop) => {
  const formattedMessages = formatMessages('senderRefined', messages, { secretWord, category, loop });
  
  try {
    console.log("Requesting refined sender message from OpenAI...");
    const response = await callOpenAI(formattedMessages);
    console.log("Refined sender raw response:", response.substring(0, 100) + "...");
    
    // Extract just the message part
    const messageContent = extractMessage(response);
    
    // Log reasoning separately (not shown to users)
    const reasoning = extractReasoning(response);
    if (reasoning) {
      console.log("Refined sender reasoning:", reasoning);
    }
    
    return messageContent;
  } catch (error) {
    console.error('Error getting sender refined message:', error);
    // Fallback to Anthropic if OpenAI fails
    const response = await callAnthropic(formattedMessages);
    return extractMessage(response);
  }
};

module.exports = {
  getSenderMessage,
  getObserverGuess,
  getReceiverGuess,
  getReceiverResponse,
  getSenderRefinedMessage
};