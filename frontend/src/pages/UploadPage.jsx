import { useEffect, useState } from "react";
import { Loader, Search, UploadCloud, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconCard from "../components/IconCard";
import {
  analyzeResumeWithGemini,
  uploadResumeFile,
} from "../services/api";

/**
 * UploadPage with:
 * - extra roles for Scotiabank & Dayforce
 * - “Other (custom)” option + text box
 */
const UploadPage = ({ setAnalysisData, db, userId }) => {
  const navigate = useNavigate();
  const storedResume =
    typeof window !== "undefined"
      ? localStorage.getItem("upload_resumeText")
      : "";
  const storedGoal =
    typeof window !== "undefined"
      ? localStorage.getItem("upload_careerGoal")
      : null;
  const storedCustomGoal =
    typeof window !== "undefined"
      ? localStorage.getItem("upload_customCareerGoal")
      : "";

  const [resumeText, setResumeText] = useState(storedResume || "");
  const [careerGoal, setCareerGoal] = useState(
    storedGoal || "Software Engineer (Full-Stack)"
  );
  const [customCareerGoal, setCustomCareerGoal] = useState(
    storedCustomGoal || ""
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("upload_resumeText", resumeText);
      localStorage.setItem("upload_careerGoal", careerGoal);
      localStorage.setItem("upload_customCareerGoal", customCareerGoal);
    } catch (e) {
      // ignore storage failures
    }
  }, [resumeText, careerGoal, customCareerGoal]);

  const careerGoals = [
    "Software Engineer (Full-Stack)",
    "Cybersecurity Analyst",
    "Data Scientist",
    "UX/UI Designer",
    "Financial Analyst",
    "Marketing Manager (Digital)",
    "Mechanical Engineer",
    "Scotiabank – Software Engineer",
    "Dayforce – Software Engineer",
    "Other (custom)",
  ];

  const handleAnalyze = async () => {
    if (resumeText.length < 50) {
      setError(
        "Please paste a more complete resume (at least 50 characters) to get an accurate analysis."
      );
      return;
    }

    if (careerGoal === "Other (custom)" && customCareerGoal.trim().length < 3) {
      setError("Please enter your custom career goal in the text box.");
      return;
    }

    const finalCareerGoal =
      careerGoal === "Other (custom)" ? customCareerGoal.trim() : careerGoal;

    setError(null);
    setIsAnalyzing(true);
    setAnalysisStatus("Sending resume to backend...");

    try {
      setAnalysisStatus("Waiting for Gemini analysis...");
      const result = await analyzeResumeWithGemini(
        db,
        userId,
        resumeText,
        finalCareerGoal
      );
      setAnalysisData(result);
      setAnalysisStatus("Analysis complete.");
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setError(`Analysis failed. Please try again. Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a file first.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const { extractedText } = await uploadResumeFile(selectedFile, careerGoal);
      setResumeText(extractedText);
      setError(null);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-[0_0_18px_rgba(59,130,246,0.8)]">
        Analyze Your Career Path
      </h2>
      <p className="text-sm md:text-base text-purple-100 mb-6 opacity-90">
        Upload your resume or paste the content, choose a target role, and let
        CareerLift generate a tailored action plan.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Card */}
        <IconCard icon={UploadCloud} title="Resume Content" className="lg:col-span-1">
          <p className="text-sm text-purple-100 mb-2">
            Paste your resume text here or upload a file to extract text.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="text-sm text-purple-100 flex-1 min-w-0"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null);
                setUploadError(null);
              }}
              disabled={isAnalyzing || isUploading}
            />
            <button
              type="button"
              onClick={handleUploadFile}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-glow disabled:opacity-60 flex items-center justify-center"
              disabled={!selectedFile || isUploading || isAnalyzing}
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract text"
              )}
            </button>
          </div>
          {selectedFile?.name && (
            <div
              className="text-xs text-purple-100 truncate max-w-full mb-2"
              title={selectedFile.name}
            >
              Selected file: {selectedFile.name}
            </div>
          )}
          {uploadError && (
            <div className="p-2 mb-3 text-red-300 bg-red-900/40 border border-red-500/60 rounded-lg text-xs font-medium">
              {uploadError}
            </div>
          )}
          <textarea
            className="w-full h-64 p-3 border border-purple-500/60 bg-purple-950/70 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 font-mono text-sm shadow-inner text-purple-50 placeholder-purple-300/70"
            placeholder="Start by pasting your full resume content (experience, education, skills, projects)..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              if (e.target.value.length > 50) setError(null);
            }}
            disabled={isAnalyzing}
          />
        </IconCard>

        {/* Goal and Action Card */}
        <IconCard
          icon={Search}
          title="Career Goal & Action"
          className="lg:col-span-1 flex flex-col justify-between"
        >
          <div className="flex-grow">
            <label
              htmlFor="career-goal"
              className="block text-md font-medium text-purple-50 mb-2"
            >
              Target Career Goal
            </label>
            <select
              id="career-goal"
              className="border border-purple-500/60 bg-purple-950/70 p-3 w-full rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-purple-50"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              disabled={isAnalyzing}
            >
              {careerGoals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>

            {careerGoal === "Other (custom)" && (
              <div className="mt-4">
                <label
                  htmlFor="custom-career-goal"
                  className="block text-sm font-medium text-purple-50 mb-1"
                >
                  Enter your own career goal
                </label>
                <input
                  id="custom-career-goal"
                  type="text"
                  className="w-full p-3 rounded-xl border border-purple-500/60 bg-purple-950/70 text-purple-50 placeholder-purple-300/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="e.g., AI Product Manager at Google"
                  value={customCareerGoal}
                  onChange={(e) => {
                    setCustomCareerGoal(e.target.value);
                    if (e.target.value.trim().length > 2) setError(null);
                  }}
                  disabled={isAnalyzing}
                />
              </div>
            )}

            <p className="text-sm text-purple-100 mt-4">
              The AI will benchmark your skills against this specific industry
              role.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-purple-500/40">
            {error && (
              <div className="p-3 mb-4 text-red-200 bg-red-900/40 border border-red-500/70 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            {isAnalyzing && (
              <div className="mb-3">
                <div className="h-2 bg-purple-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>
                <p className="text-xs text-purple-100 mt-2">
                  {analysisStatus || "Analyzing..."}
                </p>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 hover:from-cyan-300 hover:via-blue-400 hover:to-purple-400 transition-transform text-white font-bold px-6 py-3 rounded-2xl w-full shadow-glow disabled:opacity-50 flex items-center justify-center transform hover:scale-[1.02]"
              disabled={isAnalyzing || isUploading || resumeText.length < 50}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-5 h-5 mr-3 animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Analyze & Get Personalized Plan
                </>
              )}
            </button>
          </div>
        </IconCard>
      </div>
    </div>
  );
};

export default UploadPage;
