import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import EmployeeDashboard from "./pages/EmployeeDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        {/* You can add more routes here */}
        <Route path="/" element={<div>Home Page (Placeholder)</div>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}