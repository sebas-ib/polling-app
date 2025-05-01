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

  useEffect(() => {
    if (!socket || !poll) return;
    socket.emit("join_poll", { poll_id: poll.id });
  }, [socket, poll]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: {
      question_id: string;
      vote_sent_by: string;
      client_id: string;
      new_vote?: { option_id: string; vote_count: number };
      old_vote?: { option_id: string; vote_count: number | null };
    }) => {
      const { question_id, new_vote, old_vote, client_id: voteClientId } = data;
      if (!new_vote) return;

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

  const vote = (qId: string, newOptId: string) => {
    const prevOptId = hasVotedMap[qId];
    if (prevOptId === newOptId) return;

    apiClient
      .post("/api/vote_option", [
        { poll_id: poll!.id, question_id: qId, option_id: newOptId },
      ])
      .catch(console.error);

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-3xl bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-800">
        <h1 className="text-4xl md:text-5xl mb-6 text-center tracking-wide text-blue-400" style={{ fontFamily: "var(--font-bebas)" }}>
          {poll.title}
        </h1>

        {poll.poll_questions.map((q) => {
          const selected = hasVotedMap[q.id];
          return (
            <div key={q.id} className="mb-8">
              <h2 className="text-2xl mb-4 text-white">{q.question_title}</h2>

              <div className="space-y-4">
                {q.poll_options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <div key={opt.id} className="flex justify-between items-center bg-neutral-800 rounded p-3">
                      <div>
                        <p className="text-lg">{opt.text}</p>
                        <p className="text-sm text-neutral-400">{opt.vote_count} votes</p>
                      </div>
                      <button
                        onClick={() => vote(q.id, opt.id)}
                        disabled={isSelected}
                        className={`px-4 py-2 rounded text-white transition ${
                          isSelected ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isSelected ? "Voted" : "Vote"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="bg-rose-600 hover:bg-rose-700 px-6 py-3 text-white rounded-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
