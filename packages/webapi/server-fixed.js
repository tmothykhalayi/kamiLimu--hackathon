import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { AgentService } from "./agentService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const healthResourcesPath = path.join(projectRoot, 'data/health_resources.txt');

// Initialize Azure AI Inference client
let azureClient;
try {
  if (process.env.AZURE_INFERENCE_ENDPOINT && process.env.AZURE_INFERENCE_SDK_KEY) {
    // Use fetch for Azure AI Inference API calls
    azureClient = {
      endpoint: process.env.AZURE_INFERENCE_ENDPOINT,
      apiKey: process.env.AZURE_INFERENCE_SDK_KEY,
      deploymentName: process.env.DEPLOYMENT_NAME || "gpt-4o"
    };
    console.log('Azure AI Inference client configured successfully');
  } else {
    console.error('Missing Azure AI Inference configuration');
  }
} catch (error) {
  console.error('Failed to configure Azure AI client:', error);
}

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
      console.warn('Health resources file not found at:', healthResourcesPath);
      
      // Create default health resources if file doesn't exist
      const defaultHealthContent = `
# Basic Health Guidelines

## General Wellness
- Maintain a balanced diet with plenty of fruits and vegetables
- Stay hydrated by drinking 8-10 glasses of water daily
- Get 7-9 hours of quality sleep each night
- Exercise regularly (at least 150 minutes of moderate activity per week)
- Manage stress through relaxation techniques

## Nutrition Basics
- Eat a variety of colorful fruits and vegetables
- Choose whole grains over refined grains
- Include lean proteins in your meals
- Limit processed foods and added sugars
- Control portion sizes

## Physical Activity
- Aim for at least 30 minutes of moderate exercise most days
- Include both cardio and strength training
- Take breaks from sitting every hour
- Use stairs instead of elevators when possible
- Find activities you enjoy to stay motivated

## Mental Health
- Practice mindfulness or meditation
- Stay connected with friends and family
- Seek professional help when needed
- Maintain work-life balance
- Engage in hobbies and activities you enjoy

## Preventive Care
- Schedule regular check-ups with your healthcare provider
- Stay up to date with vaccinations
- Get recommended screenings based on age and risk factors
- Practice good hygiene habits
- Protect your skin from sun damage

Remember: This information is for educational purposes only. Always consult with qualified healthcare professionals for personalized medical advice.
`;
      
      // Ensure the data directory exists
      const dataDir = path.join(projectRoot, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(healthResourcesPath, defaultHealthContent);
      console.log('Created default health resources file');
      healthText = defaultHealthContent;
    } else {
      healthText = fs.readFileSync(healthResourcesPath, 'utf-8');
    }
    
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

// Call Azure AI Inference API
async function callAzureAI(messages) {
  if (!azureClient) {
    throw new Error('Azure AI client not configured');
  }

  // Try Azure AI Models endpoint (serverless inference)
  const apiUrl = `https://models.inference.ai.azure.com/chat/completions`;
  
  console.log('Calling Azure AI Models at:', apiUrl);
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${azureClient.apiKey}`
    },
    body: JSON.stringify({
      messages: messages,
      model: azureClient.deploymentName,
      max_tokens: 800,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Azure AI API error:', response.status, errorData);
    
    // If the first endpoint fails, try the deployment-specific endpoint
    console.log('Trying deployment-specific endpoint...');
    const deploymentUrl = `${azureClient.endpoint}/openai/deployments/${azureClient.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
    
    const deploymentResponse = await fetch(deploymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureClient.apiKey
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });
    
    if (!deploymentResponse.ok) {
      const deploymentErrorData = await deploymentResponse.text();
      console.error('Deployment-specific API error:', deploymentResponse.status, deploymentErrorData);
      throw new Error(`Both Azure AI endpoints failed. Last error: ${deploymentResponse.status} - ${deploymentErrorData}`);
    }
    
    const deploymentData = await deploymentResponse.json();
    console.log('Azure AI deployment response:', deploymentData);
    return deploymentData.choices[0]?.message?.content || 'No response received';
  }

  const data = await response.json();
  console.log('Azure AI response:', data);
  return data.choices[0]?.message?.content || 'No response received';
}

// Initialize agent service
const agentService = new AgentService();

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, useRAG = true, sessionId = "default", mode = "basic" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received chat message:', message);

    // Handle agent mode
    if (mode === "agent") {
      try {
        const agentResponse = await agentService.processMessage(sessionId, message);
        return res.json({
          reply: agentResponse.reply,
          sources: agentResponse.sources || []
        });
      } catch (error) {
        console.error('Agent mode error:', error);
        // Fall back to basic mode
      }
    }

    // Check if Azure AI client is available
    if (!azureClient) {
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
    const aiResponse = await callAzureAI(messages);

    console.log('AI response received:', aiResponse);

    // Save to memory
    saveToMemory(sessionId, message, aiResponse);

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
    azureAI: azureClient ? 'connected' : 'disconnected',
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
  console.log(`Azure AI status: ${azureClient ? 'Connected' : 'Not configured'}`);
  
  if (!azureClient) {
    console.log('\n⚠️  Azure AI not configured - chat will use fallback responses');
    console.log('To enable AI responses, set these environment variables:');
    console.log('- AZURE_INFERENCE_ENDPOINT');
    console.log('- AZURE_INFERENCE_SDK_KEY');
    console.log('- DEPLOYMENT_NAME');
  }
});
