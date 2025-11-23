import React, { useState, useEffect, useCallback } from 'react';
import { Loader, UploadCloud, PieChart, Award, Search, Home, Zap } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, limit, orderBy } from 'firebase/firestore';

// --- Global Setup & Configuration ---

// App & Firebase config pulled from Vite environment variables
const appId = import.meta.env.VITE_APP_ID || 'careerlift-default-app';
const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG
  ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
  : {};
const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || null;

// --- Firebase Utilities ---

/**
 * Initializes Firebase, authenticates, and returns core services.
 */
const useFirebase = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is missing or empty. Set VITE_FIREBASE_CONFIG in your .env file.");
        setIsAuthReady(true);
        return;
      }
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authService = getAuth(app);

      setDb(firestore);
      setAuth(authService);

      const unsubscribe = onAuthStateChanged(authService, (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          const signInPromise = initialAuthToken
            ? signInWithCustomToken(authService, initialAuthToken)
            : signInAnonymously(authService);

          signInPromise
            .then((credential) => {
              setUserId(credential.user.uid);
              setIsAuthReady(true);
            })
            .catch((error) => {
              console.error("Firebase sign-in failed:", error);
              // Fallback userId if sign-in fails
              const fallbackId = crypto.randomUUID();
              setUserId(fallbackId);
              setIsAuthReady(true);
            });
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase:", e);
      setIsAuthReady(true);
      const fallbackId = crypto.randomUUID();
      setUserId(fallbackId);
    }
  }, []);

  return { db, auth, userId, isAuthReady };
};

/**
 * Fetches the latest analysis data from Firestore for the current user.
 */
const useAnalysisData = (db, userId, isAuthReady) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !userId || !isAuthReady) {
      return;
    }

    const analysisCollectionPath = `/artifacts/${appId}/users/${userId}/career_analyses`;
    const analysisQuery = query(
      collection(db, analysisCollectionPath),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      analysisQuery,
      (snapshot) => {
        setIsLoading(false);
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0].data();
          setAnalysis(latestDoc);
        } else {
          setAnalysis(null);
        }
      },
      (error) => {
        console.error("Error fetching analysis data:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, isAuthReady]);

  return { analysis, isLoading };
};

// --- Gemini API Call and Persistence Logic (via backend) ---

const analyzeResumeWithGemini = async (db, userId, resumeText, careerGoal) => {
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, careerGoal })
      });

      if (!response.ok) {
        throw new Error(`Backend API call failed with status: ${response.status}`);
      }

      const analysisWithMetadata = await response.json();

      // Persist result to Firestore
      if (db && userId) {
        const docRef = doc(collection(db, `/artifacts/${appId}/users/${userId}/career_analyses`));
        await setDoc(docRef, analysisWithMetadata);
      }

      return analysisWithMetadata;
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to analyze resume after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
};

const uploadResumeFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-resume', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Upload failed (${response.status}): ${message}`);
  }

  const result = await response.json();
  if (!result.extractedText) {
    throw new Error('Resume text was empty in the upload response.');
  }

  return result;
};

// --- Component Helpers ---

