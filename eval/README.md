# Application de Messagerie

L'application permet aux utilisateurs de rejoindre le système avec un nom d'utilisateur qu'ils choisissent, de consulter une liste de salons de discussion, d'en rejoindre et de s'y abonner éventuellement, et d'échanger des messages au sein de ces salons.

## Technologies Utilisées

Les technologies suivantes sont utilisées :
*   **Backend :** FastAPI (pour l'API REST et les WebSockets).
*   **Base de données :** SQLite (pour stocker les utilisateurs, les salons et l'historique des messages).
*   **Frontend :** HTML, CSS et JavaScript

## Structure du Projet

*   `main.py` : le code du serveur FastAPI (routes HTTP, gestion WebSockets et base de données SQLite).
*   `index.html` : l'interface utilisateur.
*   `style.css` : le CSS.
*   `app.js` : la logique frontend (appels API et connexion WebSocket).
*   `chat.db` : le fichier de base de données SQLite (généré automatiquement au premier lancement).

## Prérequis


```bash

pip install fastapi uvicorn httpie

```

## Fonctionnement

on s'assure que tous les fichiers sont rangés dans le même dossier

''' dans un terminal bash '''

fastapi dev main.py


''' dans un autre terminal'''


http POST http://localhost:8000/rooms/social
http POST http://localhost:8000/rooms/sports
http POST http://localhost:8000/rooms/bde

...

on double clique sur le fichier index.html pour ouvrir la messagerie du côté de l'utilisateur