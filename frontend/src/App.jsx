import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login      from "./pages/Login";
import Signup     from "./pages/Signup";
import Dashboard  from "./pages/Dashboard";
import Projects   from "./pages/Projects";
import Board      from "./pages/Board";
import Home       from "./pages/Home";
import JoinPage   from "./pages/JoinPage";
import ChannelView from "./pages/ChannelView";
import DMView     from "./pages/DMView";
import { NotFound, Forbidden, OfflineBanner } from "./pages/ErrorPages";

import CustomCursor   from "./components/CustomCursor";
import ErrorBoundary  from "./components/ErrorBoundary";
import { WorkspaceProvider } from "./context/WorkspaceContext";

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        {/* ── Global offline indicator ── */}
        <OfflineBanner />

        {/* ── Toast notifications ── */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0a0c14",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Figtree, sans-serif",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#fff" } },
          }}
        />

        <CustomCursor />

        {/* ── Routes wrapped in ErrorBoundary ── */}
        <ErrorBoundary>
          <Routes>
            {/* Public */}
            <Route path="/"            element={<Home/>} />
            <Route path="/login"       element={<Login />} />
            <Route path="/signup"      element={<Signup />} />
            <Route path="/join/:token" element={<JoinPage />} />

            {/* Error pages (accessible directly) */}
            <Route path="/403" element={<Forbidden />} />
            <Route path="/404" element={<NotFound />} />

            {/* App — each page has its own ErrorBoundary for isolation */}
            <Route path="/dashboard"             element={<ErrorBoundary><Dashboard/></ErrorBoundary>} />
            <Route path="/projects/:workspaceId" element={<ErrorBoundary><Projects /></ErrorBoundary>} />
            <Route path="/boards/:projectId"     element={<ErrorBoundary><Board /></ErrorBoundary>} />
            <Route path="/channels/:channelId"   element={<ErrorBoundary><ChannelView /></ErrorBoundary>} />
            <Route path="/dm/:recipientId"       element={<ErrorBoundary><DMView /></ErrorBoundary>} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

export default App;