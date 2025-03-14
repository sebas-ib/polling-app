import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./pollCreation.css";

export default function PollCreationPage() {
  const [questions, setQuestions] = useState([]);   // List of quesitons
   const navigate = useNavigate(); // Initialize useNavigate

  // Updates list of questions with new quesitons
  // Each has id, type of quesiton, question text, and array of answer choices (multiple choice only)
  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), type: "multiple-choice", text: "", choices: [""] }]);
  };

  const publishPoll = () => {
    // Navigate to the poll response page 
    navigate("/pollResponse", { state: { questions } });
  };


  return (
    <div className="container">
      <h2>Create a Poll</h2>
      {questions.map((q, index) => (
        <QuestionInput
          key={q.id}
          question={q}
          setQuestions={setQuestions}
          questions={questions}
          index={index}
          questionNumber={index + 1}
        />
      ))}
      <button onClick={addQuestion}>Add Question</button>
      <button onClick={publishPoll}>Publish Poll</button> 
    </div>
  );
}

// Handles each question
function QuestionInput({ question, setQuestions, questions, index, questionNumber }) {
  const updateQuestion = (field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // For multiple choice questions
  const updateChoice = (choiceIndex, value) => {
    const updated = [...questions];
    updated[index].choices[choiceIndex] = value;
    setQuestions(updated);
  };

  const addChoice = () => {
    const updated = [...questions];
    updated[index].choices.push("");
    setQuestions(updated);
  };

  return (
    <div className="question-container">
      <h3>Question {questionNumber}</h3>

      <input
        type="text"
        placeholder="Enter question"
        value={question.text}
        onChange={(e) => updateQuestion("text", e.target.value)}
      />
      <select value={question.type} onChange={(e) => updateQuestion("type", e.target.value)}>
        <option value="multiple-choice">Multiple Choice</option>
        <option value="short-answer">Short Answer</option>
        <option value="rating-scale">Rating Scale</option>
      </select>

      {question.type === "multiple-choice" &&
        question.choices.map((choice, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Choice ${i + 1}`}
            value={choice}
            onChange={(e) => updateChoice(i, e.target.value)}
          />
        ))}

      {question.type === "multiple-choice" && <button onClick={addChoice}>Add Choice</button>}
    </div>
  );
}