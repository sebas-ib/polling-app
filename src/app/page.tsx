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
      .post(
        "/api/join_poll",
        { poll_code: trimmed },
        { withCredentials: true }
      )
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-white px-4">
      <div className="w-full max-w-2xl bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-800">
        <h1
          className="text-4xl md:text-5xl mb-4 text-center tracking-wide text-blue-400"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Join a Poll
        </h1>
        <p className="mb-6 text-center text-neutral-400">
          Welcome,{" "}
          <span className="text-white font-semibold">
            {clientName || "Guest"}
          </span>
          !
        </p>

        <button
          onClick={() => setShowPopup(true)}
          className="mb-6 block mx-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Change Display Name
        </button>

        <h2 className="text-xl mb-4 text-center text-white">Enter Poll Code</h2>

        <div className="flex flex-col items-center gap-4">
          <input
            type="text"
            maxLength={6}
            value={pollCode}
            onChange={(e) => setPollCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit poll code (e.g. A1B2C3)"
            className="w-full max-w-sm px-5 py-3 text-lg text-white bg-neutral-800 border border-gray-500 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />

          <button
            onClick={handleJoinPoll}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Join Poll
          </button>
          {joinError && (
            <p className="text-red-500 text-sm text-center">{joinError}</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/create")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Create New Poll
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/my-polls")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            View My Polls
          </button>
        </div>
      </div>
    </main>
  );
}
