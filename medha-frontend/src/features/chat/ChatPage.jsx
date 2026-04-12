import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext";
import { chatAPI } from "../../services/api";
import { MessageSquare, Send, ArrowLeft, User } from "lucide-react";

function ChatRoomList({ rooms, selectedRoom, onSelect }) {
  return (
    <div className="border-r border-slate-200 w-80 flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare size={20} /> Messages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 && (
          <p className="text-sm text-slate-400 p-4">No conversations yet.</p>
        )}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
              selectedRoom?.id === room.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {room.doctor_name} / {room.patient_name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {room.last_message?.content || "No messages yet"}
                </p>
              </div>
              {room.unread_count > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {room.unread_count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessages({ room, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!room) return;

    // Load message history
    chatAPI.getMessages(room.id).then((res) => {
      setMessages(res.data);
    });

    // Connect WebSocket - use 127.0.0.1 in Electron (file:// has no hostname)
    const wsHost = window.electronAPI?.isElectron ? '127.0.0.1' : window.location.hostname;
    const wsUrl = `ws://${wsHost}:8000/ws/chat/${room.id}/`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };
    ws.onclose = () => {};
    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [room?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        content,
        user_id: user.id,
        sender_type: user.role === "doctor" ? "doctor" : "patient",
      }));
    } else {
      // Fallback to REST
      try {
        const res = await chatAPI.sendMessage(room.id, content);
        setMessages((prev) => [...prev, res.data]);
      } catch {}
    }
    setSending(false);
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={18} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-slate-900">
            {user.role === "doctor" ? room.patient_name : room.doctor_name}
          </p>
          <p className="text-xs text-slate-400">{room.patient_id_code}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => {
          const isOwn =
            (user.role === "doctor" && msg.sender_type === "doctor") ||
            (user.role === "patient" && msg.sender_type === "patient");
          return (
            <div key={msg.id || i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  isOwn
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-slate-400"}`}>
                  {msg.sender_name || msg.sender_type} &middot;{" "}
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-slate-200 p-4 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    chatAPI.listRooms().then((res) => setRooms(res.data)).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <ChatRoomList rooms={rooms} selectedRoom={selectedRoom} onSelect={setSelectedRoom} />
      <ChatMessages room={selectedRoom} user={user} />
    </div>
  );
}
