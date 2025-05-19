"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/app/lib/api";
import { useClient } from "@/app/context/ClientContext";

import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

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
  show_results: boolean;
  voting_locked: boolean;
};

export default function PollPage() {
  const router = useRouter();
  const { pollName: pollCode } = useParams() as { pollName: string };
  const { socket, clientId } = useClient();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const handleToggleVotingLock = async () => {
    const res = await apiClient.post("/api/toggle_voting_lock", {
      poll_id: poll?.id,
    });
    setPoll((prev) =>
      prev ? { ...prev, voting_locked: res.data.voting_locked } : prev
    );
  };

  const handleToggleResults = async () => {
    if (!poll) return;
    const res = await apiClient.post("/api/toggle_results", {
      poll_id: poll.id,
    });
    setPoll((prev) =>
      prev ? { ...prev, show_results: res.data.show_results } : prev
    );
  };

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
    if (!socket || !poll) return;

    socket.on("toggle_results_event", (data: { poll_id: string; show_results: boolean }) => {
      if (data.poll_id === poll.id) {
        setPoll((prev) => (prev ? { ...prev, show_results: data.show_results } : prev));
      }
    });

    socket.on("lock_poll_event", (data: { poll_id: string; voting_locked: boolean }) => {
      if (data.poll_id === poll.id) {
        setPoll((prev) => (prev ? { ...prev, voting_locked: data.voting_locked } : prev));
      }
    });

    socket.on("vote_event", (data: any) => {
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
                        if (opt.id === new_vote.option_id)
                          return { ...opt, vote_count: new_vote.vote_count };
                        if (old_vote?.option_id === opt.id)
                          return { ...opt, vote_count: old_vote.vote_count };
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
    });

    return () => {
      socket.off("toggle_results_event");
      socket.off("lock_poll_event");
      socket.off("vote_event");
    };
  }, [socket, poll, clientId]);

  const vote = (qId: string, newOptId: string) => {
    if (!poll || poll.voting_locked) return;
    const prevOptId = hasVotedMap[qId];
    if (prevOptId === newOptId) return;

    apiClient
      .post("/api/vote_option", [{ poll_id: poll.id, question_id: qId, option_id: newOptId }])
      .catch(console.error);

    setPoll((prev) =>
      prev
        ? {
            ...prev,
            poll_questions: prev.poll_questions.map((q) =>
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
        : prev
    );

    setHasVotedMap((prev) => ({ ...prev, [qId]: newOptId }));
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (!poll) return <div className="p-4">Poll not found.</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111315] to-[#1c1c1c] text-white px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-[#16181c] border border-neutral-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
          {poll.title}
        </h1>

        <p className="text-center text-neutral-400 text-sm mb-6">
          Join Code:{" "}
          <span className="font-mono bg-[#1f1f22] text-white px-2 py-1 rounded-lg">
            {pollCode}
          </span>
        </p>

        {poll.owner_id === clientId && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <button
              onClick={handleToggleResults}
              className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-white rounded-xl transition"
            >
              {poll.show_results ? "Hide Results from Others" : "Show Results to Others"}
            </button>

            <button
              onClick={handleToggleVotingLock}
              className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 text-white rounded-xl transition"
            >
              {poll.voting_locked ? "Unlock Voting" : "Lock Voting"}
            </button>
          </div>
        )}

        {poll.poll_questions.map((q) => {
          const selected = hasVotedMap[q.id];
          const totalVotes = q.poll_options.reduce((sum, opt) => sum + opt.vote_count, 0);

          return (
            <div key={q.id} className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{q.question_title}</h2>

              <div className="space-y-4">
                {q.poll_options.map((opt) => {
                  const isSelected = selected === opt.id;
                  const percent =
                    totalVotes === 0 ? 0 : (opt.vote_count / totalVotes) * 100;

                  return (
                    <div
                      key={opt.id}
                      className="relative w-full bg-[#222529] border border-neutral-700 rounded-xl overflow-hidden"
                    >
                      {(poll.show_results || poll.owner_id === clientId) && (
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      )}

                      {isSelected && (
                        <div className="absolute top-0 right-0 h-full w-2 bg-green-500" />
                      )}

                      {!poll.voting_locked ? (
                        <button
                          onClick={() => vote(q.id, opt.id)}
                          disabled={isSelected}
                          className="relative w-full text-left px-4 py-3 z-10 text-white"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">{opt.text}</span>
                            {(poll.show_results || poll.owner_id === clientId) && (
                              <span className="text-sm text-white opacity-80">
                                {opt.vote_count} vote{opt.vote_count !== 1 && "s"}
                              </span>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="relative w-full px-4 py-3 z-10 text-white opacity-60 cursor-not-allowed">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium">{opt.text}</span>
                            {(poll.show_results || poll.owner_id === clientId) && (
                              <span className="text-sm">{opt.vote_count} votes</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(poll.show_results || poll.owner_id === clientId) && (
                <div className="w-full h-80 mt-6 bg-[#1f1f22] rounded-xl border border-neutral-700 p-4">
                  <Pie
                    data={{
                      labels: q.poll_options.map((opt) => opt.text),
                      datasets: [
                        {
                          label: "Votes",
                          data: q.poll_options.map((opt) => opt.vote_count),
                          backgroundColor: [
                            "rgba(59, 130, 246, 0.8)",
                            "rgba(16, 185, 129, 0.8)",
                            "rgba(234, 179, 8, 0.8)",
                            "rgba(244, 63, 94, 0.8)",
                            "rgba(147, 51, 234, 0.8)",
                            "rgba(251, 191, 36, 0.8)",
                          ],
                          borderColor: "#0f172a",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: { color: "#ffffff" },
                        },
                        datalabels: {
                          color: "#ffffff",
                          font: { weight: "bold" },
                          formatter: (value: number) => `${value} vote${value !== 1 ? "s" : ""}`,
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="bg-rose-600 hover:bg-rose-700 px-6 py-3 text-white rounded-xl transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
