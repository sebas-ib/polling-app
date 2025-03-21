"use client"; // required for client-side hooks like useState, useEffect, useParams

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation"; // useParams replaces `params` from props
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
  poll_options: { [key: string]: PollOption };
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
  participants: { [key: string]: ClientInfo };
  poll_questions: { [key: string]: PollQuestion };
};

export default function PollPage() {
  // replaces props.params: useParams is apparently the correct way to access route params in a client component
  const params = useParams();
  const pollName = params.pollName as string;

  const router = useRouter();
  const { socket } = useClient();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  // fetch poll details when component mounts
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

  // handles incoming real-time vote updates
  useEffect(() => {
    if (socket) {
      const handleVoteEvent = (data: any) => {
        console.log("Vote event received:", data);
        setPoll((prevPoll) => {
          if (!prevPoll) return prevPoll;
          const questionKeys = Object.keys(prevPoll.poll_questions);
          if (questionKeys.length === 0) return prevPoll;

          const qKey = questionKeys[0];
          const question = prevPoll.poll_questions[qKey];

          if (!(data.option_id in question.poll_options)) {
            console.warn("Option not found for vote event", data.option_id);
            return prevPoll;
          }

          const updatedOption = {
            ...question.poll_options[data.option_id],
            vote_count: question.poll_options[data.option_id].vote_count + 1,
          };

          const updatedOptions = {
            ...question.poll_options,
            [data.option_id]: updatedOption,
          };

          const updatedQuestion = {
            ...question,
            poll_options: updatedOptions,
          };

          const updatedPollQuestions = {
            ...prevPoll.poll_questions,
            [qKey]: updatedQuestion,
          };

          return {
            ...prevPoll,
            poll_questions: updatedPollQuestions,
          };
        });
      };

      socket.on("vote_event", handleVoteEvent);
      return () => {
        socket.off("vote_event", handleVoteEvent);
      };
    }
  }, [socket]);

  // cast a vote
  const vote = async (optionId: string) => {
    if (hasVoted || !poll) return;
    try {
      const res = await axios.post(
        "http://localhost:3001/api/vote_option",
        {
          poll_id: poll.id,
          question_id: Object.values(poll.poll_questions)[0].id,
          option_id: optionId,
        },
        { withCredentials: true }
      );
      console.log("Vote successful:", res.data);
      setHasVoted(true); // prevent double voting
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  if (loading) return <div>Loading poll...</div>;
  if (!poll) return <div>Poll not found.</div>;

  const pollQuestionsArray = Object.values(poll.poll_questions);
  if (pollQuestionsArray.length === 0) {
    return <div>No questions available in this poll.</div>;
  }

  const question = pollQuestionsArray[0];
  const pollOptionsArray = Object.values(question.poll_options);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>
      <h2 className="text-2xl mb-4">{question.question_title}</h2>

      <div className="space-y-4">
        {pollOptionsArray.map((option) => (
          <div key={option.id} className="flex items-center justify-between border p-2 rounded">
            <div>
              <span className="font-medium">{option.text}</span>
              <span className="ml-2 text-sm text-gray-600">({option.vote_count} votes)</span>
            </div>
            <button
              onClick={() => vote(option.id)}
              disabled={hasVoted}
              className={`bg-blue-500 text-white px-4 py-2 rounded ml-4 ${
                hasVoted ? "opacity-50 cursor-not-allowed" : ""
              }`}
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
