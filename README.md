# Democracy x AI - Information Integrity Assistant

> Built during the Democracy & AI Hackathon - July 4th, 2026 Hosted by Mozilla Foundation & KamiLimu

---

## Team

**Team Name:** [Insert Team Name]  
**University:** Kirinyaga University

| Name | Role | GitHub |
| --- | --- | --- |
| Timothy Khalayi | Research, problem framing, responsible computing | [@handle](https://github.com/) |
| Faith Karango | Research, 5 WHYs, drafting and refinement | [@handle](https://github.com/) |

---

## Problem & User

### Problem Statement

> Young first-time voters and civic participants in Kenya cannot reliably verify political claims, forwarded messages, images, or short videos before resharing them because the most visible fact-checking flows are English-first, web-based, and reactive rather than immediate and Swahili-first.

### Target User

| Dimension | Detail |
| --- | --- |
| Primary user | First-time voters in Nairobi informal settlements and nearby peri-urban wards who rely on social media and messaging apps for political news |
| Tech comfort | Comfortable with WhatsApp, Facebook, Instagram, and simple text inputs; limited tolerance for complex apps |
| Language | Swahili and Kenyan English; not English-only |
| Current workflow | Receives political claims through forwarded messages or social posts and has no fast way to verify them before resharing |

### The Specific Gap

1. **What's already there:** Africa Check, PesaCheck, and MAPEMA provide fact-checking, monitoring, and debunking for misinformation and manipulated media.
2. **Why it falls short:** Their outputs are mostly English-language, website-based, and published after the fact rather than inside the mobile sharing flow where misinformation is first encountered.
3. **The gap we fill:** A lightweight, Swahili-first verification assistant that gives a plain-language answer at the point of consumption, before the user decides to re-share.

### Why It Matters

> When young voters cannot quickly judge whether political content is real, misinformation spreads faster, trust in institutions weakens, and democratic participation becomes less informed. Closing this gap restores a basic civic feedback loop: informed people can verify before they share.

---

## Run Instructions

### Prerequisites

- Node.js 18+
- npm or pnpm
- Azure Developer CLI (`azd`) for deployment
- Optional: Azure OpenAI or Azure AI Inference credentials for cloud-backed responses

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/KamiLimu1/hackathon-template.git
cd hackathon-template

# 2. Install dependencies
npm install
cd packages/webapi && npm install
cd ../webapp && npm install
cd ../..

# 3. Start the local backend
cd packages/webapi
npm start

# 4. Start the frontend in another terminal
cd packages/webapp
npm run dev
```

### Azure Deployment

```bash
# Log in to Azure
azd auth login

# Deploy the app
azd up
```

---

## 📁 Project Structure

```text
.
├── README.md
├── docs/
│   └── democracy-ai-problem-statement-revised.md
├── data/
│   └── health_resources.txt
├── packages/
│   ├── api/
│   │   └── src/
│   │       └── functions/
│   ├── webapi/
│   │   ├── server-fixed.js
│   │   └── agentService.js
│   └── webapp/
│       └── src/
│           └── components/
├── azure.yaml
└── index.html
```

---

## Approach & Architecture

```text
[User] → [WhatsApp / Web App] → [Backend / API] → [LLM / RAG Pipeline] → [Response]
```

This project uses a civic information assistant flow:
- The web app accepts a political claim or suspicious message.
- The backend checks the message against trusted civic resources.
- The assistant returns a concise, Swahili-friendly verification response.
- The result is designed to be readable on mobile and useful before resharing.

---

## License

MIT © [Team Name], 2026
