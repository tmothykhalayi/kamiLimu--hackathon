# 🏥 HealthAI Assistant - Your Personal Health & Wellness Companion

A production-ready AI-powered healthcare and wellness assistant built with Azure AI, LangChain, and modern web technologies. This application provides evidence-based health information, wellness guidance, and personalized recommendations while maintaining strict medical disclaimers and encouraging professional healthcare consultation.

## 🎯 **Problem Solved**

**Healthcare Information Gap**: People need reliable, accessible health guidance but struggle to navigate complex medical information and don't have 24/7 access to healthcare professionals for general wellness questions.

**Our Solution**: An AI-powered wellness assistant that provides evidence-based health information, wellness tips, and guidance while always emphasizing the importance of professional medical consultation.

## ✨ **Features**

### 🤖 **Dual Chat Modes**
- **Health Assistant**: General health and wellness information with RAG-powered responses
- **Wellness Coach**: Personalized wellness guidance and lifestyle recommendations

### 📚 **Knowledge Base Integration**
- Evidence-based health resources
- Nutrition and exercise guidelines
- Mental health and wellness information
- Preventive care recommendations

### 🛡️ **Safety First**
- Built-in medical disclaimers
- Emergency situation guidance
- Clear boundaries between general information and medical advice
- Encourages professional healthcare consultation

### 🎨 **Modern Healthcare UI**
- Medical-themed gradient design
- Intuitive chat interface
- Mobile-responsive layout
- Accessible design principles

## 🚀 **Why This Template?**

I chose the **Serverless GenAI assistant with LangChain** template because:

1. **Serverless Architecture**: Perfect for healthcare applications that need to scale based on demand
2. **LangChain Integration**: Enables sophisticated RAG implementation for medical information retrieval
3. **Production-Ready**: Comes with Azure infrastructure and deployment configuration
4. **Extensible**: Easy to customize and add healthcare-specific features

## 🛠️ **Customizations Made**

### Backend Transformations
- **Health-Focused System Prompts**: Customized AI prompts for healthcare guidance with medical disclaimers
- **Medical Knowledge Base**: Replaced employee handbook with comprehensive health resources
- **Safety Guardrails**: Added healthcare-specific safety measures and disclaimers
- **Wellness Modes**: Implemented dual chat modes for different types of health guidance

### Frontend Enhancements
- **Healthcare Theme**: Medical gradient design with calming blue and green colors
- **Intuitive Labels**: Changed from "Employee Handbook" to "Health Resources"
- **Safety Disclaimers**: Prominent medical disclaimers and emergency guidance
- **Responsive Design**: Optimized for both desktop and mobile healthcare access

### Infrastructure & Deployment
- **Azure AI Integration**: Leveraged Azure OpenAI for reliable, scalable AI responses
- **RAG Implementation**: Intelligent retrieval of relevant health information
- **Session Management**: Maintains conversation context for personalized guidance
- **Security**: Follows Azure best practices for healthcare data handling

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

## ⚠️ **Important Medical Disclaimers**

- **This application provides general health information only**
- **Not a substitute for professional medical advice, diagnosis, or treatment**
- **Always consult healthcare providers for medical concerns**
- **In emergencies, contact emergency services immediately (911 in the US)**
- **The AI responses are for educational purposes and should not replace medical consultation**

## 📸 **Screenshots**

### Main Interface
![HealthAI Assistant Interface](./screenshots/main-interface.png)

### Chat Interaction
![Healthcare Chat Example](./screenshots/chat-example.png)

## 🔮 **Future Enhancements**

- **Symptom Checker**: Basic symptom assessment with clear medical disclaimers
- **Health Tracking**: Integration with fitness trackers and health apps
- **Multilingual Support**: Health information in multiple languages
- **Accessibility Features**: Enhanced support for users with disabilities
- **Telemedicine Integration**: Connect users with real healthcare providers

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Remember: This tool is for informational purposes only. Always consult with healthcare professionals for medical advice and treatment decisions.**


