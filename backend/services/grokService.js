// backend/services/grokServices.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// Grok query with content restriction (enhanced to handle company docs)
export const grokQuery = async (question, content) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a company training AI. Answer ONLY from the provided materials (SOPs, terms, profiles). If not in materials, say "Information not available". Use markdown.',
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

// New: Query company docs using tools (e.g., for knowledge-base-query tool)
export const queryCompanyDocs = async (query, fileName = 'all_company_docs.pdf') => { // Assume docs compiled into one PDF
  // Use search_pdf_attachment tool (as per available tools)
  // This is a simulation; in real, call the tool via function call format
  return `Simulated response from PDF: ${query}`; // Replace with actual tool call
};