const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000";

let currentUser = null;
let currentRoom = null;
let ws = null;
let userSubscriptions = [];

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
        // récupérer tous les salons
        const responseRooms = await fetch(`${API_URL}/rooms`);
        const rooms = await responseRooms.json();
        // récupérer les abonnements de l'utilisateur
        const responseSubs = await fetch(`${API_URL}/users/${currentUser}/subscriptions`);
        userSubscriptions = await responseSubs.json();
        
        renderRooms(rooms);
    } catch (error) {
        list.innerHTML = `<li style="color:red">Erreur : Impossible de charger les salons.</li>`;
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
        const isSubscribed = userSubscriptions.includes(room.name);
        const nameSpan = document.createElement('span');
        nameSpan.innerHTML = isSubscribed ? `<strong>★ ${room.name}</strong>` : room.name;

        const controls = document.createElement('div');
        controls.className = 'controls';

        const subBtn = document.createElement('button');
        subBtn.innerText = isSubscribed ? "Se désabonner" : "S'abonner";
        if (isSubscribed) subBtn.style.backgroundColor = "#ffcccc"; // Rouge clair si déjà abonné
        
        subBtn.onclick = () => toggleSubscription(room.name);

        const enterBtn = document.createElement('button');
        enterBtn.innerText = "Entrer";
        enterBtn.onclick = () => enterRoom(room.name);

        controls.appendChild(subBtn);
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

async function toggleSubscription(roomName) {
    try {
        await fetch(`${API_URL}/users/${currentUser}/subscribe/${roomName}`, {
            method: 'POST'
        });
        // On recharge la liste pour mettre à jour les boutons et l'étoile
        fetchRooms();
    } catch (error) {
        console.error("Erreur lors de l'abonnement");
    }
}