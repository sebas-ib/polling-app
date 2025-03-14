"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "../context/ClientContext";
import axios from "axios";

export default function CreatePollPage() {
  const router = useRouter();
  const { clientName, socket } = useClient();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

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
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Create a New Poll</h1>
      <div className="flex flex-col gap-4">
        <input
            type="text"
            placeholder="Poll title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2"
        />
        <input
            type="text"
            placeholder="Poll question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="border p-2"
        />
        {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  className="border p-2 flex-1"
              />
              {options.length > 2 && (
                  <button
                      onClick={() =>
                          setOptions(options.filter((_, i) => i !== index))
                      }
                      className="bg-red-500 text-white px-2 py-1"
                  >
                    Remove
                  </button>
              )}
            </div>
        ))}
        <button
            onClick={() => setOptions([...options, ""])}
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Option
        </button>
        <button
            onClick={createPoll}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={loading}
        >
          {loading ? "Creating Poll..." : "Create Poll"}
        </button>
      </div>
    </main>
  );
}
