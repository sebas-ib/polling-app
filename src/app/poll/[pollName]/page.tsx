"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/app/lib/api";
import { useClient } from "@/app/context/ClientContext";

import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

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
};

export default function PollPage() {
  const router = useRouter();
  const { pollName: pollCode } = useParams() as { pollName: string };
  const { socket, clientId } = useClient();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [hasVotedMap, setHasVotedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const handleToggleResults = async () => {
    if (!poll) return;

    try {
      const res = await apiClient.post("/api/toggle_results", {
        poll_id: poll.id,
      });

      const { show_results } = res.data;
      setPoll((prev) => (prev ? { ...prev, show_results } : prev));
    } catch (err) {
      console.error("Failed to toggle results visibility:", err);
    }
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

    const toggleHandler = (data: { poll_id: string; show_results: boolean }) => {
      if (data.poll_id !== poll.id) return;

      setPoll((prev) =>
        prev ? { ...prev, show_results: data.show_results } : prev
      );
    };

    socket.on("toggle_results_event", toggleHandler);
    return () => {
      socket.off("toggle_results_event", toggleHandler);
    };
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
        <h1
          className="text-4xl md:text-5xl mb-6 text-center tracking-wide text-blue-400"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          {poll.title}
        </h1>

        {poll.owner_id === clientId && (
          <div className="mt-4 text-center">
            <button
              onClick={handleToggleResults}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white rounded"
            >
              {poll.show_results
                ? "Hide Results from Others"
                : "Show Results to Others"}
            </button>
          </div>
        )}

        {poll.poll_questions.map((q) => {
          const selected = hasVotedMap[q.id];
          const totalVotes = q.poll_options.reduce(
            (sum, opt) => sum + opt.vote_count,
            0
          );

          return (
            <div key={q.id} className="mb-8">
              <h2 className="text-2xl mb-4 text-white">{q.question_title}</h2>

              <div className="space-y-4">
                {q.poll_options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className="relative w-full bg-neutral-800 rounded overflow-hidden"
                    >
                      {/* Blue percentage fill */}
                      {(poll.show_results || poll.owner_id === clientId) && (
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
                          style={{
                            width:
                              totalVotes === 0
                                ? "0%"
                                : `${(opt.vote_count / totalVotes) * 100}%`,
                          }}
                        />
                      )}

                      {/* Green selection indicator */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 h-full w-2 bg-green-500" />
                      )}

                      {/* Actual button content */}
                      <button
                        onClick={() => vote(q.id, opt.id)}
                        disabled={isSelected}
                        className="relative w-full text-left px-4 py-3 z-10 text-white"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">{opt.text}</span>
                          {(poll.show_results || poll.owner_id === clientId) && (
                            <span className="text-sm text-white opacity-80">
                              {opt.vote_count} votes
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {(poll.show_results || poll.owner_id === clientId) && (
                <div className="w-full h-64 mt-4 bg-neutral-800 rounded border border-neutral-700 p-2">
                  <Bar
                    data={{
                      labels: q.poll_options.map((opt) => opt.text),
                      datasets: [
                        {
                          label: "Vote %",
                          data: q.poll_options.map((opt) =>
                            totalVotes === 0
                              ? 0
                              : parseFloat(
                                  ((opt.vote_count / totalVotes) * 100).toFixed(2)
                                )
                          ),
                          backgroundColor: "rgba(59, 130, 246, 0.8)",
                          borderColor: "rgba(30, 64, 175, 1)",
                          borderWidth: 2,
                          borderRadius: 5,
                        },
                      ],
                    }}
                    options={{
                      indexAxis: "y",
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        datalabels: {
                          color: "#ffffff",
                          anchor: "end",
                          align: "start",
                          offset: 10,
                          font: {
                            weight: "bold",
                          },
                          formatter: (value, context) =>
                            context.chart.data.labels?.[context.dataIndex],
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            color: "#ffffff",
                            callback: (value) => `${value}%`,
                          },
                          grid: {
                            color: "#444",
                          },
                        },
                        y: {
                          ticks: {
                            display: false,
                          },
                          grid: {
                            color: "#444",
                          },
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
            className="bg-rose-600 hover:bg-rose-700 px-6 py-3 text-white rounded-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
