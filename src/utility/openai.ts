// src/utility/openai.ts
import Constants from 'expo-constants';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Constants.expoConfig?.extra?.OPENAI_API_KEY || "";
export const generateCourseContent = async (
  topic: string,
  length: string = "short",
  language: string = "en"
) => {
  try {
    const courseSize = {
      short: {
        lessons: 4,
        content: { from: 3, to: 4 },
        questions: { from: 1, to: 2 },
      },
      medium: {
        lessons: 6,
        content: { from: 4, to: 6 },
        questions: { from: 2, to: 4 },
      },
      long: {
        lessons: 10,
        content: { from: 6, to: 8 },
        questions: { from: 3, to: 6 },
      },
    };

    const size = courseSize[length] ?? courseSize.short;

    const prompt = `
You are an expert course designer who creates native, language-specific educational content.

IMPORTANT: You are NOT allowed to just translate English content.
Think, write, and design the entire course **natively in ${language}** as if it were originally written by a native speaker.
Use examples, phrases, and explanations that feel natural for ${language}-speaking learners.

1. Generate a short, catchy, and properly formatted course title based on the given topic:
- Max 4 words
- Sounds like a real-world course title in ${language}
- No filler words
- Progress values must all be 0

2. Then create a ${size.lessons}-lesson course on the topic "${topic}" in ${language} using this JSON structure:
{
  "title": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "description": string,
      "duration": string,
      "content": [
        { "subtitle": string, "explain": string }
      ],
      "progress": number,
      "quiz": {
        "questions": [
          {
            "question": string,
            "options": string[],
            "answer": string
          }
        ]
      }
    }
  ]
}

3. STRICT REQUIREMENTS:
- Entire response MUST be written natively in ${language}
- Use culturally appropriate examples
- Each lesson must have ${size.content.from}–${size.content.to} content sections
- Each "explain" must be 4–6 sentences
- Each lesson must have ${size.questions.from}–${size.questions.to} quiz questions
- All progress values must be 0
Topic: ${topic}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are an expert course designer. Return ONLY valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || "{}");
  } catch (error) {
    console.log("OpenAI Error:", error);
    throw error;
  }
};
