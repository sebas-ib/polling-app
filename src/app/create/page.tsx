"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CreatePollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question_title: "", options: ["", ""] },
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { question_title: "", options: ["", ""] }]);
  };

  const updateQuestion = (index: number, key: string, value: any) => {
    const newQuestions = [...questions];
    if (key === "question_title") {
      newQuestions[index].question_title = value;
    } else if (key === "option") {
      newQuestions[index].options = value;
    }
    setQuestions(newQuestions);
  };

  const createPoll = () => {
    if (!title.trim() || questions.some(q => !q.question_title.trim() || q.options.some(opt => !opt.trim()))) {
      alert("Please complete all questions and options.");
      return;
    }

    const formData = new FormData();
    formData.append("poll_title", title);
    formData.append("questions", JSON.stringify(questions));

    setLoading(true);
    axios.post("http://localhost:3001/api/create_poll", formData, {
      withCredentials: true,
    })
      .then(() => router.push("/"))
      .catch(err => console.error("Poll creation failed", err))
      .finally(() => setLoading(false));
  };

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Create a New Poll</h1>
      <input
        type="text"
        placeholder="Poll title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      {questions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 rounded mb-4">
          <input
            type="text"
            placeholder={`Question ${qIndex + 1}`}
            value={q.question_title}
            onChange={(e) => {
              updateQuestion(qIndex, "question_title", e.target.value);
            }}
            className="border p-2 w-full mb-2"
          />
          {q.options.map((opt, optIndex) => (
            <div key={optIndex} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`Option ${optIndex + 1}`}
                value={opt}
                onChange={(e) => {
                  const updatedOptions = [...q.options];
                  updatedOptions[optIndex] = e.target.value;
                  updateQuestion(qIndex, "option", updatedOptions);
                }}
                className="border p-2 flex-1"
              />
              {q.options.length > 2 && (
                <button
                  className="bg-red-500 text-white px-2"
                  onClick={() => {
                    const updatedOptions = q.options.filter((_, i) => i !== optIndex);
                    updateQuestion(qIndex, "option", updatedOptions);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={() =>
              updateQuestion(qIndex, "option", [...q.options, ""])
            }
          >
            Add Option
          </button>
        </div>
      ))}

      <button onClick={addQuestion} className="bg-indigo-600 text-white px-4 py-2 rounded mb-4">
        Add Another Question
      </button>

      <button
        onClick={createPoll}
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Poll"}
      </button>
    </main>
  );
}
