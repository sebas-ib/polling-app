"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { useClient } from "@/app/context/ClientContext";

// ---------- Types ----------
type PollOption = {
  id: string;
  text: string;
  vote_count: number;
};

type PollQuestion = {
  id: string;
  question_title: string;
  poll_options: { [optionKey: string]: PollOption };
};

type PollData = {
  id: string;
  title: string;
  poll_questions: { [questionId: string]: PollQuestion };
  participants: { [clientId: string]: boolean };
  owner_id: string;
};

export default function PollPage() {
  const params = useParams();
  const pollId = params.pollName as string;

  const router = useRouter();
  const { socket } = useClient();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [hasVotedMap, setHasVotedMap] = useState<{ [questionId: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const formData = new FormData();
        formData.append("poll_id", pollId);
        const res = await axios.post("http://localhost:3001/api/join_poll", formData, {
          withCredentials: true,
        });

        setPoll(res.data.poll);

        const savedVotes = res.data.saved_votes || {};
        setHasVotedMap(savedVotes); // { question_id: option_id }
      } catch (error) {
        console.error("Error fetching poll:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  useEffect(() => {
    if (!socket || !poll) return;

    const handleVoteEvent = (data: any) => {
      console.log("Vote event received:", data);

      setPoll((prevPoll) => {
        if (!prevPoll) return prevPoll;
        const question = prevPoll.poll_questions[data.question_id];
        if (!question) return prevPoll;

        const previousOptionId = hasVotedMap[data.question_id];
        const updatedOptions = { ...question.poll_options };

        // Increment new option
        const newOption = updatedOptions[data.option_id];
        if (newOption) {
          updatedOptions[data.option_id] = {
            ...newOption,
            vote_count: data.new_vote_count, // trust backend
          };
        }

        // Decrement previous option if it exists and it's different
        if (previousOptionId && previousOptionId !== data.option_id) {
          const previousOption = updatedOptions[previousOptionId];
          if (previousOption) {
            updatedOptions[previousOptionId] = {
              ...previousOption,
              vote_count: Math.max(previousOption.vote_count - 1, 0),
            };
          }
        }

        return {
          ...prevPoll,
          poll_questions: {
            ...prevPoll.poll_questions,
            [data.question_id]: {
              ...question,
              poll_options: updatedOptions,
            },
          },
        };
      });

      // Update voted map locally too
      setHasVotedMap((prev) => ({
        ...prev,
        [data.question_id]: data.option_id,
      }));
    };

    socket.on("vote_event", handleVoteEvent);
    return () => {
      socket.off("vote_event", handleVoteEvent);
    };
  }, [socket, poll, hasVotedMap]);

  const vote = async (questionId: string, optionKey: string) => {
    try {
      const votePayload = [
        {
          poll_id: poll?.id,
          question_id: questionId,
          option_id: optionKey,
        },
      ];

      await axios.post("http://localhost:3001/api/vote_option", votePayload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  if (loading) return <div className="p-4">Loading poll...</div>;
  if (!poll) return <div className="p-4">Poll not found.</div>;

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>

      {Object.entries(poll.poll_questions).map(([questionId, question]) => (
        <div key={questionId} className="mb-6 border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">{question.question_title}</h2>

          {Object.entries(question.poll_options).map(([optionKey, option]) => (
            <div key={optionKey} className="flex items-center justify-between border p-2 rounded mb-2">
              <div>
                <span className="font-medium">{option.text}</span>
                <span className="ml-2 text-sm text-gray-600">({option.vote_count} votes)</span>
              </div>
              <button
                onClick={() => vote(questionId, optionKey)}
                disabled={hasVotedMap[questionId] === optionKey}
                className={`px-4 py-2 rounded ${
                  hasVotedMap[questionId] === optionKey
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {hasVotedMap[questionId] === optionKey ? "Voted" : "Vote"}
              </button>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() => router.push("/")}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Back to Home
      </button>
    </div>
  );
}
