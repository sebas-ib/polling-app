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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Real-Time Polling App</h1>
        <p className="flex flex-col items-center text-gray-600 mb-4">Enter your name to begin</p>
        <div className="flex flex-col items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="border w-full p-2 mb-4"
          />

          {/* Submit button to trigger name registration */}
          <button
            onClick={handleSubmit}
            className="block w-full bg-blue-500 text-white px-4 py-2 rounded"
          >
            Enter
          </button>
        </div>
      </div>
    </main>

  );
}