const IconCard = ({ icon: Icon, title, children, className = "" }) => (
  <div className={`p-5 bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
    <div className="flex items-center text-blue-600 mb-3">
      <Icon className="w-6 h-6 mr-3" />
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

// --- Page Components (Single-File Navigation) ---

const LandingPage = ({ setCurrentPage }) => (
  <div className="p-8 md:p-12 text-center bg-white m-4 md:m-8 rounded-2xl shadow-xl">
    <Zap className="w-16 h-16 text-blue-600 mx-auto mb-6 animate-pulse" />
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">CareerLift AI</h1>
    <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
      Unlock your potential with personalized career growth plans. Analyze your resume against industry standards, powered by Gemini AI and real-time Google grounding.
    </p>
    <p className="text-sm mt-6 text-gray-500">Supporting UN SDG 4 (Quality Education), 8 (Decent Work), and 10 (Reduced Inequalities).</p>
    <button
      onClick={() => setCurrentPage('upload')}
      className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold px-8 py-3 rounded-full shadow-lg transform hover:scale-105"
    >
      Start Your Analysis
    </button>
  </div>
);

const UploadPage = ({ setCurrentPage, setAnalysisData, db, userId }) => {
  const [resumeText, setResumeText] = useState('');
  const [careerGoal, setCareerGoal] = useState('Software Engineer (Full-Stack)');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const careerGoals = [
    'Software Engineer (Full-Stack)',
    'Cybersecurity Analyst',
    'Data Scientist',
    'UX/UI Designer',
    'Financial Analyst',
    'Marketing Manager (Digital)',
    'Mechanical Engineer',
  ];

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setUploadError('Please choose a file first.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const { extractedText } = await uploadResumeFile(selectedFile);
      setResumeText(extractedText);
      setError(null);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (resumeText.length < 50) {
      setError("Please paste a more complete resume (at least 50 characters) to get an accurate analysis.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeResumeWithGemini(db, userId, resumeText, careerGoal);
      setAnalysisData(result);
      setCurrentPage('dashboard');
    } catch (e) {
      console.error(e);
      setError(`Analysis failed. Please try again. Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Analyze Your Career Path</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Card */}
        <IconCard icon={UploadCloud} title="Resume Content" className="lg:col-span-1">
          <p className="text-sm text-gray-500 mb-2">Paste your resume text here (PDF upload simulated).</p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="text-sm text-gray-700 flex-1 min-w-0"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null);
                setUploadError(null);
              }}
              disabled={isAnalyzing || isUploading}
            />
            <button
              type="button"
              onClick={handleUploadFile}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg shadow disabled:opacity-60 flex items-center justify-center"
              disabled={!selectedFile || isUploading || isAnalyzing}
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract text'
              )}
            </button>
          </div>
          {selectedFile?.name && (
            <div
              className="text-xs text-gray-500 truncate max-w-full mb-2"
              title={selectedFile.name}
            >
              Selected file: {selectedFile.name}
            </div>
          )}
          {uploadError && (
            <div className="p-2 mb-3 text-red-700 bg-red-100 border border-red-200 rounded-lg text-xs font-medium">
              {uploadError}
            </div>
          )}
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm shadow-inner"
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
        <IconCard icon={Search} title="Career Goal & Action" className="lg:col-span-1 flex flex-col justify-between">
          <div className="flex-grow">
            <label htmlFor="career-goal" className="block text-md font-medium text-gray-700 mb-2">
              Target Career Goal
            </label>
            <select
              id="career-goal"
              className="border p-3 w-full rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow"
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

            <p className="text-sm text-gray-500 mt-4">
              The AI will benchmark your skills against this specific industry role.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            {error && (
              <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <button
              onClick={handleAnalyze}
              className="bg-green-600 hover:bg-green-700 transition-colors text-white font-bold px-6 py-3 rounded-xl w-full shadow-md disabled:opacity-50 flex items-center justify-center transform hover:scale-[1.01]"
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
                  Analyze &amp; Get Personalized Plan
                </>
              )}
            </button>
          </div>
        </IconCard>
      </div>
    </div>
  );
};

const DashboardPage = ({ setCurrentPage, analysisData, isAuthReady, isLoading }) => {
  if (!isAuthReady || isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Loading analysis data...</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">No Analysis Found</h2>
        <p className="text-lg text-gray-600 mb-6">It looks like you haven't completed an analysis yet.</p>
        <button
          onClick={() => setCurrentPage('upload')}
          className="inline-block bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold px-6 py-3 rounded-full shadow-md"
        >
          Start a New Analysis
        </button>
      </div>
    );
  }

  const { resumeScore, missingSkills, summary, careerGoal } = analysisData;
  const scoreColor =
    resumeScore >= 80 ? 'text-green-600' : resumeScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Your Career Report</h2>
      <p className="text-lg text-gray-600 mb-8">
        Analysis for target role: <span className="font-semibold text-blue-600">{careerGoal}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Resume Score Card */}
        <IconCard icon={PieChart} title="Resume Score" className="md:col-span-1 text-center">
          <div className={`text-6xl font-bold ${scoreColor} my-3`}>{resumeScore}%</div>
          <p className="text-sm text-gray-500">Benchmark against current market needs.</p>
        </IconCard>

        {/* Summary Card */}
        <IconCard icon={Award} title="AI Summary" className="md:col-span-2">
          <p className="text-gray-700 leading-relaxed italic border-l-4 border-blue-200 pl-4 py-1">
            {summary}
          </p>
        </IconCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Skills Card */}
        <IconCard icon={Search} title="Crucial Missing Skills">
          <p className="text-gray-600 mb-3">
            Focus on mastering these high-demand areas to bridge your gap:
          </p>
          <ul className="space-y-3">
            {missingSkills.map((skill, index) => (
              <li
                key={index}
                className="flex items-center p-3 bg-red-50 rounded-lg text-red-700 font-medium"
              >
                <span className="text-red-400 mr-3">•</span> {skill}
              </li>
            ))}
          </ul>
        </IconCard>

        {/* Action Button */}
        <IconCard icon={Zap} title="Next Steps">
          <p className="text-gray-600 mb-4">
            You have a clear path forward. Dive into the detailed plan to start leveling up your profile today.
          </p>
          <button
            onClick={() => setCurrentPage('recommendations')}
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold px-6 py-3 rounded-xl w-full shadow-lg transform hover:scale-[1.01]"
          >
            View Personalized Recommendations →
          </button>
        </IconCard>
      </div>
    </div>
  );
};

