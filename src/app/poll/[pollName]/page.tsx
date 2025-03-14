// src/app/poll/[pollName]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

type ChatMessage = {
  client_name: string;
  message: string;
};

export default function PollPage({ params }: { params: { pollName: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The poll name comes from the folder name: [pollName]
  const { pollName } = params;
  // The user name is passed in the query string
  const userName = searchParams.get("name") || "Anonymous";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Listen for incoming messages
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", { message, room: pollName });
      setMessage("");
    }
  };

  const handleLeave = () => {
    // Optionally call an HTTP /leave endpoint or just navigate away
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Room: {pollName}</h1>
      <div className="border p-4 w-full max-w-md h-64 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.client_name}</strong>: {msg.message}
          </p>
        ))}
      </div>
      <div className="flex w-full max-w-md mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="border p-2 flex-1"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white p-2">
          Send
        </button>
      </div>
      <button onClick={handleLeave} className="bg-red-500 text-white p-2">
        Leave Room
      </button>
    </div>
  );
}
