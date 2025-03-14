import "./pollResponse.css";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PollResponsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = location.state || { questions: [] };

  const [answers, setAnswers] = useState ({});  // Stores answers

  const handleSubmit = () => {
    console.log("Answers:", answers); // Log answers
    navigate("/thank-you", { state: { answers } }); // Go to thank you page
  };

  // handle answer changes
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  return (
    <div className="container">
      <h2>Take the Poll</h2>
      {questions.map((q, index) => (
        <div key={q.id} className="question-container">
          <h3>Question {index + 1}: {q.text}</h3>
          {q.type === "multiple-choice" ? (     // Multiple choice display
            q.choices.map((choice, i) => (
              <div key={i}>
                <label>
                  <input 
                    type="radio" 
                    name={`question-${index}`} 
                    value={choice}
                    onChange={() => handleAnswerChange(q.id, choice)}
                    />
                  {choice}
                </label>
              </div>
            ))
          ) : q.type === "short-answer" ? (     // Short answer display
            <input 
                type="text" 
                placeholder="Your answer" 
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />    
          ) : q.type === "rating-scale" ? (     // Rating scale display
            <select onChange={(e) => handleAnswerChange(q.id, e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          ) : null}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Poll</button>
      </div>
  );
}