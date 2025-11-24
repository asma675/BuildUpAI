import { useEffect, useState } from "react";
import { Award, Loader, PieChart, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconCard from "../components/IconCard";
import { fetchJobMatches } from "../services/api";

const JobMatchPage = ({ analysisData }) => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const skills = analysisData?.missingSkills || [];
  const jobTitle = analysisData?.careerGoal || "";

  const loadJobs = async (loc) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchJobMatches({
        skills,
        location: loc || location,
        jobTitle,
      });
      setJobs(result.jobs || []);
    } catch (e) {
      setError(e.message);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobTitle) {
      loadJobs(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTitle, JSON.stringify(skills)]);

  if (!analysisData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-lg text-red-500 mb-4">Analysis data is missing.</p>
        <button
          onClick={() => navigate("/upload")}
          className="inline-block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-bold px-6 py-3 rounded-full shadow-glow"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(120,200,255,0.5)]">
            Job Matches
          </h2>
          <p className="text-purple-100/80">
            Tailored to: <span className="font-semibold text-cyan-200">{jobTitle}</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/recommendations")}
          className="text-sm text-cyan-200 hover:text-white underline"
        >
          Back to Plan
        </button>
      </div>

      <IconCard icon={Search} title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-purple-200/80">Preferred Location (optional)</label>
            <input
              className="w-full mt-1 rounded-lg border border-purple-500/40 bg-purple-900/30 text-purple-50 p-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Toronto, Remote"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => loadJobs(location)}
              className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-semibold px-4 py-2 rounded-lg shadow-glow disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? "Searching…" : "Find Jobs"}
            </button>
          </div>
        </div>
        <p className="text-xs text-purple-200/80 mt-2">
          Using your missing skills and target role to find relevant openings.
        </p>
      </IconCard>

      <div className="mt-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-red-400/50 bg-red-900/30 text-red-100 text-sm">
            {error}
          </div>
        )}
        {isLoading ? (
          <IconCard icon={Loader} title="Loading jobs...">
            <div className="h-2 bg-purple-800/40 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 animate-pulse" style={{ width: "100%" }}></div>
            </div>
          </IconCard>
        ) : jobs.length ? (
          jobs.map((job, idx) => (
            <IconCard key={idx} icon={PieChart} title={`${job.job_title || "Role"} @ ${job.company || "Company"}`}>
              <div className="text-purple-100/80 text-sm">
                <p><span className="text-cyan-200 font-semibold">Location:</span> {job.location || "N/A"}</p>
                <p><span className="text-cyan-200 font-semibold">Skills:</span> {job.skills || "N/A"}</p>
                <p><span className="text-cyan-200 font-semibold">Qualifications:</span> {job.qualifications || "N/A"}</p>
                <p><span className="text-cyan-200 font-semibold">Salary:</span> {job.salary_range || "N/A"}</p>
                <p><span className="text-cyan-200 font-semibold">Work Type:</span> {job.work_type || "N/A"}</p>
              </div>
            </IconCard>
          ))
        ) : (
          <IconCard icon={Award} title="No jobs found">
            <p className="text-purple-100/80 text-sm">
              We couldn't find matches right now. Try adjusting the location or check back later.
            </p>
          </IconCard>
        )}
      </div>
    </div>
  );
};

export default JobMatchPage;
