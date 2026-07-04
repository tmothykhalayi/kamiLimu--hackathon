import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const healthResourcesPath = path.join(projectRoot, 'data/health_resources.txt');

// Initialize Azure AI Inference client with error handling
let client;
try {
  if (!process.env.AZURE_INFERENCE_ENDPOINT || !process.env.AZURE_INFERENCE_SDK_KEY) {
    console.error('Missing Azure AI configuration. Please check your .env file.');
    console.log('Required variables: AZURE_INFERENCE_ENDPOINT, AZURE_INFERENCE_SDK_KEY');
    console.log('Current AZURE_INFERENCE_ENDPOINT:', process.env.AZURE_INFERENCE_ENDPOINT ? 'Set' : 'Not set');
    console.log('Current AZURE_INFERENCE_SDK_KEY:', process.env.AZURE_INFERENCE_SDK_KEY ? 'Set' : 'Not set');
  } else {
    client = new ModelClient(
      process.env.AZURE_INFERENCE_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
    );
    console.log('Azure AI client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Azure AI client:', error);
}

const modelName = process.env.DEPLOYMENT_NAME || "gpt-4o";

// Session memory storage
const sessionMemories = {};

// Health resources storage
let healthText = null;
let healthChunks = [];
const CHUNK_SIZE = 800;

// Load health resources from text file
async function loadHealthResources() {
  if (healthText) return healthText;

  try {
    if (!fs.existsSync(healthResourcesPath)) {
      console.warn('Health resources file not found');
      return "Health resources not found.";
    }

    healthText = fs.readFileSync(healthResourcesPath, 'utf-8');
    
    // Split into chunks for better retrieval
    let currentChunk = "";
    const words = healthText.split(/\s+/);

    for (const word of words) {
      if ((currentChunk + " " + word).length <= CHUNK_SIZE) {
        currentChunk += (currentChunk ? " " : "") + word;
      } else {
        healthChunks.push(currentChunk);
        currentChunk = word;
      }
    }
    if (currentChunk) healthChunks.push(currentChunk);
    
    console.log(`Loaded health resources: ${healthChunks.length} chunks`);
    return healthText;
  } catch (error) {
    console.error('Error loading health resources:', error);
    return "Error loading health resources.";
  }
}

// Simple keyword-based retrieval for relevant content
function retrieveRelevantContent(userMessage) {
  if (!healthChunks || healthChunks.length === 0) {
    return [];
  }

  const query = userMessage.toLowerCase();
  const relevantChunks = [];

  for (const chunk of healthChunks) {
    const chunkLower = chunk.toLowerCase();
    
    // Calculate relevance score based on keyword matches
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let score = 0;
    
    for (const word of queryWords) {
      if (chunkLower.includes(word)) {
        score++;
      }
    }
    
    if (score > 0) {
      relevantChunks.push({ chunk, score });
    }
  }

  // Sort by relevance score and return top 3 chunks
  return relevantChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.chunk);
}

// Get or create session memory
function getSessionMemory(sessionId) {
  if (!sessionMemories[sessionId]) {
    sessionMemories[sessionId] = [];
  }
  return sessionMemories[sessionId];
}

