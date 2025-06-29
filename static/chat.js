let socket = io();
let currentRoom = 'General';
let username = document.getElementById('username').textContent;
let roomMessages = {};

// Socket event listeners
socket.on('connect', () => {
	joinRoom('General');
	highlightActiveRoom('General');
});

socket.on('message', (data) => {
	addMessage(
		data.username,
		data.msg,
		data.username === username ? 'own' : 'other'
	);
});

socket.on('private_message', (data) => {
	addMessage(data.from, `[Private] ${data.msg}`, 'private');
});

socket.on('status', (data) => {
	addMessage('System', data.msg, 'system');
});

socket.on('active_users', (data) => {
    const userList = document.getElementById('active-users');
    userList.innerHTML = data.users
        .map(
            (user) => `
            <div class="user-item${user === username ? ' me' : ''}" onclick="insertPrivateMessage('${user}')">
                <span class="user-avatar">${user[0].toUpperCase()}</span>
                ${user} ${user === username ? '(you)' : ''}
            </div>
        `
        )
        .join('');
});

// Message handling
function addMessage(sender, message, type, timestamp = null) {
    if (!roomMessages[currentRoom]) {
        roomMessages[currentRoom] = [];
    }
    roomMessages[currentRoom].push({ sender, message, type, timestamp });

    const chat = document.getElementById('chat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}` +
        (timestamp ? `<span class="timestamp">${new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : '');

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

function showFloatingEmoji() {
    const emojis = ['💬','✨','🎉','😺','🌈','💖','🦄','😃','🥳','🎈','🐾','🍀','🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emoji;
    el.style.left = (Math.random() * 80 + 10) + 'vw';
    el.style.bottom = '40px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
}

function sendMessage() {
	const input = document.getElementById('message');
	const message = input.value.trim();

	if (!message) return;

	if (message.startsWith('@')) {
		// Send private message
		const [target, ...msgParts] = message.substring(1).split(' ');
		const privateMsg = msgParts.join(' ');

		if (privateMsg) {
			socket.emit('message', {
				msg: privateMsg,
				type: 'private',
				target: target,
			});
		}
	} else {
		// Send room message
		socket.emit('message', {
			msg: message,
			room: currentRoom,
		});
	}

	showFloatingEmoji();

	input.value = '';
	input.focus();
}

function joinRoom(room) {
	socket.emit('leave', { room: currentRoom });
	currentRoom = room;
	socket.emit('join', { room });

	highlightActiveRoom(room);

	// Show room history
	const chat = document.getElementById('chat');
	chat.innerHTML = '';

	if (roomMessages[room]) {
		roomMessages[room].forEach((msg) => {
			addMessage(msg.sender, msg.message, msg.type);
		});
	}
}

function insertPrivateMessage(user) {
	document.getElementById('message').value = `@${user} `;
	document.getElementById('message').focus();
}

function handleKeyPress(event) {
	if (event.key === 'Enter' && !event.shiftKey) {
		event.preventDefault();
		sendMessage();
	}
}

// Initialize chat when page loads
let chat;
document.addEventListener('DOMContentLoaded', () => {
	chat = new ChatApp();
	if ('Notification' in window) {
		Notification.requestPermission();
	}
});

// Add this new function to handle room highlighting
function highlightActiveRoom(room) {
	document.querySelectorAll('.room-item').forEach((item) => {
		item.classList.remove('active-room');
		if (item.textContent.trim() === room) {
			item.classList.add('active-room');
		}
	});
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('active');
}