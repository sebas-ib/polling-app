"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@/app/context/ClientContext";
import apiClient from "@/app/lib/api";

export default function CreatePollPage() {
  const router = useRouter();
  const { setShowPopup } = useClient();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question_title: "", options: ["", ""] },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowPopup(false);
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question_title: "", options: ["", ""] }]);
  };

  const updateQuestion = (i: number, key: "question_title" | "options", value: any) => {
    const newQuestions = [...questions];
    if (key === "options") {
      newQuestions[i][key] = value;
    } else {
      newQuestions[i][key] = value;
    }
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const createPoll = async () => {
    if (!title.trim() || questions.some(q => !q.question_title.trim() || q.options.some(o => !o.trim()))) {
      alert("Please complete all questions and options.");
      return;
    }

    const formData = new FormData();
    formData.append("poll_title", title);
    formData.append("questions", JSON.stringify(questions));

    setLoading(true);
    try {
      const res = await apiClient.post("/api/create_poll", formData, { withCredentials: true });
      router.push(`/poll/${res.data.code}`);
    } catch (err) {
      console.error("Poll creation failed:", err);
      alert("Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-2xl bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-800">
        <h1 className="text-4xl md:text-5xl mb-6 text-center tracking-wide text-blue-400" style={{ fontFamily: "var(--font-bebas)" }}>
          CREATE A NEW POLL
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Poll title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2">
              <input
                type="text"
                placeholder={`Question ${qi + 1}`}
                value={q.question_title}
                onChange={(e) => updateQuestion(qi, "question_title", e.target.value)}
                className="p-3 w-full rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...q.options];
                      opts[oi] = e.target.value;
                      updateQuestion(qi, "options", opts);
                    }}
                    className="flex-1 p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => updateQuestion(qi, "options", q.options.filter((_, i) => i !== oi))}
                      className="px-3 bg-rose-600 hover:bg-rose-700 text-white rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateQuestion(qi, "options", [...q.options, ""])}
                className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded text-white"
              >
                Add Option
              </button>

              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="bg-red-600 hover:bg-red-700 transition px-4 py-2 rounded text-white"
                >
                  Remove Question
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="bg-blue-700 hover:bg-blue-800 transition px-4 py-2 rounded text-white"
          >
            Add Another Question
          </button>

          <button
            onClick={createPoll}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 rounded text-white disabled:opacity-50"
          >
            {loading ? "Creating Poll..." : "Create Poll"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-white"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </main>
  );
}
