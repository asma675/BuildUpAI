import React, { useCallback, useEffect, useState } from "react";
import { Award, Home, PieChart, Search, UploadCloud, Zap } from "lucide-react";
import AddCoursePage from "./pages/AddCoursePage";
import DashboardPage from "./pages/DashboardPage";
import JobMatchPage from "./pages/JobMatchPage";
import LandingPage from "./pages/LandingPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import UploadPage from "./pages/UploadPage";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useFirebase } from "./hooks/useFirebase";

export default function App() {
  // Initialize currentPage from localStorage so refresh restores last page
  const [currentPageState, setCurrentPageState] = useState(() => {
    try {
      return localStorage.getItem("currentPage") || "landing";
    } catch {
      return "landing";
    }
  });

  // Analysis data stored in memory and persisted to localStorage
  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const raw = localStorage.getItem("analysisData");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Firebase Hook
  const { db, userId, isAuthReady } = useFirebase();
  const { analysis: latestAnalysis, isLoading: isLoadingAnalysis } =
    useAnalysisData(db, userId, isAuthReady);

  // When Firestore yields the latestAnalysis, update local and persist it
  useEffect(() => {
    if (isAuthReady && latestAnalysis) {
      setAnalysisData(latestAnalysis);
      try {
        localStorage.setItem("analysisData", JSON.stringify(latestAnalysis));
      } catch {
        // ignore localStorage failures
      }
    }
  }, [isAuthReady, latestAnalysis]);

  // Persist current page whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("currentPage", currentPageState);
    } catch {
      // ignore storage failure
    }
  }, [currentPageState]);

  // Save scroll position for the current page before switching away or before unload
  const saveScrollForPage = useCallback((pageKey) => {
    try {
      if (typeof window === "undefined") return;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      localStorage.setItem(`scrollPos_${pageKey}`, String(Math.floor(scrollY)));
    } catch {
      // ignore
    }
  }, []);

  // Restore scroll position when currentPageState changes (after render)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const key = `scrollPos_${currentPageState}`;
      const raw = localStorage.getItem(key);
      const pos = raw ? parseInt(raw, 10) : 0;
      setTimeout(() => {
        window.scrollTo(0, isNaN(pos) ? 0 : pos);
      }, 0);
    } catch {
      // ignore
    }
  }, [currentPageState, analysisData]);

  // Save scroll on beforeunload
  useEffect(() => {
    const handler = () => {
      try {
        saveScrollForPage(currentPageState);
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [currentPageState, saveScrollForPage]);

  // wrapped setter that saves scroll of the outgoing page and updates state
  const setCurrentPage = useCallback(
    (nextPage) => {
      try {
        saveScrollForPage(currentPageState);
      } catch {}
      setCurrentPageState(nextPage);
    },
    [currentPageState, saveScrollForPage]
  );

  // Set the latest loaded analysis data once Firebase is ready if not already set
  useEffect(() => {
    if (!analysisData && isAuthReady && latestAnalysis) {
      setAnalysisData(latestAnalysis);
    }
  }, [isAuthReady, latestAnalysis, analysisData]);

  // Whenever analysisData is updated in memory persist it
  useEffect(() => {
    try {
      if (analysisData) {
        localStorage.setItem("analysisData", JSON.stringify(analysisData));
      }
    } catch {
      // ignore
    }
  }, [analysisData]);

  const renderPage = useCallback(() => {
    switch (currentPageState) {
      case "landing":
        return <LandingPage setCurrentPage={setCurrentPage} />;
      case "upload":
        return (
          <UploadPage
            setCurrentPage={setCurrentPage}
            setAnalysisData={setAnalysisData}
            db={db}
            userId={userId}
          />
        );
      case "dashboard":
        return (
          <DashboardPage
            setCurrentPage={setCurrentPage}
            analysisData={analysisData}
            isAuthReady={isAuthReady}
            isLoading={isLoadingAnalysis}
          />
        );
      case "recommendations":
        return (
          <RecommendationsPage
            setCurrentPage={setCurrentPage}
            analysisData={analysisData}
          />
        );
      case "jobs":
        return (
          <JobMatchPage
            setCurrentPage={setCurrentPage}
            analysisData={analysisData}
          />
        );
      case "addCourse":
        return <AddCoursePage db={db} userId={userId} />;
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  }, [
    currentPageState,
    analysisData,
    db,
    userId,
    isAuthReady,
    isLoadingAnalysis,
    setCurrentPage,
  ]);

  const navItems = [
    { name: "Home", page: "landing", icon: Home },
    { name: "Analyze", page: "upload", icon: UploadCloud },
    { name: "Report", page: "dashboard", icon: PieChart },
    { name: "Jobs", page: "jobs", icon: Search },
    { name: "All Courses", page: "addCourse", icon: Award },
  ];

  return (
    <>
      {/* Global styles for neon/purple look */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at top, #4c1d95 0, #020617 55%);
          color: #e5e7eb;
        }
        .shadow-glow {
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.5), 0 0 36px rgba(147, 51, 234, 0.4);
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.7));
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-black to-purple-950 text-gray-100 flex flex-col">
        {/* Header and Navigation */}
        <header className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-black/90 shadow-2xl z-10 sticky top-0 border-b border-purple-700/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
            <div className="text-white text-2xl font-extrabold flex items-center tracking-tight">
              <Zap className="w-6 h-6 mr-2 text-yellow-300 drop-shadow-glow" />
              <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                CareerLift AI
              </span>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex items-center px-3 py-2 rounded-xl transition-all text-sm font-medium ${
                    currentPageState === item.page
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-glow scale-[1.02]"
                      : "text-purple-100/80 hover:bg-purple-900/60 hover:text-white border border-transparent hover:border-purple-500/60"
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* User ID Display */}
        <div className="bg-black/60 p-2 text-center text-[11px] text-purple-300 border-b border-purple-900/70">
          User ID (for persistence):{" "}
          <span className="font-mono text-cyan-300 break-all">
            {userId || "Authenticating..."}
          </span>
        </div>

        {/* Main Content Area */}
        <main className="flex-grow p-4 md:p-6">{renderPage()}</main>

        {/* Footer */}
        <footer className="bg-black/90 text-purple-200 p-4 text-center text-xs md:text-sm border-t border-purple-900/70">
          <p>
            © {new Date().getFullYear()} CareerLift AI. Powered by Gemini &
            BigQuery. Designed by our team 💜
          </p>
        </footer>
      </div>
    </>
  );
}
