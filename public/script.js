// Initialize Socket.io connection
const socket = io();

// Get DOM elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const cockpitStartBtn = document.getElementById('cockpitStartBtn');
const cockpitNextBtn = document.getElementById('cockpitNextBtn');
const overlay = document.querySelector('.cockpit-overlay-controls');
const typingBubble = document.getElementById('typingBubble');
const statusDot = document.getElementById('statusDot');
const statusSubtext = document.getElementById('statusSubtext');
const resetBtn = document.getElementById('resetBtn');

// State
let isConnected = false;
let typingTimeout;

// Initialization
cockpitStartBtn.addEventListener('click', () => {
    socket.emit('find-partner');
    overlay.style.display = 'none';
    clearChat();
    addSystemMessage('SEARCHING NEURAL NETWORK...');
    updateStatus('Searching...', false);
});

cockpitNextBtn.addEventListener('click', () => {
    socket.emit('next-partner');
    overlay.style.display = 'flex';
    cockpitNextBtn.style.display = 'none';
    cockpitStartBtn.style.display = 'block';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    isConnected = false;
    clearChat();
    addSystemMessage('DISCONNECTED');
    updateStatus('Offline', false);
});

resetBtn.addEventListener('click', () => {
    location.reload();
});

// Auto-resize textarea and handle keyboard
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
    
    // Enable/disable send button based on input
    if (messageInput.value.trim() && isConnected) {
        sendBtn.disabled = false;
    } else {
        sendBtn.disabled = true;
    }
    
    // Send typing indicator
    if (isConnected && messageInput.value.trim()) {
        socket.emit('typing');
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop-typing');
        }, 1000);
    }
});

// Scroll chat when keyboard opens
messageInput.addEventListener('focus', () => {
    setTimeout(() => {
        scrollToBottom();
    }, 300);
});

// Socket events
socket.on('waiting', () => {
    updateStatus('Awaiting Signal...', false);
});

socket.on('partner-found', () => {
    isConnected = true;
    overlay.style.display = 'none';
    clearChat();
    addSystemMessage('CONNECTION ESTABLISHED');
    updateStatus('Linked', true);
    
    // Enable input
    messageInput.disabled = false;
    messageInput.focus();
    
    // Show next button in overlay
    cockpitNextBtn.style.display = 'block';
    cockpitStartBtn.style.display = 'none';
});

socket.on('receive-message', (message) => {
    addMessage(message, 'stranger', true);
    hideTypingIndicator();
    playNotificationSound();
});

socket.on('partner-disconnected', () => {
    isConnected = false;
    addSystemMessage('LINK LOST');
    updateStatus('Offline', false);
    
    // Disable input
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // Show overlay with start button
    overlay.style.display = 'flex';
    cockpitNextBtn.style.display = 'none';
    cockpitStartBtn.style.display = 'block';
    
    hideTypingIndicator();
});

// Modify existing sendMessage to use cockpit logic
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !isConnected) return;
    
    addMessage(message, 'you', true);
    socket.emit('send-message', message);
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;
    messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !messageInput.disabled) {
        e.preventDefault();
        sendMessage();
    }
});


// Socket events
socket.on('waiting', () => {
    updateStatus('Waiting...', false);
});

socket.on('partner-found', () => {
    isConnected = true;
    clearChat();
    addSystemMessage('✨ Stranger connected!');
    updateStatus('Online', true);
    
    // Enable input
    messageInput.disabled = false;
    messageInput.focus();
    
    // Show next button
    nextBtn.style.display = 'flex';
    startBtn.style.display = 'none';
});

socket.on('receive-message', (message) => {
    addMessage(message, 'stranger', true);
    hideTypingIndicator();
    playNotificationSound();
});

socket.on('partner-disconnected', () => {
    isConnected = false;
    addSystemMessage('💔 Stranger disconnected');
    updateStatus('Offline', false);
    
    // Disable input
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // Show start button
    nextBtn.style.display = 'none';
    startBtn.style.display = 'flex';
    
    hideTypingIndicator();
});

socket.on('disconnected', () => {
    isConnected = false;
    updateStatus('Offline', false);
    messageInput.disabled = true;
    sendBtn.disabled = true;
    hideTypingIndicator();
});

socket.on('partner-typing', () => {
    showTypingIndicator();
});

socket.on('partner-stop-typing', () => {
    hideTypingIndicator();
});

// Helper functions
function addMessage(text, sender, showTime = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    
    // Add timestamp and status
    if (showTime) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = getCurrentTime();
        metaDiv.appendChild(timeSpan);
        
        // Add delivery status for "you" messages
        if (sender === 'you') {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'message-status';
            statusDiv.innerHTML = `
                <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg class="checkmark read" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
            metaDiv.appendChild(statusDiv);
            
            // Animate checkmarks
            setTimeout(() => {
                statusDiv.querySelectorAll('.checkmark').forEach(check => {
                    check.style.animation = 'fadeIn 0.3s ease-out';
                });
            }, 300);
        }
        
        messageDiv.appendChild(metaDiv);
    }
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function clearChat() {
    chatBox.innerHTML = '';
}

function updateStatus(text, online) {
    statusSubtext.textContent = text;
    if (online) {
        statusDot.classList.add('online');
    } else {
        statusDot.classList.remove('online');
    }
}

function showTypingIndicator() {
    typingBubble.style.display = 'block';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingBubble.style.display = 'none';
}

function scrollToBottom() {
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silent fail
    }
}

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    if (isConnected) {
        e.preventDefault();
        e.returnValue = 'You are currently chatting. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Focus input on load
window.addEventListener('load', () => {
    if (!messageInput.disabled) {
        messageInput.focus();
    }
});
