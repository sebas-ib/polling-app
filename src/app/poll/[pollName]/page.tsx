"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type PollOption = {
  id: string;
  text: string;
  vote_count: number;
};

type PollQuestion = {
  id: string;
  question_title: string;
  poll_options: PollOption[];
};

type ClientInfo = {
  id: string;
  name: string;
};

type PollData = {
  id: string;
  title: string;
  max_participants: number;
  owner: ClientInfo;
  participants: ClientInfo[];
  poll_questions: PollQuestion[];
};

export default function PollPage({ params }: { params: { pollName: string } }) {
  const router = useRouter();
  // Since your folder is named [pollName], we extract pollName from params.
  const { pollName } = params;
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch poll details on mount using the pollName (acting as poll id) from the URL.
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const formData = new FormData();
        formData.append("poll_id", pollName);
        const res = await axios.post("http://localhost:3001/api/join_poll", formData, {
          withCredentials: true,
        });
        setPoll(res.data);
      } catch (error) {
        console.error("Error fetching poll:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollName]);

  // Function to handle voting.
  const vote = async (optionId: string) => {
  try {
    const res = await axios.post(
      "http://localhost:3001/api/vote",
      {
        poll_id: poll?.id,
        option_id: optionId,
      },
      { withCredentials: true }
    );
    // Process the response or refresh poll data here
    console.log("Vote successful:", res.data);
  } catch (error) {
    console.error("Error voting:", error);
  }
};


  if (loading) return <div>Loading poll...</div>;
  if (!poll) return <div>Poll not found.</div>;

  // For simplicity, display the first question.
  const question = poll.poll_questions[0];

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>
      <h2 className="text-2xl mb-4">{question.question_title}</h2>
      <div className="space-y-4">
        {question.poll_options.map((option) => (
          <div key={option.id} className="flex items-center justify-between border p-2 rounded">
            <div>
              <span className="font-medium">{option.text}</span>
              <span className="ml-2 text-sm text-gray-600">({option.vote_count} votes)</span>
            </div>
            <button
              onClick={() => vote(option.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded ml-4"
            >
              Vote
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push("/")}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Back to Home
      </button>
    </div>
  );
}
