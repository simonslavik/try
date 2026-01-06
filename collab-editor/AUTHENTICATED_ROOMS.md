# Using Authenticated Room Creation

## Overview

Now that authentication is integrated, you can create rooms as a logged-in user and retrieve your created rooms later.

## Workflow

### 1. Login to get access token

```bash
# Login to user-service
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

### 2. Create a room (authenticated)

```bash
# Create a new room using the access token
curl -X POST http://localhost:4000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "My JavaScript Project",
    "language": "javascript"
  }'
```

Response:

```json
{
  "roomId": "room-uuid-here",
  "message": "Room created successfully"
}
```

### 3. Get all your rooms

```bash
# Retrieve all rooms you created
curl -X GET http://localhost:4000/my-rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response:

```json
{
  "rooms": [
    {
      "id": "room-uuid-1",
      "name": "My JavaScript Project",
      "language": "javascript",
      "code": "console.log('Hello');",
      "creatorId": "your-user-uuid",
      "createdAt": "2026-01-06T10:00:00.000Z",
      "updatedAt": "2026-01-06T10:30:00.000Z",
      "lastActiveAt": "2026-01-06T10:30:00.000Z",
      "activeUsers": 0
    },
    {
      "id": "room-uuid-2",
      "name": "Python Data Analysis",
      "language": "python",
      "code": "print('Data processing')",
      "creatorId": "your-user-uuid",
      "createdAt": "2026-01-05T14:00:00.000Z",
      "updatedAt": "2026-01-05T16:00:00.000Z",
      "lastActiveAt": "2026-01-05T16:00:00.000Z",
      "activeUsers": 2
    }
  ]
}
```

### 4. Join your room via WebSocket

```javascript
const ws = new WebSocket("ws://localhost:4000");

ws.onopen = () => {
  // Join the room you created
  ws.send(
    JSON.stringify({
      type: "join",
      roomId: "room-uuid-here",
      username: "Your Name",
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Received:", message);
};
```

## Frontend Integration

### React Example

```javascript
import { useState, useEffect } from "react";

function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    async function fetchMyRooms() {
      const response = await fetch("http://localhost:4000/my-rooms", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setRooms(data.rooms);
    }

    fetchMyRooms();
  }, [accessToken]);

  return (
    <div>
      <h2>My Rooms</h2>
      {rooms.map((room) => (
        <div key={room.id}>
          <h3>{room.name || "Unnamed Room"}</h3>
          <p>Language: {room.language}</p>
          <p>Active Users: {room.activeUsers}</p>
          <p>Last Active: {new Date(room.lastActiveAt).toLocaleString()}</p>
          <button onClick={() => joinRoom(room.id)}>Join Room</button>
        </div>
      ))}
    </div>
  );
}
```

### Creating a Room from Frontend

```javascript
async function createRoom(name, language) {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch("http://localhost:4000/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, language }),
  });

  const data = await response.json();
  console.log("Room created:", data.roomId);

  // Navigate to the room or join via WebSocket
  return data.roomId;
}
```

## Benefits

- **Room Ownership**: You own the rooms you create
- **Easy Access**: Quickly find and return to your rooms
- **Persistence**: Rooms and code are saved in the database
- **Multi-device**: Access your rooms from any device with your account
- **Activity Tracking**: See when rooms were last active and who's currently connected
