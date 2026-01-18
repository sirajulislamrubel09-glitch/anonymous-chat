const socket = io();

const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const typingIndicator = document.getElementById('typingIndicator');

let isConnected = false;
let typingTimeout;

startBtn.addEventListener('click', () => {
    socket.emit('find-partner');
    startBtn.style.display = 'none';
    clearChat();
    addSystemMessage('Looking for a stranger...');
    updateStatus('Looking for someone to chat with...', 'waiting');
});

nextBtn.addEventListener('click', () => {
    socket.emit('next-partner');
    nextBtn.style.display = 'none';
    startBtn.style.display = 'block';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    isConnected = false;
    clearChat();
    addSystemMessage('Disconnected. Click "Start Chat" to find someone new.');
    updateStatus('Click "Start Chat" to begin', '');
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !messageInput.disabled) {
        sendMessage();
    }
});

messageInput.addEventListener('input', () => {
    if (isConnected) {
        socket.emit('typing');
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && isConnected) {
        addMessage(message, 'you');
        socket.emit('send-message', message);
        messageInput.value = '';
        messageInput.focus();
    }
}

socket.on('waiting', () => {
    updateStatus('Waiting for a stranger...', 'waiting');
});

socket.on('partner-found', () => {
    isConnected = true;
    clearChat();
    addSystemMessage('Stranger connected! Say hi! 👋');
    updateStatus('Connected to a stranger', 'connected');
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
    nextBtn.style.display = 'block';
    startBtn.style.display = 'none';
});

socket.on('receive-message', (message) => {
    addMessage(message, 'stranger');
    typingIndicator.style.display = 'none';
});

socket.on('partner-disconnected', () => {
    isConnected = false;
    addSystemMessage('Stranger has disconnected.');
    updateStatus('Stranger disconnected', '');
    messageInput.disabled = true;
    sendBtn.disabled = true;
    nextBtn.style.display = 'none';
    startBtn.style.display = 'block';
});

socket.on('disconnected', () => {
    isConnected = false;
    updateStatus('Click "Start Chat" to find someone new', '');
    messageInput.disabled = true;
    sendBtn.disabled = true;
});

socket.on('partner-typing', () => {
    typingIndicator.style.display = 'inline';
});

socket.on('partner-stop-typing', () => {
    typingIndicator.style.display = 'none';
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    chatBox.innerHTML = '';
}

function updateStatus(text, className) {
    statusText.textContent = text;
    statusBar.className = 'status-bar';
    if (className) {
        statusBar.classList.add(className);
    }
                         }
