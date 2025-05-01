"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";
import axios from "axios";

export default function EnterPage() {
  const { setClientName } = useClient();
  const router = useRouter();
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append("client_name", name);

    try {
      const res = await axios.post("http://localhost:3001/api/set_name", formData, {
        withCredentials: true,
      });

      //store the name in context and navigate to /menu
      if (res.data.Result === "Success") {
        setClientName(name);     // update name globally
        router.push("/menu");
      } else {
        alert("Failed to set name. Please try again.");
      }
    } catch (err) {
      console.error("Error setting name:", err);
      alert("Could not connect to server.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-800">
        <h1 className="text-4xl text-center tracking-wide text-blue-400 mb-6" style={{ fontFamily: "var(--font-bebas)" }}>
          Welcome to Real-Time Polling</h1>
        <p className="text-center text-sm text-neutral-400 mb-4">Enter your name to begin</p>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Submit button to trigger name registration */}
          <button
            onClick={handleSubmit}
            className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 rounded text-white"
          >
            Enter
          </button>
        </div>
      </div>
    </main>

  );
}