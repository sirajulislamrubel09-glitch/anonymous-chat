// Initialize Socket.io connection
const socket = io();

// Get DOM elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const typingIndicator = document.getElementById('typingIndicator');

// State
let isConnected = false;
let typingTimeout;

// Start chat button
startBtn.addEventListener('click', () => {
    socket.emit('find-partner');
    startBtn.style.display = 'none';
    clearChat();
    addSystemMessage('🔍 Searching for a stranger in the shadows...');
    updateStatus('Looking for someone...', 'waiting');
});

// Next button (find new partner)
nextBtn.addEventListener('click', () => {
    socket.emit('next-partner');
    nextBtn.style.display = 'none';
    startBtn.style.display = 'block';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    isConnected = false;
    clearChat();
    addSystemMessage('👻 You left the chat. Click "Enter Chat" to find someone new.');
    updateStatus('Click "Enter Chat" to begin', '');
});

// Send message button
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !messageInput.disabled) {
        sendMessage();
    }
});

// Typing indicator
messageInput.addEventListener('input', () => {
    if (isConnected) {
        socket.emit('typing');
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    }
});

// Function to send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && isConnected) {
        // Add message to chat
        addMessage(message, 'you');
        
        // Send to server
        socket.emit('send-message', message);
        
        // Clear input
        messageInput.value = '';
        messageInput.focus();
    }
}

// Socket events
socket.on('waiting', () => {
    updateStatus('⏳ Waiting for a stranger...', 'waiting');
});

socket.on('partner-found', () => {
    isConnected = true;
    clearChat();
    addSystemMessage('✨ Stranger connected! You are now chatting anonymously.');
    updateStatus('🟢 Connected to stranger', 'connected');
    
    // Enable input
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
    
    // Show next button
    nextBtn.style.display = 'block';
    startBtn.style.display = 'none';
});

socket.on('receive-message', (message) => {
    addMessage(message, 'stranger');
    typingIndicator.style.display = 'none';
    
    // Play notification sound (optional)
    playNotificationSound();
});

socket.on('partner-disconnected', () => {
    isConnected = false;
    addSystemMessage('💔 Stranger has disconnected.');
    updateStatus('Stranger left the chat', '');
    
    // Disable input
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // Show start button
    nextBtn.style.display = 'none';
    startBtn.style.display = 'block';
});

socket.on('disconnected', () => {
    isConnected = false;
    updateStatus('Click "Enter Chat" to find someone new', '');
    messageInput.disabled = true;
    sendBtn.disabled = true;
});

socket.on('partner-typing', () => {
    typingIndicator.style.display = 'inline';
});

socket.on('partner-stop-typing', () => {
    typingIndicator.style.display = 'none';
});

// Helper functions
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    scrollToBottom();
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

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Optional: Play notification sound when message received
function playNotificationSound() {
    // You can add a subtle beep sound here
    // For now, we'll use the Web Audio API to create a simple beep
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context is not supported
    }
}

// Update online counter (simulated - you can make this real later)
function updateOnlineCount() {
    const userCountElement = document.getElementById('userCount');
    if (userCountElement) {
        // Random number between 50-200 for demo purposes
        const count = Math.floor(Math.random() * 150) + 50;
        userCountElement.textContent = `${count} Online`;
    }
}

// Update online count every 10 seconds
setInterval(updateOnlineCount, 10000);
updateOnlineCount(); // Initial call

// Focus input when page loads
window.addEventListener('load', () => {
    messageInput.focus();
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    if (isConnected) {
        e.preventDefault();
        e.returnValue = 'You are currently chatting. Are you sure you want to leave?';
        return e.returnValue;
    }
});
