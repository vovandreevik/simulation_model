import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StepModePage from "./pages/StepModePage";
import AutoModePage from "./pages/AutoModePage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/step-mode" element={<StepModePage />} />
        <Route path="/auto-mode" element={<AutoModePage />} />
      </Routes>
    </Router>
  );
};

export default App;
