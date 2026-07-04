import { LitElement, html } from 'lit';
import { loadMessages, saveMessages, clearMessages } from '../utils/chatStore.js';
import './chat.css'; // Import the CSS file

export class ChatInterface extends LitElement {
  static get properties() {
    return {
      messages: { type: Array },
      inputMessage: { type: String },
      isLoading: { type: Boolean },
      isRetrieving: { type: Boolean },
      ragEnabled: { type: Boolean },
      chatMode: { type: String } // Add new property for mode
    };
  }

  constructor() {
    super();
    // Initialize component state
    this.messages = [];
    this.inputMessage = '';
    this.isLoading = false;
    this.isRetrieving = false;
    this.ragEnabled = true;
    this.chatMode = "basic"; // Set default mode to basic
  }

  // Render into light DOM so external CSS applies
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    // Load chat history from localStorage when component is added to the DOM
    this.messages = loadMessages();
  }

  updated(changedProps) {
    // Save chat history to localStorage whenever messages change
    if (changedProps.has('messages')) {
      saveMessages(this.messages);
    }
  }
// replace the render method with the following code
  render() {
    return html`
    <div class="chat-container">
      <div class="chat-header">
        <button class="clear-cache-btn" @click=${this._clearCache}> 🧹Clear Chat</button>
           <div class="mode-selector">
            <label>Mode:</label>
              <select @change=${this._handleModeChange}>
                <option value="basic" ?selected=${this.chatMode === 'basic'}>Verification Assistant</option>
                <option value="agent" ?selected=${this.chatMode === 'agent'}>Guided Review</option>
              </select>
          </div>
          <label class="rag-toggle ${this.chatMode === 'agent' ? 'disabled' : ''}">
                <input type="checkbox" 
                  ?checked=${this.ragEnabled} 
                  @change=${this._toggleRag}
                  ?disabled=${this.chatMode === 'agent'}>
              Use Civic Resources
          </label>
      </div>
      <div class="chat-messages">
        ${this.messages.map(message => html`
          <div class="message ${message.role === 'user' ? 'user-message' : 'ai-message'}">
            <div class="message-content">
              <span class="message-sender">${message.role === 'user' ? 'You' : 'AI'}</span>
              <p>${message.content}</p>
              ${this.ragEnabled && message.sources && message.sources.length > 0 ? html`
                <details class="sources">
                  <summary>📚 Sources</summary>
                  <div class="sources-content">
                    ${message.sources.map(source => html`<p>${source}</p>`)}
                  </div>
                </details>
              ` : ''}
            </div>
          </div>
        `)}
        ${this.isRetrieving ? html`
          <div class="message system-message">
            <p>🔎 Searching civic resources...</p>
          </div>
        ` : ''}
        ${this.isLoading && !this.isRetrieving ? html`
          <div class="message ai-message">
            <div class="message-content">
              <span class="message-sender">${message.role === 'user' ? 'You' : (this.chatMode === 'agent' ? 'Agent' : 'AI')}</span>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="chat-input">
            <input 
              type="text" 
              placeholder=${this.chatMode === 'basic' ? 
                "Paste a claim, caption, or message..." : 
                "Ask for a deeper review of suspicious content..."} 
              .value=${this.inputMessage}
              @input=${this._handleInput}
              @keyup=${this._handleKeyUp}
            />
        <button @click=${this._sendMessage} ?disabled=${this.isLoading || !this.inputMessage.trim()}>
          Send
        </button>
      </div>
    </div>
  `;
  }

  _handleModeChange(e) {
  const newMode = e.target.value;
  if (newMode !== this.chatMode) {
    this.chatMode = newMode;
    
    // Disable RAG when switching to agent mode
    if (newMode === 'agent') {
      this.ragEnabled = false;
    }
    
    clearMessages();
    this.messages = [];
  }
}

  // add method to handle the toggle change
  _toggleRag(e) {
    this.ragEnabled = e.target.checked;
  }

  // Clear chat history from localStorage and UI
  _clearCache() {
    clearMessages();
    this.messages = [];
  }

  // Update inputMessage state as the user types
  _handleInput(e) {
    this.inputMessage = e.target.value;
  }

  // Send message on Enter key if not loading
  _handleKeyUp(e) {
    if (e.key === 'Enter' && this.inputMessage.trim() && !this.isLoading) {
      this._sendMessage();
    }
  }

  // Handle sending a message and receiving a response
  async _sendMessage() {
    if (!this.inputMessage.trim() || this.isLoading) return;
    
    // Add user's message to the chat
    const userMessage = {
      role: 'user',
      content: this.inputMessage
    };
    
    this.messages = [...this.messages, userMessage];
    const userQuery = this.inputMessage;
    this.inputMessage = '';
    this.isLoading = true;
    
    try {
      // Call the local backend or an overridden API URL.
      const aiResponse = await this._apiCall (userQuery);
      
      // Add AI's response to the chat
      this.messages = [
        ...this.messages,
        { role: 'assistant', content: aiResponse }
      ];
    } catch (error) {
      // Handle errors gracefully
      console.error('Error calling model:', error);
      this.messages = [
        ...this.messages,
        { role: 'assistant', content: `I could not reach the verification backend. Start the local backend in packages/webapi or set a valid API URL. Details: ${error?.message || 'unknown error'}` }
      ];
    } finally {
      this.isLoading = false;
    }
  }

  // Call the backend and return the assistant reply text.
async _apiCall(message) {
  const apiBaseUrl = import.meta.env.VITE_WEBAPI_URL || 'http://localhost:3001';
  const res = await fetch(`${apiBaseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      message,
      useRAG: this.ragEnabled,
      mode: this.chatMode // Send the selected mode to the server
    }),
  });
  const responseText = await res.text();

  if (!res.ok) {
    try {
      const data = JSON.parse(responseText);
      if (data.reply) {
        return data.reply;
      }
    } catch {
      // Not JSON — fall through to error below.
    }
    throw new Error(`Backend returned ${res.status}: ${responseText || res.statusText}`);
  }

  const data = JSON.parse(responseText);
  return data.reply ?? data.message ?? '';
}
}

customElements.define('chat-interface', ChatInterface);