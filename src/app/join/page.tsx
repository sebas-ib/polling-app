"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPollPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    const trimmedCode = code.trim();

    // Check for valid 4-digit (or 4-char) code
    if (trimmedCode.length != 4) {
      alert("Please enter a valid poll code.");
      return;
    }

    // Redirect to the poll page
    router.push(`/poll/${trimmedCode}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center">
        <h1 className="flex flex-col items-center text-2xl font-bold mb-4">Join a Poll</h1>
        <p className="flex flex-col items-center text-gray-600 mb-4">Enter your 4-digit poll code</p>
        <div className="flex flex-col items-center gap-4 w-full">
          <input
            type="text"
            maxLength={10}
            placeholder="e.g. 1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-gray-300 rounded w-full p-2 text-center text-lg"
          />

          <button
            onClick={handleJoin}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition"
          >
            Join Poll
          </button>

          <button
            onClick={() => router.push("/menu")}
            className="text-gray-500 hover:underline text-sm"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </main>
  );
}
