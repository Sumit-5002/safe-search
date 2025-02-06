// Initialize AI Chatbot
class SafeKidsAIChatbot {
    constructor() {
        this.chatContainer = null;
        this.isVisible = false;
        this.createChatInterface();
    }

    createChatInterface() {
        // Create chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'safe-kids-chat';
        this.chatContainer.style.display = 'none';
        
        // Add chat HTML
        this.chatContainer.innerHTML = `
            <div class="chat-header">
                <span class="chat-title">👋 Safe Kids Helper</span>
                <button class="close-btn">×</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Ask me anything!">
                <button class="send-btn">Send</button>
            </div>
        `;
        
        document.body.appendChild(this.chatContainer);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.chatContainer.querySelector('.close-btn');
        const sendBtn = this.chatContainer.querySelector('.send-btn');
        const input = this.chatContainer.querySelector('input');

        closeBtn.addEventListener('click', () => this.toggleChat());
        sendBtn.addEventListener('click', () => this.handleUserMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });
    }

    async handleUserMessage() {
        const input = this.chatContainer.querySelector('input');
        const message = input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';

        try {
            // Call RASO AI for response
            const response = await fetch('https://api.raso.ai/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    context: 'child_safe'
                })
            });

            const data = await response.json();
            this.addMessage('bot', data.response);
        } catch (error) {
            this.addMessage('bot', "I'm sorry, I couldn't process that right now. Please try again!");
        }
    }

    addMessage(type, content) {
        const messagesContainer = this.chatContainer.querySelector('.chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    toggleChat() {
        this.isVisible = !this.isVisible;
        this.chatContainer.style.display = this.isVisible ? 'block' : 'none';
    }
}

// Initialize content filtering
class ContentFilter {
    constructor() {
        this.setupMutationObserver();
        this.filterExistingContent();
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        this.filterElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    filterExistingContent() {
        this.filterElement(document.body);
    }

    async filterElement(element) {
        // Check text content
        if (element.textContent) {
            try {
                const response = await fetch('https://api.raso.ai/v1/content-filter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: element.textContent,
                        content_type: 'text'
                    })
                });

                const data = await response.json();
                if (data.safety_score < 0.7) {
                    element.style.display = 'none';
                }
            } catch (error) {
                console.error('Error filtering content:', error);
            }
        }

        // Check images
        element.querySelectorAll('img').forEach(async (img) => {
            try {
                const response = await fetch('https://api.raso.ai/v1/content-filter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: img.src,
                        content_type: 'image'
                    })
                });

                const data = await response.json();
                if (data.safety_score < 0.7) {
                    img.style.display = 'none';
                }
            } catch (error) {
                console.error('Error filtering image:', error);
            }
        });
    }
}

// Initialize components
const chatbot = new SafeKidsAIChatbot();
const contentFilter = new ContentFilter();

// Add chat toggle button
const toggleButton = document.createElement('button');
toggleButton.id = 'chat-toggle-btn';
toggleButton.innerHTML = '🤖';
toggleButton.addEventListener('click', () => chatbot.toggleChat());
document.body.appendChild(toggleButton);
