"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "../context/ClientContext";
import axios from "axios";

export default function CreatePollPage() {
  const router = useRouter();
  const { setShowPopup } = useClient();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowPopup(false);
  }, []);
  const createPoll = () => {
    if (!question.trim() || options.some((opt) => !opt.trim())) {
      alert("Please enter a poll question and non-empty options.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("poll_title", title);
    formData.append("question_title", question);
    const optionsObj = { options };
    const optionsJSON = JSON.stringify(optionsObj);
    formData.append("options", optionsJSON);

    axios
      .post("http://localhost:3001/api/create_poll", formData, {
        withCredentials: true,
      })
      .then((response) => {
        console.log("created poll: " );
        router.push("/");
      })
      .catch((error) => {
        console.error("Error calling /api/set_name:", error);
        });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1117] via-[#0b1b26] to-[#0f172a] text-neutral-100 px-4">
      <div className="w-full max-w-xl bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-800">
        <h1
          className="text-4xl md:text-5xl mb-6 text-center tracking-wide text-blue-400"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
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
          <input
            type="text"
            placeholder="Poll question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                className="flex-1 p-3 rounded bg-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {options.length > 2 && (
                <button
                  onClick={() =>
                    setOptions(options.filter((_, i) => i !== index))
                  }
                  className="px-3 bg-rose-600 hover:bg-rose-700 text-white rounded"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setOptions([...options, ""])}
            className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded text-white"
          >
            ➕ Add Option
          </button>

          <button
            onClick={createPoll}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 transition px-4 py-2 rounded text-white disabled:opacity-50"
          >
            {loading ? "Creating Poll..." : "Create Poll"}
          </button>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => router.push("/")}
              className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded text-white"
            >
              ← Back to Menu
            </button>
            <button
              onClick={() => alert("Feature coming soon!")}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-white"
            >
              ➕ Add Question
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