const RecommendationsPage = ({ analysisData, setCurrentPage }) => {
  if (!analysisData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-lg text-red-500 mb-4">Analysis data is missing.</p>
        <button
          onClick={() => setCurrentPage('upload')}
          className="inline-block bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold px-6 py-3 rounded-full shadow-md"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  const { recommendations, sources = [] } = analysisData;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">Personalized Action Plan</h2>
      <p className="text-lg text-gray-600 mb-8">Based on your skill gaps and target career.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Certifications Card */}
        <IconCard icon={Award} title="Top Certifications & Courses">
          <p className="text-gray-600 mb-3">Gain formal knowledge and credentials:</p>
          <ul className="space-y-4">
            {recommendations.certifications.map((cert, index) => (
              <li
                key={index}
                className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400 text-gray-800 font-medium"
              >
                {cert}
              </li>
            ))}
          </ul>
        </IconCard>

        {/* Opportunities Card */}
        <IconCard icon={Zap} title="Real-World Opportunities">
          <p className="text-gray-600 mb-3">Build a strong portfolio through hands-on experience:</p>
          <ul className="space-y-4">
            {recommendations.opportunities.map((opp, index) => (
              <li
                key={index}
                className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 text-gray-800 font-medium"
              >
                {opp}
              </li>
            ))}
          </ul>
        </IconCard>
      </div>

      <IconCard icon={Search} title="AI Grounding Sources (Google Search)">
        <p className="text-sm text-gray-600 mb-3">
          The AI used the following current web sources to generate accurate advice:
        </p>
        <ul className="space-y-2">
          {sources.length > 0 ? (
            sources.map((source, index) => (
              <li
                key={index}
                className="text-xs text-blue-700 hover:text-blue-900 truncate"
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
            <li className="text-xs text-gray-500">
              No direct web sources cited (information based on the model&apos;s general knowledge and
              structured response logic).
            </li>
          )}
        </ul>
      </IconCard>
    </div>
  );
};

// --- Main Application Component ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [analysisData, setAnalysisData] = useState(null);

  // Firebase Hook
  const { db, userId, isAuthReady } = useFirebase();
  const { analysis: latestAnalysis, isLoading: isLoadingAnalysis } = useAnalysisData(
    db,
    userId,
    isAuthReady
  );

  // Set the latest loaded analysis data once Firebase is ready
  useEffect(() => {
    if (isAuthReady && latestAnalysis) {
      setAnalysisData(latestAnalysis);
    }
  }, [isAuthReady, latestAnalysis]);

  const renderPage = useCallback(() => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage setCurrentPage={setCurrentPage} />;
      case 'upload':
        return (
          <UploadPage
            setCurrentPage={setCurrentPage}
            setAnalysisData={setAnalysisData}
            db={db}
            userId={userId}
          />
        );
      case 'dashboard':
        return (
          <DashboardPage
            setCurrentPage={setCurrentPage}
            analysisData={analysisData}
            isAuthReady={isAuthReady}
            isLoading={isLoadingAnalysis}
          />
        );
      case 'recommendations':
        return (
          <RecommendationsPage
            setCurrentPage={setCurrentPage}
            analysisData={analysisData}
          />
        );
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  }, [currentPage, analysisData, db, userId, isAuthReady, isLoadingAnalysis]);

  const navItems = [
    { name: 'Home', page: 'landing', icon: Home },
    { name: 'Analyze', page: 'upload', icon: UploadCloud },
    { name: 'Report', page: 'dashboard', icon: PieChart },
  ];

  return (
    <>
      {/* Tailwind CSS CDN and viewport meta are loaded in index.html */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        {/* Header and Navigation */}
        <header className="bg-blue-700 shadow-xl z-10 sticky top-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
            <div className="text-white text-2xl font-extrabold flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-300" />
              CareerLift AI
            </div>

            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    currentPage === item.page
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* User ID Display (for multi-user persistence) */}
        <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-b border-gray-200">
          User ID (for persistence):{' '}
          <span className="font-mono text-gray-700 break-all">
            {userId || 'Authenticating...'}
          </span>
        </div>

        {/* Main Content Area */}
        <main className="flex-grow p-4 md:p-6">{renderPage()}</main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white p-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CareerLift AI. Powered by Gemini &amp; Firebase.</p>
        </footer>
      </div>
    </>
  );
}
