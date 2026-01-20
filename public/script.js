// Initialize Socket.io connection
const socket = io();

// Get DOM elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const startBtn = document.getElementById('startBtn');
const inputCockpit = document.getElementById('inputCockpit');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const clearBtn = document.getElementById('clearBtn');
const stopBtn = document.getElementById('stopBtn');
const nextBtn = document.getElementById('nextBtn');

// State
let isConnected = false;
let typingTimeout;

// Initialization
startBtn.addEventListener('click', () => {
    // Haptic tap
    if (navigator.vibrate) navigator.vibrate(40);
    
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    
    if (btnText && loader) {
        btnText.style.display = 'none';
        loader.style.display = 'block';
    }

    setTimeout(() => {
        socket.emit('start');
        welcomeScreen.style.display = 'none';
        inputCockpit.style.display = 'flex';
        statusText.innerText = 'Searching...';
        
        if (btnText && loader) {
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    }, 1200);
});

nextBtn.addEventListener('click', () => {
    socket.emit('next-partner');
    clearChat();
    addSystemMessage('Searching for a new partner...');
    statusText.innerText = 'Searching...';
});

stopBtn.addEventListener('click', () => {
    socket.emit('stop');
    location.reload();
});

clearBtn.addEventListener('click', () => {
    clearChat();
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
    
    if (messageInput.value.trim() && isConnected) {
        sendBtn.disabled = false;
    } else {
        sendBtn.disabled = true;
    }
});

// Socket events
socket.on('waiting', () => {
    statusText.innerText = 'Searching...';
});

socket.on('partner-found', () => {
    isConnected = true;
    statusText.innerText = 'Connected';
    statusDot.classList.add('online');
    stopBtn.style.display = 'block';
    nextBtn.style.display = 'none'; // Hide next until disconnected
    addSystemMessage('CONNECTION ESTABLISHED');
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
});

socket.on('receive-message', (message) => {
    addMessage(message, 'stranger');
});

socket.on('partner-disconnected', () => {
    isConnected = false;
    statusText.innerText = 'Partner disconnected';
    statusDot.classList.remove('online');
    addSystemMessage('LINK LOST');
    messageInput.disabled = true;
    sendBtn.disabled = true;
    nextBtn.style.display = 'block';
    document.getElementById('controls').style.display = 'block';
});

socket.on('disconnected', () => {
    isConnected = false;
    statusText.innerText = 'Disconnected';
    statusDot.classList.remove('online');
});

// Helper functions
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !isConnected) return;
    
    addMessage(message, 'you');
    socket.emit('send-message', message);
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
    const msg = document.createElement('div');
    msg.style.textAlign = 'center';
    msg.style.color = 'var(--text-muted)';
    msg.style.fontSize = '12px';
    msg.style.margin = '10px 0';
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function clearChat() {
    chatBox.innerHTML = '';
}
