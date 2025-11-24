import React, { useEffect, useState } from "react";
import { Award, Home, PieChart, Search, UploadCloud, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import AppRouter from "./AppRouter";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useFirebase } from "./hooks/useFirebase";

export default function App()
{
    // Analysis data stored in memory and persisted to localStorage
    const [analysisData, setAnalysisData] = useState(() =>
    {
        try
        {
            const raw = localStorage.getItem("analysisData");
            return raw ? JSON.parse(raw) : null;
        } catch
        {
            return null;
        }
    });

    // Firebase Hook
    const { db, userId, isAuthReady } = useFirebase();
    const { analysis: latestAnalysis, isLoading: isLoadingAnalysis } =
        useAnalysisData(db, userId, isAuthReady);

    // When Firestore yields the latestAnalysis, update local and persist it
    useEffect(() =>
    {
        if (isAuthReady && latestAnalysis)
        {
            setAnalysisData(latestAnalysis);
            try
            {
                localStorage.setItem("analysisData", JSON.stringify(latestAnalysis));
            } catch
            {
                // ignore localStorage failures
            }
        }
    }, [isAuthReady, latestAnalysis]);

    // Set the latest loaded analysis data once Firebase is ready if not already set
    useEffect(() =>
    {
        if (!analysisData && isAuthReady && latestAnalysis)
        {
            setAnalysisData(latestAnalysis);
        }
    }, [isAuthReady, latestAnalysis, analysisData]);

    // Whenever analysisData is updated in memory persist it
    useEffect(() =>
    {
        try
        {
            if (analysisData)
            {
                localStorage.setItem("analysisData", JSON.stringify(analysisData));
            }
        } catch
        {
            // ignore
        }
    }, [analysisData]);

    const navItems = [
        { name: "Home", path: "/", icon: Home },
        { name: "Analyze", path: "/upload", icon: UploadCloud },
        { name: "Report", path: "/dashboard", icon: PieChart },
        { name: "Jobs", path: "/jobs", icon: Search },
        { name: "All Courses", path: "/courses", icon: Award },
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
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center px-3 py-2 rounded-xl transition-all text-sm font-medium ${isActive
                                            ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-glow scale-[1.02]"
                                            : "text-purple-100/80 hover:bg-purple-900/60 hover:text-white border border-transparent hover:border-purple-500/60"
                                        }`
                                    }
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">{item.name}</span>
                                </NavLink>
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
                <main className="flex-grow p-4 md:p-6">
                    <AppRouter
                        analysisData={analysisData}
                        setAnalysisData={setAnalysisData}
                        db={db}
                        userId={userId}
                        isAuthReady={isAuthReady}
                        isLoadingAnalysis={isLoadingAnalysis}
                    />
                </main>

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
