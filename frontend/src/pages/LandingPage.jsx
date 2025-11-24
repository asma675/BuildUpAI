import { Zap } from "lucide-react";

const LandingPage = ({ setCurrentPage }) => (
  <div className="p-8 md:p-12 text-center bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-black m-4 md:m-8 rounded-3xl shadow-2xl border border-purple-500/40 backdrop-blur-xl">
    <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-6 animate-pulse drop-shadow-glow" />
    <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_0_25px_rgba(191,90,255,0.8)]">
      CareerLift AI
    </h1>
    <p className="mt-4 text-lg md:text-xl text-purple-100/90 max-w-2xl mx-auto">
      Unlock your potential with personalized career growth plans. Analyze your
      resume against industry standards, powered by Gemini AI and real-time
      Google grounding.
    </p>
    <p className="text-xs md:text-sm mt-6 text-purple-200/70">
      Supporting UN SDG 4 (Quality Education), 8 (Decent Work), and 10 (Reduced
      Inequalities).
    </p>
    <button
      onClick={() => setCurrentPage("upload")}
      className="inline-block mt-8 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:from-cyan-300 hover:via-blue-400 hover:to-purple-400 transition-transform text-white font-bold px-10 py-3 rounded-full shadow-glow transform hover:scale-[1.04]"
    >
      Start Your Analysis
    </button>
  </div>
);

export default LandingPage;
