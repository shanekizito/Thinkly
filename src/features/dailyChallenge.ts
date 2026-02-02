// This module generates a personalized daily challenge for the user based on their courses and topics of interest.
import { auth, db } from '@services/firebaseConfig';
import Constants from 'expo-constants';
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Constants.expoConfig?.extra?.OPENAI_API_KEY || "";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type Challenge = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  reward: number;
  completed: boolean;
  topic: string;
};

export const generatePersonalizedChallenge = async (): Promise<Challenge> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  // 1. Get user's active courses
  const coursesSnap = await db.collection('courses')
    .where('userId', '==', user.uid)
    .get();
  const userTopics = coursesSnap.docs.flatMap(doc =>
    doc.data().title
  );
  console.log("User topics:", userTopics);
  if (userTopics.length === 0) {
    return getFallbackChallenge(); // Default challenge if no courses
  }

  // 2. Select random topic
  const randomTopic = userTopics[Math.floor(Math.random() * userTopics.length)];

  // 3. Generate challenge with GPT
  try {
    const prompt = `
      Create 1 multiple-choice quiz question about "${randomTopic}" with:
      - 4 plausible options
      - 1 correct answer
      - Difficulty: beginner
      - Format: 
        {
          "question": string,
          "options": string[],
          "answer": string,
          "topic": "${randomTopic}"
        }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      id: `${user.uid}_${new Date().toISOString().split('T')[0]}`,
      question: content.question,
      options: content.options,
      answer: content.answer,
      reward: calculateReward(content.topic),
      completed: false,
      topic: content.topic
    };
  } catch (error) {
    console.log("AI challenge generation failed:", error);
    return getFallbackChallenge();
  }
};

// Helper functions
const calculateReward = (topic: string) => {
  // More XP for complex topics
  const complexity = topic.split(' ').length > 2 ? 75 : 50;
  return complexity;
};

const getFallbackChallenge = (): Challenge => ({
  id: 'fallback',
  question: "What is the capital of France?",
  options: ["London", "Paris", "Berlin", "Madrid"],
  answer: "Paris",
  reward: 30,
  completed: false,
  topic: "General Knowledge"
});