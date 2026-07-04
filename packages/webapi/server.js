import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { AzureChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { AgentService } from "./agentService.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const healthResourcesPath = path.join(projectRoot, 'data/health_resources.txt'); // Changed to text file

// Initialize Azure OpenAI with error handling
let chatModel;
try {
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.INSTANCE_NAME || !process.env.DEPLOYMENT_NAME) {
    console.error('Missing Azure OpenAI configuration. Please check your .env file.');
    console.log('Required variables: AZURE_OPENAI_API_KEY, INSTANCE_NAME, DEPLOYMENT_NAME');
  } else {
    chatModel = new AzureChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.INSTANCE_NAME, // In target url: https://<INSTANCE_NAME>.services...
      azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME, // i.e "gpt-4o"
      azureOpenAIApiVersion: "2024-08-01-preview", // In target url: ...<VERSION>
      temperature: 0.7,
      maxTokens: 800,
    });
    console.log('Azure OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Azure OpenAI client:', error);
}

const sessionMemories = {};
function getSessionMemory(sessionId) {
  if (!sessionMemories[sessionId]) {
    const history = new ChatMessageHistory();
    sessionMemories[sessionId] = new BufferMemory({
      chatHistory: history,
      returnMessages: true,
      memoryKey: "chat_history",
    });
  }
  return sessionMemories[sessionId];
}


let healthText = null; 
let healthChunks = []; 
const CHUNK_SIZE = 800; 

async function loadHealthResources() {
  if (healthText) return healthText;

  if (!fs.existsSync(healthResourcesPath)) return "Health resources not found.";

  // Read text file directly
  healthText = fs.readFileSync(healthResourcesPath, 'utf-8');
  
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
  return healthText;
}

// const agentService = new AgentService(); // Temporarily disabled

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HealthAI Assistant Backend',
    azureOpenAI: chatModel ? 'connected' : 'disconnected',
    environment: {
      apiKey: process.env.AZURE_OPENAI_API_KEY ? 'configured' : 'missing',
      instanceName: process.env.INSTANCE_NAME ? 'configured' : 'missing',
      deployment: process.env.DEPLOYMENT_NAME || 'not set'
    }
  });
});

// Documents endpoint (for compatibility)
app.get('/documents', (req, res) => {
  res.json([]);
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const useRAG = req.body.useRAG === undefined ? true : req.body.useRAG;
  const sessionId = req.body.sessionId || "default";

  const mode = req.body.mode || "basic";

// If agent mode is selected, route to agent service
if (mode === "agent") {
  // const agentResponse = await agentService.processMessage(sessionId, userMessage);
  // Temporary response for agent mode
  return res.json({
    reply: "Agent mode is temporarily disabled. Please use Basic AI mode with Health Resources enabled for healthcare guidance.",
    sources: []
  });
}

  let sources = [];

  const memory = getSessionMemory(sessionId);
  const memoryVars = await memory.loadMemoryVariables({});

  if (useRAG) {
    await loadHealthResources();
    sources = retrieveRelevantContent(userMessage);
  }

  // Prepare system prompt
  const systemMessage = useRAG
    ? {
        role: "system",
        content: sources.length > 0
          ? `You are a knowledgeable Healthcare & Wellness Assistant. Use the provided evidence-based health information to answer questions. Always include appropriate disclaimers about consulting healthcare professionals for medical concerns.

IMPORTANT DISCLAIMERS:
- This is for informational purposes only
- Not a substitute for professional medical advice
- Always consult healthcare providers for medical concerns
- In emergencies, contact emergency services immediately

--- HEALTH RESOURCES ---
${sources.join('\n\n')}
--- END OF RESOURCES ---

Provide helpful, accurate information while emphasizing the importance of professional medical consultation when appropriate.`
          : `You are a Healthcare & Wellness Assistant. I don't have specific health information for this question in my knowledge base, but I can provide general wellness guidance. 

IMPORTANT DISCLAIMERS:
- This is for informational purposes only
- Not a substitute for professional medical advice  
- Always consult healthcare providers for medical concerns
- In emergencies, contact emergency services immediately

Please provide general wellness information while emphasizing the importance of consulting healthcare professionals.`,
      }
    : {
        role: "system",
        content: `You are a helpful Healthcare & Wellness Assistant. Provide evidence-based health and wellness information while always including appropriate medical disclaimers.

IMPORTANT DISCLAIMERS:
- This is for informational purposes only
- Not a substitute for professional medical advice
- Always consult healthcare providers for medical concerns  
- In emergencies, contact emergency services immediately

Focus on general wellness, healthy lifestyle tips, and preventive care information.`,
      };

  try {
    // Check if chatModel is available
    if (!chatModel) {
      const fallbackResponse = `I apologize, but the AI service is not properly configured. 

For health information, I recommend:
- Consulting with your healthcare provider
- Visiting reputable health websites like CDC.gov or WHO.int
- Calling emergency services for urgent medical concerns

**Medical Disclaimer:** This AI assistant is not a substitute for professional medical advice, diagnosis, or treatment.`;

      return res.json({
        reply: fallbackResponse,
        sources: []
      });
    }

    // Build final messages array
    const messages = [
      systemMessage,
      ...(memoryVars.chat_history || []),
      { role: "user", content: userMessage },
    ];

    const response = await chatModel.invoke(messages);

    console.log('Raw LangChain response:', typeof response, response);

    // Extract the content properly from the LangChain response
    let responseContent;
    if (typeof response === 'string') {
      responseContent = response;
    } else if (response && response.content) {
      responseContent = response.content;
    } else if (response && response.text) {
      responseContent = response.text;
    } else {
      responseContent = String(response);
    }

    console.log('Extracted content:', responseContent);

    await memory.saveContext({ input: userMessage }, { output: responseContent });

    res.json({ reply: responseContent, sources });
  } catch (err) {
    console.error(err);
    
    // Healthcare-appropriate fallback response
    const fallbackResponse = `I apologize, but I'm experiencing technical difficulties right now. 

For immediate medical concerns, please:
- Contact your healthcare provider
- Call emergency services if urgent
- Visit reputable health websites like CDC.gov or WHO.int

**Medical Disclaimer:** This AI assistant is not a substitute for professional medical advice, diagnosis, or treatment.`;

    res.status(500).json({
      error: "Model call failed",
      message: err.message,
      reply: fallbackResponse,
      sources: []
    });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`HealthAI Assistant backend running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Azure OpenAI status: ${chatModel ? 'Connected' : 'Not configured'}`);
  
  if (!chatModel) {
    console.log('\n⚠️  Azure OpenAI not configured - chat will use fallback responses');
    console.log('To enable AI responses, set these environment variables:');
    console.log('- AZURE_OPENAI_API_KEY');
    console.log('- INSTANCE_NAME');
    console.log('- DEPLOYMENT_NAME');
  }
});
