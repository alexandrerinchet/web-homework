const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000";

let currentUser = null;
let currentRoom = null;
let ws = null;

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

async function joinSystem() {
    const nameInput = document.getElementById('username-input').value.trim();
    if (!nameInput) return;
    
    // inscription et vérification de l'utilisateur en backend
    await fetch(`${API_URL}/users?name=${nameInput}`, { method: 'POST' });

    currentUser = nameInput;
    document.getElementById('current-user-display').innerText = currentUser;
    showView('rooms-view');
    fetchRooms();
}

async function fetchRooms() {
    const list = document.getElementById('rooms-list');
    list.innerHTML = 'Chargement des salons...';
    
    try {
        const response = await fetch(`${API_URL}/rooms`);
        if (!response.ok) throw new Error('Erreur de réseau');
        const rooms = await response.json();
        renderRooms(rooms);
    } catch (error) {
        list.innerHTML = `<li style="color:red">Erreur : Backend introuvable. Avez-vous lancé FastAPI ?</li>`;
    }
}

function renderRooms(rooms) {
    const list = document.getElementById('rooms-list');
    list.innerHTML = '';
    
    if (rooms.length === 0) {
        list.innerHTML = '<li>Aucun salon disponible. Créez-en un via le terminal.</li>';
        return;
    }

    rooms.forEach(room => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.innerText = room.name;

        const controls = document.createElement('div');
        controls.className = 'controls';

        const enterBtn = document.createElement('button');
        enterBtn.innerText = "Entrer";
        enterBtn.onclick = () => enterRoom(room.name);

        controls.appendChild(enterBtn);
        li.appendChild(nameSpan);
        li.appendChild(controls);
        list.appendChild(li);
    });
}

async function enterRoom(roomName) {
    currentRoom = roomName;
    document.getElementById('current-room-display').innerText = currentRoom;
    document.getElementById('chat-box').innerHTML = '';
    showView('chat-view');

    // récupérer historique des messages du backend
    try {
        const response = await fetch(`${API_URL}/rooms/${currentRoom}/messages`);
        const messages = await response.json();
        messages.forEach(msg => displayMessage(`${msg.user}: ${msg.text}`));
    } catch (e) {
        console.warn("Impossible de charger l'historique.");
    }

    // connexion au websocket
    ws = new WebSocket(`${WS_URL}/ws/${currentRoom}/${currentUser}`);

    ws.onmessage = function(event) {
        displayMessage(event.data);
    };

    ws.onerror = function() {
        displayMessage("Erreur de connexion au WebSocket. Vérifiez le serveur.", true);
    };
}

function displayMessage(text, isError = false) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    if (isError) msgDiv.style.color = "red";
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function leaveRoom() {
    if (ws) {
        ws.close();
        ws = null;
    }
    currentRoom = null;
    showView('rooms-view');
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (text && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(text);
        input.value = '';
    }
}

function logout() {
    currentUser = null;
    document.getElementById('username-input').value = '';
    showView('login-view');
}

// Ppermet envoi des messages avec entrée
document.getElementById('message-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});
document.getElementById('username-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') joinSystem();
});