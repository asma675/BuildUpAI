const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. The /api/analyze endpoint will fail until you add it to your .env file.');
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Define the structured JSON schema for the AI output
const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    "resumeScore": { "type": "INTEGER", "description": "The resume score out of 100, focusing on the career goal." },
    "missingSkills": {
      "type": "ARRAY",
      "items": { "type": "STRING" },
      "description": "3 crucial skills missing for the target role, grounded in current industry needs."
    },
    "recommendations": {
      "type": "OBJECT",
      "properties": {
        "certifications": {
          "type": "ARRAY",
          "items": { "type": "STRING" },
          "description": "3 highly relevant certifications or courses (e.g., Coursera, AWS, Google) to bridge the skill gap."
        },
        "opportunities": {
          "type": "ARRAY",
          "items": { "type": "STRING" },
          "description": "3 real-world opportunities (e.g., hackathons, open-source projects, specialized internships) to gain experience."
        }
      }
    },
    "summary": { "type": "STRING", "description": "A concise, 3-sentence summary of the resume's strengths and weaknesses against the career goal." }
  },
  required: ["resumeScore", "missingSkills", "recommendations", "summary"]
};

app.post('/api/analyze', async (req, res) => {
  try {
    const { resumeText, careerGoal } = req.body || {};

    if (!resumeText || !careerGoal) {
      return res.status(400).json({ error: 'resumeText and careerGoal are required.' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are a world-class AI Career Coach named CareerLift AI. Your task is to analyze a student's resume against their specified career goal. You must generate a score (out of 100), identify 3 crucial missing skills, and suggest 3 real-world opportunities and 3 certifications, all based on current industry standards and the user's career goal. Use Google Search to ensure your advice is grounded in current, relevant data. Respond ONLY with a valid JSON object matching the provided schema.`;

    const truncatedResume = resumeText.substring(0, 5000);

    const userQuery = `Analyze the following resume content for the career goal: "${careerGoal}". Resume content: "${truncatedResume}".`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const result = response.data;
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Gemini response was empty or malformed:', JSON.stringify(result, null, 2));
      return res.status(500).json({ error: 'Gemini response was empty or malformed.' });
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON text:', text);
      return res.status(500).json({ error: 'Failed to parse Gemini JSON response.' });
    }

    // Extract grounding sources
    let sources = [];
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingAttributions) {
      sources = groundingMetadata.groundingAttributions
        .map((attr) => ({
          uri: attr.web?.uri,
          title: attr.web?.title
        }))
        .filter((source) => source.uri && source.title);
    }

    const analysisWithMetadata = {
      ...analysisResult,
      timestamp: new Date().toISOString(),
      careerGoal,
      sources
    };

    return res.json(analysisWithMetadata);
  } catch (error) {
    console.error('Error in /api/analyze:', error?.response?.data || error.message || error);
    return res.status(500).json({
      error: 'Failed to analyze resume with Gemini.',
      details: error?.response?.data || error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('CareerLift AI backend is running.');
});

app.listen(PORT, () => {
  console.log(`CareerLift AI backend listening on port ${PORT}`);
});