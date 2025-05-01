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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-800 text-center">
        <h1 className="text-4xl tracking-wide text-blue-400 mb-4 uppercase"style={{ fontFamily: "var(--font-bebas)" }}>Join a Poll</h1>
        <p className="text-neutral-400 mb-6 font-medium">Enter your 4-digit poll code</p>
        <div className="flex flex-col items-center gap-4 w-full">
          <input
            type="text"
            maxLength={4}
            placeholder="e.g. 1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-lg p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleJoin}
            className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 rounded text-white w-full font-semibold"
          >
            Join Poll
          </button>

          <button
            onClick={() => router.push("/menu")}
            className="text-neutral-400 hover:underline text-sm mt-2"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </main>
  );
}
