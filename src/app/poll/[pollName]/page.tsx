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
  const { socket, clientId } = useClient();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 1) Load poll data and saved votes
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

  // 2) Join the poll room via socket
  useEffect(() => {
    if (!socket || !poll) return;
    socket.emit("join_poll", { poll_id: poll.id });
  }, [socket, poll]);

  // 3) Listen for real-time vote updates
  useEffect(() => {
    if (!socket) return;

    const handler = (data: {
      question_id: string;
      vote_sent_by: string;
      client_id: string;
      new_vote?: { option_id: string; vote_count: number };
      old_vote?: { option_id: string; vote_count: number | null };
    }) => {
      console.log("[SocketIO] vote_event received:", data);
      const { question_id, new_vote, old_vote, client_id: voteClientId } = data;
      if (!new_vote) return;

      // Update vote counts
      setPoll((prev) =>
        prev
          ? {
              ...prev,
              poll_questions: prev.poll_questions.map((q) =>
                q.id !== question_id
                  ? q
                  : {
                      ...q,
                      poll_options: q.poll_options.map((opt) => {
                        if (opt.id === new_vote.option_id) {
                          return { ...opt, vote_count: new_vote.vote_count };
                        }
                        if (
                          old_vote &&
                          old_vote.option_id === opt.id &&
                          old_vote.vote_count !== null
                        ) {
                          return { ...opt, vote_count: old_vote.vote_count };
                        }
                        return opt;
                      }),
                    }
              ),
            }
          : prev
      );

      // Sync vote selection across tabs for same client
      if (voteClientId === clientId) {
        setHasVotedMap((prev) => ({
          ...prev,
          [question_id]: new_vote.option_id,
        }));
      }
    };

    socket.on("vote_event", handler);
    return () => {
      socket.off("vote_event", handler);
    };
  }, [socket, clientId]);

  // 4) Cast vote and optimistically update UI
  const vote = (qId: string, newOptId: string) => {
    const prevOptId = hasVotedMap[qId];
    if (prevOptId === newOptId) return;

    apiClient
      .post("/api/vote_option", [
        { poll_id: poll!.id, question_id: qId, option_id: newOptId },
      ])
      .catch(console.error);

    // Optimistic UI update
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
            <h2 className="text-xl font-semibold mb-2">{q.question_title}</h2>

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
