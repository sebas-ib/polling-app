"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "./context/ClientContext";
import apiClient from "@/app/lib/api";

type Poll = { id: string; title: string; code: string };

export default function HomePage() {
  const router = useRouter();
  const { clientName, setShowPopup, socket } = useClient();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = () => {
    apiClient
      .get("/api/polls")
      .then(res => setPolls(res.data.polls))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchPolls, []);
  useEffect(() => {
    if (socket) socket.on("refreshPolls", fetchPolls);
    return () => { if (socket) socket.off("refreshPolls", fetchPolls); };
  }, [socket]);

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Join a Poll</h1>
      <p className="mb-4">Hello, {clientName || "Guest"}!</p>

      <button
        onClick={() => setShowPopup(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Change Name
      </button>

      <div className="mt-6">
        <h2 className="text-xl mb-2">Active Polls</h2>
        {polls.length === 0 ? (
          <p>No active polls.</p>
        ) : (
          <ul className="list-disc pl-5">
            {polls.map(p => (
              <li key={p.id} className="flex items-center mb-2">
                <span className="mr-4 font-semibold">{p.title}</span>
                <span className="mr-4 text-gray-500">Code: {p.code}</span>
                <button
                  onClick={() => router.push(`/poll/${p.code}`)}
                  className="underline text-blue-500"
                >
                  Join Poll
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => router.push("/create")}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Create New Poll
      </button>
    </main>
  );
}
