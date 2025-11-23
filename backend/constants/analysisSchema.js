module.exports = {
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
