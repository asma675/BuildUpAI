import { Award, Loader, PieChart, Search, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconCard from "../components/IconCard";

const DashboardPage = ({ analysisData, isAuthReady, isLoading }) => {
  const navigate = useNavigate();

  if (!isAuthReady || isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 mx-auto animate-spin text-cyan-300 mb-4" />
        <p className="text-lg text-purple-100">Loading analysis data...</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          No Analysis Found
        </h2>
        <p className="text-lg text-purple-100 mb-6">
          It looks like you haven't completed an analysis yet.
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="inline-block bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 transition-transform text-white font-bold px-6 py-3 rounded-full shadow-glow"
        >
          Start a New Analysis
        </button>
      </div>
    );
  }

  const { resumeScore, missingSkills, summary, careerGoal } = analysisData;
  const scoreColor =
    resumeScore >= 80
      ? "text-emerald-300"
      : resumeScore >= 60
      ? "text-yellow-300"
      : "text-red-300";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-[0_0_18px_rgba(147,51,234,0.9)]">
        Your Career Report
      </h2>
      <p className="text-lg text-purple-100 mb-8">
        Analysis for target role:{" "}
        <span className="font-semibold text-cyan-300">{careerGoal}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Resume Score Card */}
        <IconCard
          icon={PieChart}
          title="Resume Score"
          className="md:col-span-1 text-center"
        >
          <div className={`${scoreColor} text-6xl font-bold my-3`}>
            {resumeScore}%
          </div>
          <p className="text-sm text-purple-100">
            Benchmark against current market needs.
          </p>
        </IconCard>

        {/* Summary Card */}
        <IconCard icon={Award} title="AI Summary" className="md:col-span-2">
          <p className="text-purple-50 leading-relaxed italic border-l-4 border-cyan-400/60 pl-4 py-1">
            {summary}
          </p>
        </IconCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Skills Card */}
        <IconCard icon={Search} title="Crucial Missing Skills">
          <p className="text-purple-100 mb-3">
            Focus on mastering these high-demand areas to bridge your gap:
          </p>
          <ul className="space-y-3">
            {missingSkills.map((skill, index) => (
              <li
                key={index}
                className="flex items-center p-3 bg-red-900/40 rounded-lg text-red-200 font-medium border border-red-500/50"
              >
                <span className="text-red-300 mr-3">•</span> {skill}
              </li>
            ))}
          </ul>
        </IconCard>

        {/* Action Button */}
        <IconCard icon={Zap} title="Next Steps">
          <p className="text-purple-100 mb-4">
            You have a clear path forward. Dive into the detailed plan to start
            leveling up your profile today.
          </p>
          <button
            onClick={() => navigate("/recommendations")}
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:from-cyan-300 hover:via-blue-400 hover:to-purple-400 transition-transform text-white font-bold px-6 py-3 rounded-2xl w-full shadow-glow transform hover:scale-[1.02]"
          >
            View Personalized Recommendations →
          </button>
        </IconCard>
      </div>
    </div>
  );
};

export default DashboardPage;
