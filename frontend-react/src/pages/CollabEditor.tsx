import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { editorService } from "../services/editorService";
import Editor from "@monaco-editor/react";

interface User {
  id: string;
  username: string;
  cursor?: { line: number; column: number };
}

export default function CollabEditor() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [code, setCode] = useState("// Start coding together...\n");
  const [users, setUsers] = useState<User[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [roomInfo, setRoomInfo] = useState<{
    name: string | null;
    language: string;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const editorRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    if (!roomId || !user) return;

    // Fetch room info
    editorService
      .getRoom(roomId)
      .then((room) => {
        setRoomInfo({ name: room.name, language: room.language });
        setCode(room.code || "// Start coding together...\n");
      })
      .catch(() => {
        setError("Room not found");
      });

    // Connect to WebSocket
    const ws = editorService.connectToRoom(roomId, user.username, {
      onInit: (data) => {
        setClientId(data.clientId);
        setCode(data.code);
        setUsers(data.users);
        setConnected(true);
        console.log("Connected to room:", roomId);
      },
      onCodeUpdate: (data) => {
        if (data.userId !== clientId) {
          isRemoteChange.current = true;
          setCode(data.code);
        }
      },
      onCursorUpdate: (data) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === data.userId ? { ...u, cursor: data.cursor } : u
          )
        );
      },
      onUserJoined: (data) => {
        setUsers((prev) => [...prev, data.user]);
      },
      onUserLeft: (data) => {
        setUsers((prev) => prev.filter((u) => u.id !== data.userId));
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        setConnected(false);
      },
    });

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [roomId, user, clientId]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    setCode(value);
    if (wsRef.current) {
      editorService.sendCodeChange(wsRef.current, value);
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;

    // Send cursor updates
    editor.onDidChangeCursorPosition((e: any) => {
      if (wsRef.current) {
        editorService.sendCursorMove(wsRef.current, {
          line: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId!);
    alert("Room ID copied to clipboard!");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error: {error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {roomInfo?.name || "Untitled Room"}
              </h1>
              <button
                onClick={copyRoomId}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                Room: {roomId} (click to copy)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-300">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage={roomInfo?.language || "javascript"}
            language={roomInfo?.language || "javascript"}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Users Panel */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Connected Users ({users.length})
          </h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className={`p-3 rounded-lg ${
                  u.id === clientId ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{u.username}</span>
                  {u.id === clientId && (
                    <span className="text-xs text-blue-200">(You)</span>
                  )}
                </div>
                {u.cursor && (
                  <div className="text-xs text-gray-300 mt-1">
                    Ln {u.cursor.line}, Col {u.cursor.column}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
