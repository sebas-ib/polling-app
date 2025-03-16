"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useClient } from "@/app/context/ClientContext";

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

export default function PollPage({ params }: { params: { pollName: string } }) {
  const router = useRouter();
  // Using pollName from the dynamic route folder [pollName]
  const { pollName } = params;
  const { socket } = useClient();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  // Effect: Fetch poll details from the backend using pollName as the poll's id.
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

  useEffect(() => {
    if (socket) {
      const handleVoteEvent = (data: any) => {
        console.log("Vote event received:", data);
        setPoll((prevPoll) => {
          if (!prevPoll) return prevPoll;
          // vote event is targeted to first question for now
          const questionKeys = Object.keys(prevPoll.poll_questions);
          if (questionKeys.length === 0) return prevPoll;
          const qKey = questionKeys[0];
          const question = prevPoll.poll_questions[qKey];
          if (!(data.option_id in question.poll_options)) {
            console.warn("Option not found for vote event", data.option_id);
            return prevPoll;
          }
          // use ... for collection initialization
          const updatedOption = {
            ...question.poll_options[data.option_id],
            vote_count: question.poll_options[data.option_id].vote_count + 1,
          };
          const updatedOptions = {
            ...question.poll_options,
            [data.option_id]: updatedOption
          };
          const updatedQuestion = {
            ...question,
            poll_options: updatedOptions
          };
          const updatedPollQuestions = {
            ...prevPoll.poll_questions,
            [qKey]: updatedQuestion
          };
          return {
            ...prevPoll,
            poll_questions: updatedPollQuestions
          };
        });
      };

      socket.on("vote_event", handleVoteEvent);
      return () => {
        socket.off("vote_event", handleVoteEvent);
      };
    }
  }, [socket]);

  const vote = async (optionId: string) => {
    if (hasVoted) return;
    try {
      const res = await axios.post(
        "http://localhost:3001/api/vote_option",
        {
          poll_id: poll?.id,
          question_id: Object.values(poll?.poll_questions || {})[0].id,
          option_id: optionId,
        },
        { withCredentials: true }
      );
      console.log("Vote successful:", res.data);
      // Disable further voting for this question.
      setHasVoted(true);
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  if (loading) return <div>Loading poll...</div>;
  if (!poll) return <div>Poll not found.</div>;

  // Convert poll_questions dictionary to an array.
  const pollQuestionsArray = Object.values(poll.poll_questions || {});
  if (pollQuestionsArray.length === 0) {
    return <div>No questions available in this poll.</div>;
  }

  // only one question available right now, will add more
  const question = pollQuestionsArray[0];
  const pollOptionsArray = Object.values(question.poll_options || {});

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
              className={`bg-blue-500 text-white px-4 py-2 rounded ml-4 ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
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