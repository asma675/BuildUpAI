module.exports = {
  type: "OBJECT",
  properties: {
    courses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          provider: { type: "STRING" },
          link: { type: "STRING" },
          cost: { type: "STRING" },
          duration: { type: "STRING" },
          level: { type: "STRING" }
        },
        required: ["title", "provider", "link"]
      }
    },
    opportunities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          link: { type: "STRING" },
          difficulty: { type: "STRING" }
        },
        required: ["name", "link"]
      }
    }
  },
  required: ["courses", "opportunities"]
};
