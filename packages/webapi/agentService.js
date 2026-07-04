// Simplified agent service for healthcare assistant
export class AgentService {
  constructor() {
    // Simplified implementation for healthcare assistance
    this.sessionContexts = {};
  }

  async processMessage(sessionId, userMessage) {
    // Initialize session context if it doesn't exist
    if (!this.sessionContexts[sessionId]) {
      this.sessionContexts[sessionId] = {
        conversationHistory: [],
        healthTopics: []
      };
    }

    const context = this.sessionContexts[sessionId];
    
    // Add user message to history
    context.conversationHistory.push({
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Generate healthcare-focused response based on the message
    let reply = this.generateHealthcareResponse(userMessage, context);

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

  generateHealthcareResponse(userMessage, context) {
    const message = userMessage.toLowerCase();
    
    // Health-related keywords and responses
    if (message.includes('diet') || message.includes('nutrition') || message.includes('food')) {
      return `🥗 **Nutrition Guidance**: For a healthy diet, focus on eating a variety of fruits, vegetables, whole grains, and lean proteins. Limit processed foods and added sugars. 

**Important**: This is general guidance only. For personalized nutrition advice, especially if you have health conditions, please consult with a registered dietitian or your healthcare provider.`;
    }
    
    if (message.includes('exercise') || message.includes('workout') || message.includes('fitness')) {
      return `🏃‍♀️ **Exercise Recommendations**: Adults should aim for at least 150 minutes of moderate-intensity aerobic activity per week, plus muscle-strengthening activities twice a week.

**Important**: Before starting any new exercise program, especially if you have health conditions or haven't been active, consult with your healthcare provider first.`;
    }
    
    if (message.includes('sleep') || message.includes('tired') || message.includes('insomnia')) {
      return `😴 **Sleep Health**: Most adults need 7-9 hours of quality sleep per night. Good sleep hygiene includes a consistent bedtime routine, avoiding screens before bed, and keeping your bedroom cool and dark.

**Important**: If you're experiencing persistent sleep problems, this could indicate an underlying health issue. Please consult with a healthcare professional.`;
    }
    
    if (message.includes('stress') || message.includes('anxiety') || message.includes('mental health')) {
      return `🧠 **Mental Health Support**: Stress management techniques include deep breathing, meditation, regular exercise, and maintaining social connections. It's important to recognize when stress becomes overwhelming.

**Important**: If you're experiencing persistent stress, anxiety, or other mental health concerns, please reach out to a mental health professional or your healthcare provider. Mental health is just as important as physical health.`;
    }

    if (message.includes('pain') || message.includes('hurt') || message.includes('ache')) {
      return `⚠️ **Pain Management**: While some minor aches are normal, persistent or severe pain should be evaluated by a healthcare professional. In the meantime, rest, ice/heat therapy, and over-the-counter pain relievers may help with minor discomfort.

**Important**: This is not medical advice. For any concerning pain, especially chest pain, severe headaches, or sudden onset pain, seek immediate medical attention.`;
    }

    // Default healthcare response
    return `🏥 **Healthcare Assistant**: I'm here to provide general health and wellness information. I can help with topics like nutrition, exercise, sleep, stress management, and general wellness.

**Remember**: 
- This information is for educational purposes only
- Always consult healthcare professionals for medical advice
- In emergencies, contact emergency services immediately
- I cannot diagnose conditions or replace professional medical consultation

What specific health topic would you like to learn about?`;
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