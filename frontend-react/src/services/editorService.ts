const EDITOR_WS_URL = import.meta.env.VITE_EDITOR_WS_URL || 'ws://localhost:4000'
const EDITOR_API_URL = import.meta.env.VITE_EDITOR_API_URL || 'http://localhost:4000'

export interface Room {
  roomId: string
  name: string | null
  code: string
  language: string
  createdAt: string
  updatedAt: string
  connectedUsers: Array<{
    id: string
    username: string
    cursor?: { line: number; column: number }
  }>
}

export const editorService = {
  // HTTP API
  createRoom: async (name?: string, language?: string): Promise<{ roomId: string }> => {
    const response = await fetch(`${EDITOR_API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, language }),
    })
    return response.json()
  },

  getRoom: async (roomId: string): Promise<Room> => {
    const response = await fetch(`${EDITOR_API_URL}/rooms/${roomId}`)
    return response.json()
  },

  // WebSocket connection
  connectToRoom: (
    roomId: string,
    username: string,
    callbacks: {
      onInit: (data: { clientId: string; code: string; users: any[] }) => void
      onCodeUpdate: (data: { code: string; userId: string }) => void
      onCursorUpdate: (data: { userId: string; username: string; cursor: any }) => void
      onUserJoined: (data: { user: { id: string; username: string } }) => void
      onUserLeft: (data: { userId: string; username: string }) => void
      onError: (error: string) => void
    }
  ): WebSocket => {
    const ws = new WebSocket(EDITOR_WS_URL)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        username,
      }))
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'init':
          callbacks.onInit(message)
          break
        case 'code-update':
          callbacks.onCodeUpdate(message)
          break
        case 'cursor-update':
          callbacks.onCursorUpdate(message)
          break
        case 'user-joined':
          callbacks.onUserJoined(message)
          break
        case 'user-left':
          callbacks.onUserLeft(message)
          break
        case 'error':
          callbacks.onError(message.message)
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      callbacks.onError('WebSocket connection error')
    }

    return ws
  },

  sendCodeChange: (ws: WebSocket, code: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'code-change',
        code,
      }))
    }
  },

  sendCursorMove: (ws: WebSocket, cursor: { line: number; column: number }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cursor-move',
        cursor,
      }))
    }
  },
}
