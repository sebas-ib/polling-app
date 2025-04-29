"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/app/lib/api";
import { useClient } from "@/app/context/ClientContext";

type PollOption = { id: string; text: string; vote_count: number };
type PollQuestion = {
  id: string;
  question_title: string;
  poll_options: PollOption[];
};
type PollData = {
  id: string;
  title: string;
  poll_questions: PollQuestion[];
  participants: string[];
  owner_id: string;
};

export default function PollPage() {
  const router = useRouter();
  const { pollName: pollCode } = useParams() as { pollName: string };
  const { socket } = useClient();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 1) Load poll from REST and saved votes
  useEffect(() => {
    apiClient
      .post("/api/join_poll", { poll_code: pollCode })
      .then((res) => {
        setPoll(res.data.poll);
        setHasVotedMap(res.data.saved_votes || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pollCode]);

  // 2) Once we have both socket & poll.id, join the socket room
  useEffect(() => {
    if (!socket || !poll) return;
    socket.emit("join_poll", poll.id);
  }, [socket, poll]);

  // 3) Listen for real-time vote events
  useEffect(() => {
    if (!socket) return;
    const handler = (data: {
      question_id: string;
      option_id: string;
      new_vote_count: number;
    }) => {
      // patch that one question’s vote count
      setPoll((prev) =>
        prev
          ? {
              ...prev,
              poll_questions: prev.poll_questions.map((q) =>
                q.id !== data.question_id
                  ? q
                  : {
                      ...q,
                      poll_options: q.poll_options.map((opt) =>
                        opt.id === data.option_id
                          ? { ...opt, vote_count: data.new_vote_count }
                          : opt
                      ),
                    }
              ),
            }
          : prev
      );
      // if it was your own vote, update selection too
      setHasVotedMap((m) => ({
        ...m,
        [data.question_id]: data.option_id,
      }));
    };

    socket.on("vote_event", handler);
    return () => {
      socket.off("vote_event", handler);
    };
  }, [socket]);

  // 4) Cast or switch vote, with optimistic counts
  const vote = (qId: string, newOptId: string) => {
    const prevOptId = hasVotedMap[qId];
    if (prevOptId === newOptId) return; // no-op

    // fire REST API
    apiClient
      .post("/api/vote_option", [
        { poll_id: poll!.id, question_id: qId, option_id: newOptId },
      ])
      .catch(console.error);

    // optimistic UI: bump new, drop old
    setPoll((p) =>
      p
        ? {
            ...p,
            poll_questions: p.poll_questions.map((q) =>
              q.id !== qId
                ? q
                : {
                    ...q,
                    poll_options: q.poll_options.map((opt) => {
                      if (opt.id === newOptId)
                        return { ...opt, vote_count: opt.vote_count + 1 };
                      if (opt.id === prevOptId)
                        return {
                          ...opt,
                          vote_count: Math.max(0, opt.vote_count - 1),
                        };
                      return opt;
                    }),
                  }
            ),
          }
        : p
    );
    setHasVotedMap((m) => ({ ...m, [qId]: newOptId }));
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (!poll) return <div className="p-4">Poll not found.</div>;

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>

      {poll.poll_questions.map((q) => {
        const selected = hasVotedMap[q.id];
        return (
          <div key={q.id} className="mb-6 border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">
              {q.question_title}
            </h2>

            {q.poll_options.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <div
                  key={opt.id}
                  className="flex items-center justify-between border p-2 rounded mb-2"
                >
                  <span>
                    {opt.text} ({opt.vote_count} votes)
                  </span>
                  <button
                    onClick={() => vote(q.id, opt.id)}
                    disabled={isSelected}
                    className={`px-4 py-2 rounded ${
                      isSelected
                        ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isSelected ? "Voted" : "Vote"}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      <button
        onClick={() => router.push("/")}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Back to Home
      </button>
    </div>
  );
}