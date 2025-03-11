"use client";

import "./style.css";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function Home() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollId, setPollId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [poll, setPoll] = useState<any>(null);
  const [isPollCreated, setIsPollCreated] = useState(false);

  useEffect(() => {
    socket.on("pollCreated", ({ id, passcode }) => {
      setPollId(id);
      setPasscode(passcode);
    });

    socket.on("pollJoined", (pollData) => {
      setPollId(pollData.id);
      setPoll(pollData);
    });

    socket.on("updatePoll", (updatedPoll) => {
      if (pollId === updatedPoll.id) {
        setPoll(updatedPoll);
      }
    });

    return () => {
      socket.off("pollCreated");
      socket.off("pollJoined");
      socket.off("updatePoll");
    };
  }, [pollId]);

  const createPoll = () => {
    if (question.trim() && options.every((opt) => opt.trim() !== "")) {
      socket.emit("createPoll", { question, options });
      setIsPollCreated(true);
      setQuestion("");
      setOptions(["", ""]);
    }
  };

  const joinPoll = () => {
    if (passcode.trim()) {
      socket.emit("joinPoll", { passcode });
      setIsPollCreated(false);
      setPasscode("");
    }
  };

  const vote = (optionIndex: number) => {
    if (pollId) {
      socket.emit("vote", { pollId, optionIndex });
    }
  };

  return (
    <main className="container">
      <h1>Real-Time Polls</h1>

      <div>
        <h2>Create a Poll</h2>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Poll question"
        />
        {options.map((opt, idx) => (
          <div key={idx} className="option-container">
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const updatedOptions = [...options];
                updatedOptions[idx] = e.target.value;
                setOptions(updatedOptions);
              }}
              placeholder={`Option ${idx + 1}`}
            />
            {options.length > 2 && (
              <button
                onClick={() => setOptions(options.filter((_, i) => i !== idx))}
              >
                Remove Option
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setOptions([...options, ""])}>Add Option</button>
        <button onClick={createPoll}>Create Poll</button>
        {isPollCreated && pollId && <p>Poll created! Passcode: {passcode}</p>}
      </div>

      <div>
        <h2>Join a Poll</h2>
        <input
          type="text"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
        />
        <button onClick={joinPoll}>Join Poll</button>
      </div>

      {poll && (
        <div>
          <h2>{poll.question}</h2>
          <div className="poll-options">
            {poll.options.map((option: string, index: number) => (
              <button key={index} onClick={() => vote(index)}>
                {option} ({poll.votes[index] || 0} votes)
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
