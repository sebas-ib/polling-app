"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Question = { question_title: string; options: string[] };

export default function CreatePollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question_title: "", options: ["", ""] },
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () =>
    setQuestions([...questions, { question_title: "", options: ["", ""] }]);

  const updateQuestion = (
    idx: number,
    field: "question_title" | "options",
    value: string | string[]
  ) => {
    const copy = [...questions];
    if (field === "question_title" && typeof value === "string") {
      copy[idx].question_title = value;
    }
    if (field === "options" && Array.isArray(value)) {
      copy[idx].options = value;
    }
    setQuestions(copy);
  };

  const createPoll = async () => {
    if (
      !title.trim() ||
      questions.some(
        q =>
          !q.question_title.trim() || q.options.some(opt => !opt.trim())
      )
    ) {
      alert("Please complete all questions and options.");
      return;
    }

    const formData = new FormData();
    formData.append("poll_title", title);
    formData.append("questions", JSON.stringify(questions));

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5001/api/create_poll",
        formData,
        { withCredentials: true }
      );
      // Flask returns { id, title, code }
      router.push(`/poll/${res.data.code}`);
    } catch (err) {
      console.error("Poll creation failed:", err);
      alert("Failed to create poll. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Create a New Poll</h1>
      <input
        type="text"
        placeholder="Poll title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      {questions.map((q, qi) => (
        <div key={qi} className="border p-4 rounded mb-4">
          <input
            type="text"
            placeholder={`Question ${qi + 1}`}
            value={q.question_title}
            onChange={e =>
              updateQuestion(qi, "question_title", e.target.value)
            }
            className="border p-2 w-full mb-2"
          />
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={e => {
                  const opts = [...q.options];
                  opts[oi] = e.target.value;
                  updateQuestion(qi, "options", opts);
                }}
                className="border p-2 flex-1"
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  className="bg-red-500 text-white px-2"
                  onClick={() => {
                    const opts = q.options.filter((_, i) => i !== oi);
                    updateQuestion(qi, "options", opts);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={() =>
              updateQuestion(qi, "options", [...q.options, ""])
            }
          >
            Add Option
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="bg-indigo-600 text-white px-4 py-2 rounded mb-4"
      >
        Add Another Question
      </button>

      <button
        type="button"
        onClick={createPoll}
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Poll"}
      </button>
    </main>
  );
}
