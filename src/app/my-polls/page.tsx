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
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111315] to-[#1c1c1c] text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
          Your Polls, {clientName || "Guest"}
        </h1>

        {loading ? (
          <p className="text-center text-neutral-400">Loading...</p>
        ) : polls.length === 0 ? (
          <p className="text-center text-neutral-400">You haven’t created any polls yet.</p>
        ) : (
          <ul className="space-y-5">
            {polls.map((poll) => (
              <li
                key={poll.id}
                className="bg-[#16181c] border border-neutral-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{poll.title}</h2>
                    <p className="text-sm text-neutral-400 mt-1">Poll Code: <span className="font-mono">{poll.code}</span></p>
                  </div>
                  <button
                    onClick={() => router.push(`/poll/${poll.code}`)}
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl text-white transition"
                  >
                    View Poll
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
