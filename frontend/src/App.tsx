import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Landing from "./pages/Landing";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Landing />} /> {/* Default to login */}
        <Route path="login" element={<Login />} /> {/* Default to login */}
        <Route path="/employee" element={<EmployeeDashboard />} /> {/* Default to login */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}