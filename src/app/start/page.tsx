"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useClient } from "../context/ClientContext"; // adjust path as needed

export default function StartPage() {
  const router = useRouter();
  const { setClientName } = useClient();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("client_name", name);
      const res = await axios.post("http://localhost:3001/setName", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.Result === "Success") {
        // Update global context with the new client name.
        setClientName(res.data.client_name);
        router.push("/"); // Redirect to the home page after setting the name.
      } else {
        alert("Failed to set your name. Please try again.");
      }
    } catch (error) {
      console.error("Error setting client name:", error);
      alert("An error occurred while setting your name.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Set Your Display Name</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Submit
        </button>
      </form>
    </div>
  );
}
