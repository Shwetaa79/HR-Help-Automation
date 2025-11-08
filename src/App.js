import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HrHelpCaseSearch from "./components/HrHelpCaseSearch";
import CaseDetail from "./components/CaseDetailView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HrHelpCaseSearch />} />
        <Route path="/case/:caseNumber" element={<CaseDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
