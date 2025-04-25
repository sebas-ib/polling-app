"use client";

import { SetStateAction, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useClient} from "./context/ClientContext";
import apiClient from '@/app/lib/api'

type Poll = {
    id: string;
    title: string;
};

export default function HomePage() {
    const router = useRouter();
    const {clientName, setShowPopup, socket} = useClient();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch polls
    const fetchPolls = () => {
        apiClient
            .get("/api/polls", {withCredentials: true})
            .then((res: { data: { polls: SetStateAction<Poll[]>; }; }) => {
        setPolls(res.data.polls);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Error fetching polls:", err);
        setLoading(false);
      });
  };

  // Listen for the refresh event from the socket.
  useEffect(() => {
    if (socket) {
      socket.on("refreshPolls", () => {
        console.log("Refresh polls event received from socket");
        fetchPolls();
      });
    }
    return () => {
      if (socket) {
        socket.off("refreshPolls");
      }
    };
  }, [socket]);


  // Initial fetch on component mount.
  useEffect(() => {
    fetchPolls();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Join a Poll</h1>
      <p className="mb-4">Hello, {clientName || "Guest"}!</p>
      <button
        onClick={() => setShowPopup(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Change Name
      </button>

      <div className="mt-6">
        <h2 className="text-xl mb-2">Active Polls</h2>
        {polls.length === 0 ? (
          <p>No active polls available.</p>
        ) : (
          <ul className="list-disc pl-5">
            {polls.map((poll) => (
              <li key={poll.id} className="flex items-center mb-2">
                <span className="mr-2">{poll.title}</span>
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

      <button
        onClick={() => router.push("/create")}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Create New Poll
      </button>
    </main>
  );
}
