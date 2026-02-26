import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "@/context/AuthContext";

import AppSidebar from "@/components/AppSidebar";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import Recommendations from "./pages/Recommendations";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Calendar from "./pages/Calendar";
import GamesPage from "./pages/GamesPage";
import TherapyPage from "./pages/TherapyPage";

import BreathingGame from "./pages/games/BreathingGame";
import MemoryGame from "./pages/games/MemoryGame";
import GratitudeGame from "./pages/games/GratitudeGame";
import MazeGame from "./pages/games/MazeGame";
import ColorGame from "./pages/games/ColorGame";
import ZenGame from "./pages/games/ZenGame";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

/* 🔒 Protected Wrapper */
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup";

  if (!user && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Hide Sidebar on Login/Signup */}
      {!isAuthPage && <AppSidebar />}

      <main className="flex-1 min-w-0 h-screen overflow-hidden bg-card">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/breathing" element={<BreathingGame />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/gratitude" element={<GratitudeGame />} />
          <Route path="/games/maze" element={<MazeGame />} />
          <Route path="/games/color" element={<ColorGame />} />
          <Route path="/games/zen" element={<ZenGame />} />
          <Route path="/therapy" element={<TherapyPage />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;