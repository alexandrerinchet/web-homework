from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Le "*" signifie "j'accepte les requêtes de n'importe où, même d'un origin 'null'"
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    # argument check_same_thread=False indispensable avec FastAPI
    conn = sqlite3.connect("chat.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.on_event("startup")
def startup():
    conn = get_db()
    try:
        conn.execute("CREATE TABLE IF NOT EXISTS users (name TEXT UNIQUE)")
        conn.execute("CREATE TABLE IF NOT EXISTS rooms (name TEXT UNIQUE)")
        conn.execute("CREATE TABLE IF NOT EXISTS messages (room_name TEXT, user_name TEXT, text TEXT)")
        conn.commit()
    finally:
        conn.close() # fermeture pour éviter pb de database locked

@app.post("/users")
def create_user(name: str):
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (name) VALUES (?)", (name,))
        conn.commit()
    except sqlite3.IntegrityError:
        pass 
    finally:
        conn.close()
    return {"status": "ok", "name": name}

@app.post("/rooms/{name}")
def create_room(name: str):
    conn = get_db()
    try:
        conn.execute("INSERT INTO rooms (name) VALUES (?)", (name,))
        conn.commit()
    except sqlite3.IntegrityError:
        pass 
    finally:
        conn.close()
    return {"status": "ok", "name": name}

@app.get("/rooms")
def get_rooms():
    conn = get_db()
    try:
        rooms = conn.execute("SELECT name FROM rooms").fetchall()
        return [{"name": r["name"]} for r in rooms]
    finally:
        conn.close()

@app.get("/rooms/{room_name}/messages")
def get_messages(room_name: str):
    conn = get_db()
    try:
        msgs = conn.execute("SELECT user_name, text FROM messages WHERE room_name = ?", (room_name,)).fetchall()
        return [{"user": m["user_name"], "text": m["text"]} for m in msgs]
    finally:
        conn.close()

active_connections = {}

@app.websocket("/ws/{room_name}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str, user_name: str):
    await websocket.accept()
    
    if room_name not in active_connections:
        active_connections[room_name] = []
    active_connections[room_name].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            
            conn = get_db()
            try:
                conn.execute("INSERT INTO messages (room_name, user_name, text) VALUES (?, ?, ?)", (room_name, user_name, data))
                conn.commit()
            finally:
                conn.close()
            
            for connection in active_connections[room_name]:
                await connection.send_text(f"{user_name}: {data}")
                
    except WebSocketDisconnect:
        active_connections[room_name].remove(websocket)
        for connection in active_connections[room_name]:
            await connection.send_text(f"Système: {user_name} a quitté le salon")