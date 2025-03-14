"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useClient } from "./context/ClientContext"; // Adjust the path as needed

type Poll = {
  id: string;
  name: string;
};

export default function HomePage() {
  const router = useRouter();
  const { clientName, clientId } = useClient();
  const [polls, setPolls] = useState<Poll[]>([]);


  // Fetch active polls on component mount
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/polls", { withCredentials: true })
      .then((res) => {
        // Assuming the backend returns { polls: [...] }
        setPolls(res.data.polls);
      })
      .catch((err) => {
        console.error("Error fetching polls:", err);
      });
  }, []);



  // Function to join (or create) a poll via the /join endpoint
  const joinPoll = async (pollId: string) => {
    try {
      const formData = new FormData();
      // Replace "default-client-id" with your secure client id if available (e.g. from cookie)
      formData.append("client_name", clientName);
      formData.append("poll_id", pollId);

      await axios.post("http://localhost:3001/join", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }).then(res => {
      router.push(`/poll/${res.data.pollName}`);
      })
      ;
      // Navigate to the poll page
    } catch (error) {
      console.error("Error joining poll:", error);
    }
  };

  // Handler for the "Create Poll" button
  const handleCreatePoll = () => {
    // Redirect to the Next.js route /create (which should show a poll creation form)
    router.push("/create");
  };

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Home Page</h1>
      {clientName && <p className="mb-4">Hello, {clientName}!</p>}

      {/* Create Poll Button */}
      <div className="mb-6">
        <button
          onClick={handleCreatePoll}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Poll
        </button>
      </div>

      {/* Active Polls List */}
<div className="border p-4 rounded">
  <h2 className="text-xl mb-2">Active Polls</h2>
  {polls.length === 0 ? (
    <p>No active polls.</p>
  ) : (
    <ul className="list-disc pl-5">
      {polls.map((poll) => (
        <li key={poll.id} className="flex items-center mb-2">
          <span className="mr-2">{poll.name}</span>
          <button
            onClick={() => router.push(`/poll/${poll.id}`)}
            className="underline text-blue-500"
          >
            Join Poll
          </button>
        </li>
      ))}
    </ul>
  )}
</div>


    </div>
  );
}
