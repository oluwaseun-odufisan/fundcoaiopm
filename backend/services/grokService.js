// backend/services/grokService.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Grok query with content restriction
export const grokQuery = async (question, content) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a company training AI. Answer ONLY from the provided materials. If not in materials, say "Information not available in training materials.". Use markdown for responses.',
    },
    {
      role: 'user',
      content: `Materials: ${content}\n\nQuestion: ${question}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'grok-4',
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
};