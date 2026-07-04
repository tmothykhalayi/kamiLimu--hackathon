// Simplified agent service for civic verification support
export class AgentService {
  constructor() {
    // Simplified implementation for civic verification assistance
    this.sessionContexts = {};
  }

  async processMessage(sessionId, userMessage) {
    // Initialize session context if it doesn't exist
    if (!this.sessionContexts[sessionId]) {
      this.sessionContexts[sessionId] = {
        conversationHistory: [],
        civicTopics: []
      };
    }

    const context = this.sessionContexts[sessionId];
    
    // Add user message to history
    context.conversationHistory.push({
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Generate civic-focused response based on the message
    let reply = this.generateCivicResponse(userMessage, context);

    // Add agent response to history
    context.conversationHistory.push({
      role: "agent",
      content: reply,
      timestamp: new Date().toISOString()
    });

    return {
      reply: reply,
      sources: []
    };
  }

  generateCivicResponse(userMessage, context) {
    const message = userMessage.toLowerCase();
    
    // Civic-related keywords and responses
    if (message.includes('claim') || message.includes('fact') || message.includes('verify')) {
      return `🔎 **Claim Check Guidance**: Compare the claim against trusted sources, look for the original post or statement, and be cautious with screenshots or forwarded messages.

**Important**: This is general verification guidance only. If the evidence is unclear, say so rather than guessing.`;
    }
    
    if (message.includes('image') || message.includes('video') || message.includes('deepfake')) {
      return `🧾 **Media Verification**: Check for mismatched text, odd shadows, recycled old clips, or other signs of manipulation. Reverse image search and source comparison can help.

**Important**: A convincing image or video is not proof of truth. Treat synthetic media carefully.`;
    }
    
    if (message.includes('swahili') || message.includes('language') || message.includes('dialect')) {
      return `🗣️ **Language Support**: Use simple Swahili, keep the answer short, and avoid jargon so the result is easy to understand on a phone.

**Important**: Different Kenyan dialects and local context matter, so test for clarity across regions.`;
    }
    
    if (message.includes('privacy') || message.includes('data') || message.includes('tracking')) {
      return `🔐 **Privacy Reminder**: Avoid collecting unnecessary personal data and be careful with any civic tool that could expose users to surveillance.

**Important**: Low-data and privacy-aware design matters most for the people who need verification the most.`;
    }

    if (message.includes('misuse') || message.includes('abuse') || message.includes('suppression')) {
      return `⚠️ **Misuse Risk**: A verification tool can be abused to suppress legitimate political speech if it flags content too aggressively.

**Important**: Keep the system careful, explain uncertainty, and avoid overclaiming.`;
    }

    // Default civic response
    return `🏛️ **Democracy x AI Assistant**: I'm here to provide general information integrity support. I can help with verifying claims, checking media, and keeping explanations simple in Swahili.

**Remember**: 
- This information is for educational and verification support only
- Always check important civic claims against trusted sources
- If the evidence is unclear, say so
- I cannot replace journalism, official guidance, or careful human judgment

What civic claim would you like to verify?`;
  }

  // Clean up old sessions (optional - for memory management)
  cleanupOldSessions() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const sessionId in this.sessionContexts) {
      const lastMessage = this.sessionContexts[sessionId].conversationHistory.slice(-1)[0];
      if (lastMessage && new Date(lastMessage.timestamp) < oneHourAgo) {
        delete this.sessionContexts[sessionId];
      }
    }
  }
}