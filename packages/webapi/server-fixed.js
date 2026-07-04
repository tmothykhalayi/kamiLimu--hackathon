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
const civicResourcesPath = path.join(projectRoot, 'data/health_resources.txt');

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

// Civic resources storage
let civicText = null;
let civicChunks = [];
const CHUNK_SIZE = 800;

// Load civic resources from text file
async function loadCivicResources() {
  if (civicText) return civicText;

  try {
    if (!fs.existsSync(civicResourcesPath)) {
      console.warn('Civic resources file not found at:', civicResourcesPath);
      
      // Create default civic resources if file doesn't exist
      const defaultCivicContent = `
# Information Integrity Starter Guide

## Claim Checking Basics
- Pause before resharing a political claim or viral post
- Look for the original source, not only the forwarded copy
- Compare the claim against trusted fact-checking or official sources
- Watch for edited screenshots, cropped posts, or missing context
- Treat emotional or urgent language as a reason to verify, not a reason to react

## Media Verification Tips
- Check whether the image or video appears in multiple credible sources
- Look for signs of manipulation, mismatched shadows, or odd text overlays
- Use reverse image search where possible
- Be careful with AI-generated faces, voices, and synthetic clips
- Remember that a convincing format is not proof of truth

## Swahili-First Civic Support
- Use simple Swahili to explain the result clearly
- Avoid technical jargon that ordinary users cannot act on
- Respect Kenyan dialect differences and local political context
- Keep explanations short enough to read on a phone
- Support users who have limited data or low literacy

## Responsible Computing Notes
- Avoid collecting unnecessary personal data
- Avoid outputs that could be used to suppress legitimate political speech
- Flag uncertainty clearly instead of pretending to be certain
- Keep the tool helpful for verification, not persuasion
- Design for fairness across regions and communities

Remember: This information is for educational and verification support purposes only. Always confirm important civic claims using trusted primary sources.
`;
      
      // Ensure the data directory exists
      const dataDir = path.join(projectRoot, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(civicResourcesPath, defaultCivicContent);
      console.log('Created default civic resources file');
      civicText = defaultCivicContent;
    } else {
      civicText = fs.readFileSync(civicResourcesPath, 'utf-8');
    }
    
    // Split into chunks for better retrieval
    let currentChunk = "";
    const words = civicText.split(/\s+/);

    for (const word of words) {
      if ((currentChunk + " " + word).length <= CHUNK_SIZE) {
        currentChunk += (currentChunk ? " " : "") + word;
      } else {
        civicChunks.push(currentChunk);
        currentChunk = word;
      }
    }
    if (currentChunk) civicChunks.push(currentChunk);
    
    console.log(`Loaded civic resources: ${civicChunks.length} chunks`);
    return civicText;
  } catch (error) {
    console.error('Error loading civic resources:', error);
    return "Error loading civic resources.";
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

For civic verification, I recommend:
- Checking trusted fact-checking sources
- Comparing the claim against official or primary sources
- Being cautious with forwarded messages and edited media

**Civic Disclaimer:** This AI assistant is not a substitute for journalism, official guidance, or your own careful judgment.`;

      return res.json({
        reply: fallbackResponse,
        sources: [],
        timestamp: new Date().toISOString()
      });
    }

    let sources = [];
    
    // Load civic resources if using RAG
    if (useRAG) {
      await loadCivicResources();
      sources = retrieveRelevantContent(message);
    }

    // Get session memory
    const memory = getSessionMemory(sessionId);

    // Prepare system prompt based on RAG usage
    const systemMessage = useRAG && sources.length > 0
      ? `You are a Democracy x AI verification assistant. Use the provided civic and information integrity resources to answer questions. Always explain uncertainty clearly and avoid overclaiming.

    IMPORTANT RESPONSIBLE COMPUTING GUIDANCE:
    - This information is for educational and verification support purposes only
    - Not a substitute for journalism, official election guidance, or legal advice
    - Avoid language that could be used to suppress legitimate political speech
    - If the evidence is insufficient, say so clearly
    - Keep the response concise and usable on mobile devices

    CIVIC RESOURCES:
${sources.join('\n\n')}

    Provide helpful, accurate information while keeping the answer simple, factual, and careful about uncertainty.`
      : `You are a Democracy x AI verification assistant. Provide evidence-based civic information and misinformation guidance while keeping the response concise and respectful.

    IMPORTANT RESPONSIBLE COMPUTING GUIDANCE:
    - This information is for educational and verification support purposes only
    - Not a substitute for journalism, official election guidance, or legal advice
    - Avoid language that could be used to suppress legitimate political speech
    - If the evidence is insufficient, say so clearly
    - Keep the response concise and usable on mobile devices

    Focus on claim verification, source comparison, civic literacy, and careful handling of uncertain or manipulated media.`;

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

    // Civic-appropriate fallback response
    const fallbackResponse = `I apologize, but I'm experiencing technical difficulties right now. 

  For civic verification, please:
  - Compare the claim against trusted sources
  - Be careful with forwarded or edited media
  - Check official statements where possible

  **Civic Disclaimer:** This AI assistant is not a substitute for journalism, official guidance, or careful verification.`;

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
    service: 'Democracy x AI Backend',
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
  console.log(`Democracy x AI backend running on port ${PORT}`);
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