// Save message to session memory
function saveToMemory(sessionId, userMessage, aiResponse) {
  const memory = getSessionMemory(sessionId);
  memory.push({ role: "user", content: userMessage });
  memory.push({ role: "assistant", content: aiResponse });
  
  // Keep only last 10 messages to manage memory
  if (memory.length > 20) {
    memory.splice(0, memory.length - 20);
  }
}

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, useRAG = true, sessionId = "default", mode = "basic" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received chat message:', message);

    // Check if Azure AI client is available
    if (!client) {
      const fallbackResponse = `I apologize, but the AI service is not properly configured. 

For health information, I recommend:
- Consulting with your healthcare provider
- Visiting reputable health websites like CDC.gov or WHO.int
- Calling emergency services for urgent medical concerns

**Medical Disclaimer:** This AI assistant is not a substitute for professional medical advice, diagnosis, or treatment.`;

      return res.json({
        reply: fallbackResponse,
        sources: [],
        timestamp: new Date().toISOString()
      });
    }

    // Handle agent mode (disabled for now)
    if (mode === "agent") {
      return res.json({
        reply: "Agent mode is temporarily disabled. Please use Basic AI mode with Health Resources enabled for healthcare guidance.",
        sources: []
      });
    }

    let sources = [];
    
    // Load health resources if using RAG
    if (useRAG) {
      await loadHealthResources();
      sources = retrieveRelevantContent(message);
    }

    // Get session memory
    const memory = getSessionMemory(sessionId);

    // Prepare system prompt based on RAG usage
    const systemMessage = useRAG && sources.length > 0
      ? `You are HealthAI Assistant, a knowledgeable Healthcare & Wellness AI companion. Use the provided evidence-based health information to answer questions. Always include appropriate disclaimers about consulting healthcare professionals for medical concerns.

IMPORTANT MEDICAL DISCLAIMERS:
- This information is for educational purposes only
- Not a substitute for professional medical advice, diagnosis, or treatment
- Always consult qualified healthcare providers for medical concerns
- In medical emergencies, contact emergency services immediately
- Individual health situations vary - personalized medical advice requires professional consultation

HEALTH RESOURCES:
${sources.join('\n\n')}

Provide helpful, accurate information while emphasizing the importance of professional medical consultation when appropriate. Be empathetic and supportive in your responses.`
      : `You are HealthAI Assistant, a helpful Healthcare & Wellness AI companion. Provide evidence-based health and wellness information while always including appropriate medical disclaimers.

IMPORTANT MEDICAL DISCLAIMERS:
- This information is for educational purposes only
- Not a substitute for professional medical advice, diagnosis, or treatment
- Always consult qualified healthcare providers for medical concerns
- In medical emergencies, contact emergency services immediately
- Individual health situations vary - personalized medical advice requires professional consultation

Focus on general wellness, healthy lifestyle tips, preventive care information, and always encourage professional medical consultation for specific health concerns.`;

    // Build messages array
    const messages = [
      { role: "system", content: systemMessage },
      ...memory.slice(-10), // Include recent conversation history
      { role: "user", content: message }
    ];

    console.log('Calling Azure AI Inference...');

    // Call Azure AI Inference
    const response = await client.path("/chat/completions").post({
      body: {
        messages: messages,
        model: modelName,
        max_tokens: 800,
        temperature: 0.7,
      }
    });

    if (response.status !== "200") {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const aiResponse = response.body.choices[0]?.message?.content || 
      "I apologize, but I couldn't generate a response at this time. For immediate medical concerns, please contact your healthcare provider.";

    // Save to memory
    saveToMemory(sessionId, message, aiResponse);

    console.log('AI response generated successfully');

    res.json({
      reply: aiResponse,
      sources: sources,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);

    // Healthcare-appropriate fallback response
    const fallbackResponse = `I apologize, but I'm experiencing technical difficulties right now. 

For immediate medical concerns, please:
- Contact your healthcare provider
- Call emergency services if urgent
- Visit reputable health websites like CDC.gov or WHO.int

**Medical Disclaimer:** This AI assistant is not a substitute for professional medical advice, diagnosis, or treatment.`;

    res.status(500).json({
      error: 'Failed to process message',
      reply: fallbackResponse,
      sources: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HealthAI Assistant Backend',
    azureAI: client ? 'connected' : 'disconnected',
    environment: {
      endpoint: process.env.AZURE_INFERENCE_ENDPOINT ? 'configured' : 'missing',
      apiKey: process.env.AZURE_INFERENCE_SDK_KEY ? 'configured' : 'missing',
      deployment: process.env.DEPLOYMENT_NAME || 'gpt-4o'
    }
  });
});

// Documents endpoint (for compatibility)
app.get('/documents', (req, res) => {
  res.json([]);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HealthAI Assistant backend running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Azure AI status: ${client ? 'Connected' : 'Not configured'}`);
  
  if (!client) {
    console.log('\n⚠️  Azure AI not configured - chat will use fallback responses');
    console.log('To enable AI responses, set these environment variables:');
    console.log('- AZURE_INFERENCE_ENDPOINT');
    console.log('- AZURE_INFERENCE_SDK_KEY');
  }
});
