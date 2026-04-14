import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Board from "./pages/Board";
import Home from "./pages/Home";
import CustomCursor from "./components/CustomCursor";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0c14',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Figtree, sans-serif'
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#fff',
            },
          },
        }}
      />
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/projects/:workspaceId" element={<Projects />} />
        <Route path="/boards/:projectId" element={<Board />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;