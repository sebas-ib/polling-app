"use client";

import { useEffect, useState } from "react";
import { useClient } from "@/app/context/ClientContext";
import { useRouter } from "next/navigation";
import apiClient from "@/app/lib/api";

type Poll = { id: string; title: string; code: string };

export default function MyPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const { clientName } = useClient();
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get("/api/my_polls", { withCredentials: true })
      .then((res) => setPolls(res.data.polls))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-6">
      <h1 className="text-3xl mb-6">Polls Created by {clientName}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : polls.length === 0 ? (
        <p>You haven’t created any polls yet.</p>
      ) : (
        <ul className="space-y-4">
          {polls.map((poll) => (
            <li key={poll.id} className="bg-neutral-800 p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{poll.title}</h2>
                  <p className="text-sm text-gray-400">Code: {poll.code}</p>
                </div>
                <button
                  onClick={() => router.push(`/poll/${poll.code}`)}
                  className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
