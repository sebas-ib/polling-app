"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";
import apiClient from "@/app/lib/api";

export default function HomePage() {
  const router = useRouter();
  const { clientName, setShowPopup } = useClient();

  const [pollCode, setPollCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoinPoll = () => {
    setJoinError("");
    const trimmed = pollCode.trim().toUpperCase();

    if (trimmed.length !== 6) {
      setJoinError("Please enter a valid 6-character poll code.");
      return;
    }

    apiClient
      .post("/api/join_poll", { poll_code: trimmed }, { withCredentials: true })
      .then((res) => {
        const code = res.data.poll.code || trimmed;
        router.push(`/poll/${code}`);
      })
      .catch((err) => {
        console.error(err);
        setJoinError("Poll not found or failed to join.");
      });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111315] to-[#1c1c1c] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[#16181c] border border-neutral-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-2">
          Join a Poll
        </h1>
        <p className="text-center text-neutral-400 text-lg mb-6">
          Welcome,&nbsp;
          <span className="text-white font-medium">
            {clientName || "Guest"}
          </span>
          .
        </p>

        <button
          onClick={() => setShowPopup(true)}
          className="w-full mb-6 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white transition"
        >
          Change Display Name
        </button>

        <h2 className="text-lg text-white text-center mb-3">Enter Poll Code</h2>

        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            maxLength={6}
            value={pollCode}
            onChange={(e) => setPollCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3"
            className="w-full max-w-sm px-5 py-3 text-lg bg-[#222529] text-white border border-neutral-600 rounded-xl placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button
            onClick={handleJoinPoll}
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition"
          >
            Join Poll
          </button>
          {joinError && (
            <p className="text-red-500 text-sm text-center">{joinError}</p>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={() => router.push("/create")}
            className="w-full max-w-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl transition"
          >
            Create New Poll
          </button>

          <button
            onClick={() => router.push("/my-polls")}
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition"
          >
            View My Polls
          </button>
        </div>
      </div>
    </main>
  );
}
