import { useEffect, useState } from "react";
import { Award, Loader, Search, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconCard from "../components/IconCard";
import { fetchLearningResources } from "../services/api";

const RecommendationsPage = ({ analysisData }) => {
  const navigate = useNavigate();
  const [learning, setLearning] = useState(null);
  const [isFetchingCourses, setIsFetchingCourses] = useState(false);
  const [courseError, setCourseError] = useState(null);

  if (!analysisData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-lg text-red-300 mb-4">
          Analysis data is missing.
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-2 rounded-full text-white shadow-glow"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  const { recommendations, sources = [], careerGoal, missingSkills = [] } =
    analysisData;

  useEffect(() => {
    if (!careerGoal) return;
    setIsFetchingCourses(true);
    fetchLearningResources(careerGoal, missingSkills)
      .then((data) => {
        setLearning(data);
        setCourseError(null);
      })
      .catch((err) => setCourseError(err.message))
      .finally(() => setIsFetchingCourses(false));
  }, [careerGoal, JSON.stringify(missingSkills)]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-2">
        Personalized Action Plan
      </h2>
      <p className="text-lg text-purple-100 mb-8">
        Based on your skill gaps and target career.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Certifications Card */}
        <IconCard icon={Award} title="Top Certifications & Courses">
          <p className="text-purple-100 mb-3">
            Gain formal knowledge and credentials:
          </p>
          <ul className="space-y-4">
            {recommendations.certifications.map((cert, index) => (
              <li
                key={index}
                className="p-3 bg-yellow-900/40 rounded-lg border-l-4 border-yellow-400/80 text-yellow-100 font-medium"
              >
                {cert}
              </li>
            ))}
          </ul>
        </IconCard>

        {/* Opportunities Card */}
        <IconCard icon={Zap} title="Real-World Opportunities">
          <p className="text-purple-100 mb-3">
            Build a strong portfolio through hands-on experience:
          </p>
          <ul className="space-y-4">
            {recommendations.opportunities.map((opp, index) => (
              <li
                key={index}
                className="p-3 bg-blue-900/40 rounded-lg border-l-4 border-blue-400/80 text-blue-100 font-medium"
              >
                {opp}
              </li>
            ))}
          </ul>
        </IconCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <IconCard
          icon={Award}
          title="Live Course Picks (Gemini + Google Search)"
        >
          {isFetchingCourses ? (
            <div className="flex items-center text-sm text-purple-100">
              <Loader className="w-4 h-4 mr-2 animate-spin" /> Fetching real
              courses...
            </div>
          ) : courseError ? (
            <div className="text-sm text-red-300 bg-red-900/40 border border-red-500/60 rounded-lg p-2">
              {courseError}
            </div>
          ) : learning?.courses?.length ? (
            <ul className="space-y-3">
              {learning.courses.map((course, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-purple-950/60 border border-purple-500/60 rounded-lg shadow-sm"
                >
                  <div className="font-semibold text-purple-50">
                    {course.title}
                  </div>
                  <div className="text-xs text-purple-200">
                    {course.provider}
                  </div>
                  <div className="text-xs text-purple-300">
                    {course.duration || ""}{" "}
                    {course.cost ? `• ${course.cost}` : ""}
                  </div>
                  <a
                    className="text-xs text-cyan-300 underline"
                    href={course.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-purple-200">
              No live courses returned yet.
            </p>
          )}
        </IconCard>

        <IconCard icon={Zap} title="Live Opportunities">
          {isFetchingCourses ? (
            <div className="flex items-center text-sm text-purple-100">
              <Loader className="w-4 h-4 mr-2 animate-spin" /> Fetching
              opportunities...
            </div>
          ) : courseError ? (
            <div className="text-sm text-red-300 bg-red-900/40 border border-red-500/60 rounded-lg p-2">
              {courseError}
            </div>
          ) : learning?.opportunities?.length ? (
            <ul className="space-y-3">
              {learning.opportunities.map((opp, idx) => (
                <li
                  key={idx}
                  className="p-3 bg-purple-950/60 border border-purple-500/60 rounded-lg shadow-sm"
                >
                  <div className="font-semibold text-purple-50">
                    {opp.name}
                  </div>
                  <div className="text-xs text-purple-200">
                    {opp.description || ""}
                  </div>
                  <div className="text-xs text-purple-300">
                    {opp.difficulty || ""}
                  </div>
                  <a
                    className="text-xs text-cyan-300 underline"
                    href={opp.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-purple-200">
              No live opportunities returned yet.
            </p>
          )}
        </IconCard>
      </div>

      <IconCard icon={Search} title="AI Grounding Sources (Google Search)">
        <p className="text-sm text-purple-100 mb-3">
          The AI used the following current web sources to generate accurate
          advice:
        </p>
        <ul className="space-y-2">
          {sources.length > 0 ? (
            sources.map((source, index) => (
              <li
                key={index}
                className="text-xs text-cyan-300 hover:text-cyan-200 truncate"
              >
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.title}
                  className="underline"
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))
          ) : (
            <li className="text-xs text-purple-300">
              No direct web sources cited (information based on the model's
              general knowledge and structured response logic).
            </li>
          )}
        </ul>
      </IconCard>
    </div>
  );
};

export default RecommendationsPage;
