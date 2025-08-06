import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "mistral/mistral-7b-instruct";

export async function generateQuestionWithOpenRouter(topic) {
  const prompt = `Create a multiple-choice quiz question about ${topic}. Respond in JSON format with keys: text, options (list of 4), and correct_index (0-3).`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "H2OWISE Water Quiz"
      }
    }
  );

  return response.data.choices[0].message.content;
}
