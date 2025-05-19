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
    newQuestions[i][key] = value;
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
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111315] to-[#1c1c1c] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-[#16181c] border border-neutral-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-8">
          Create a New Poll
        </h1>

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Poll Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#222529] text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {questions.map((q, qi) => (
            <div key={qi} className="space-y-3 bg-[#1f1f22] p-4 rounded-xl border border-neutral-700">
              <input
                type="text"
                placeholder={`Question ${qi + 1}`}
                value={q.question_title}
                onChange={(e) => updateQuestion(qi, "question_title", e.target.value)}
                className="w-full p-3 rounded-xl bg-[#222529] text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...q.options];
                      opts[oi] = e.target.value;
                      updateQuestion(qi, "options", opts);
                    }}
                    className="flex-1 p-3 rounded-xl bg-[#222529] text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => updateQuestion(qi, "options", q.options.filter((_, i) => i !== oi))}
                      className="px-3 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => updateQuestion(qi, "options", [...q.options, ""])}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm rounded-xl transition"
                >
                  Add Option
                </button>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm rounded-xl transition"
                  >
                    Remove Question
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-xl text-white transition"
          >
            Add Another Question
          </button>

          <button
            onClick={createPoll}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 px-4 py-3 rounded-xl text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? "Creating Poll..." : "Create Poll"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 bg-neutral-700 hover:bg-neutral-600 px-4 py-3 rounded-xl text-white transition"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </main>
  );
}
