import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PollCreationPage from "./Pages/pollCreation";
import PollResponsePage from "./Pages/pollResponse";
import ThankYouPage from "./Pages/thankYou";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PollCreationPage />} />
        <Route path="/pollResponse" element={<PollResponsePage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    </Router>
  );
}