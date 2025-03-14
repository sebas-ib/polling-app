"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CreatePollPage() {
  const router = useRouter();
  const [pollName, setPollName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pollName.trim()) {
      setError("Poll name is required.");
      return;
    }
    if (maxParticipants <= 0) {
      setError("Max participants must be greater than zero.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("poll_name", pollName);
      formData.append("max_participants", maxParticipants.toString());

      const res = await axios.post("http://localhost:3001/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.status === 201) {
        // Assuming your backend returns the new poll's id in res.data.id
        router.push(`/poll/${res.data.id}`);
      }
    } catch (err) {
      setError("Error creating poll. Please try again.");
      console.error("Error creating poll:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Create a New Poll</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Poll Name"
          value={pollName}
          onChange={(e) => setPollName(e.target.value)}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Max Participants"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
          className="border p-2"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Create Poll
        </button>
      </form>
    </div>
  );
}
