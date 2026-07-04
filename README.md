# Democracy x AI - Information Integrity Assistant

An AI-powered civic information assistant built with Azure AI, LangChain, and modern web technologies. This project focuses on information integrity: helping young Kenyan social media users verify political claims, image content, and election-related messages in simple Swahili before they re-share them.

## 🎯 **Problem Addressed**

Young first-time voters and civic participants need a fast way to check whether political content is trustworthy, but existing fact-checking flows are mostly English-first, web-based, and reactive. This project reframes the sample into a Democracy x AI tool that supports point-of-consumption verification.

## ✨ **Features**

### 🤖 **Dual Chat Modes**
- **Basic Verification**: Fast claim-checking support for political posts and rumors
- **Guided Review**: More detailed analysis for suspicious text, images, or links

### 📚 **Knowledge Base Integration**
- Information integrity and election literacy resources
- Fact-checking guidance and source evaluation tips
- Swahili-first civic support copy
- Responsible computing reminders for bias, misuse, and privacy

### 🛡️ **Safety First**
- Clear boundaries around uncertain claims
- Abuse-resistance language to discourage suppression of legitimate speech
- Low-data, mobile-first wording for broad access
- Respect for Kenyan language and regional context

### 🎨 **Modern Civic UI**
- Clean civic-themed interface
- Intuitive chat flow for quick verification
- Mobile-responsive layout
- Accessible design principles

## 🚀 **Why This Template?**

I chose the **Serverless GenAI assistant with LangChain** template because:

1. **Serverless Architecture**: Useful for a verification assistant that may see bursty traffic around civic moments
2. **LangChain Integration**: Supports retrieval from trusted civic sources and fact-check guidance
3. **Production-Ready**: Comes with Azure infrastructure and deployment configuration
4. **Extensible**: Easy to customize for multilingual civic information workflows

## 🛠️ **Customizations Made**

### Backend Transformations
- **Civic System Prompts**: Reframed responses around information integrity, claim checking, and careful uncertainty handling
- **Democracy Knowledge Base**: Replaced the old sample content with election integrity and fact-checking resources
- **Safety Guardrails**: Added language to reduce misuse against legitimate political speech
- **Verification Modes**: Implemented modes for quick checks and deeper review

### Frontend Enhancements
- **Civic Theme**: Updated the app identity toward Democracy x AI
- **Intuitive Labels**: Changed the sample language to fit verification and information integrity
- **Safety Disclaimers**: Prominent reminders about uncertainty and responsible use
- **Responsive Design**: Optimized for mobile-first civic use

### Infrastructure & Deployment
- **Azure AI Integration**: Leveraged Azure AI for scalable assistant responses
- **RAG Implementation**: Retrieval grounded in trusted civic content
- **Session Management**: Maintains conversation context for follow-up verification
- **Security**: Designed around responsible computing and privacy-aware usage

## 🏃‍♂️ **Quick Start**

### Prerequisites
- Azure subscription with Azure OpenAI access
- Node.js 18+ installed
- Azure Developer CLI installed

### Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
# Edit with your Azure OpenAI credentials
```

### Local Development
```bash
# Start the backend API
cd packages/webapi
npm start

# Start the frontend (in another terminal)
cd packages/webapp
npm run dev
```

### Azure Deployment
```bash
# Login to Azure
azd auth login

# Deploy to Azure
azd up
```

## ⚠️ **Important Civic Disclaimers**

- **This application provides general information integrity support only**
- **Not a substitute for journalism, official electoral guidance, or legal advice**
- **Always verify critical claims with trusted, primary sources**
- **In urgent civic safety situations, follow official guidance from the appropriate authorities**
- **The AI responses are for educational purposes and should not be used to suppress legitimate political speech**

## 📸 **Screenshots**

### Main Interface
![HealthAI Assistant Interface](./screenshots/main-interface.png)

### Chat Interaction
![Healthcare Chat Example](./screenshots/chat-example.png)

## 🔮 **Future Enhancements**

- **Claim Scanner**: Scan screenshots, captions, and forwarded messages
- **WhatsApp-Friendly Flow**: Lightweight verification shared through familiar channels
- **Multilingual Support**: Swahili and other Kenyan language support
- **Accessibility Features**: Enhanced support for users with low literacy and limited data
- **Source Comparison**: Side-by-side trust signals for civic claims

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Remember: This tool is for informational purposes only. Always consult with healthcare professionals for medical advice and treatment decisions.**


