
import { GoogleGenAI } from "@google/genai";

const env = import.meta.env as Record<string, string | undefined>;
const apiKey =
  env.VITE_GEMINI_API_KEY ||
  env.VITE_API_KEY ||
  (typeof process !== 'undefined'
    ? process.env.GEMINI_API_KEY || process.env.API_KEY
    : undefined);

let client: GoogleGenAI | null = null;

export const isGeminiConfigured = () => Boolean(apiKey);

const getClient = () => {
  if (!apiKey) return null;
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const getFinancialInsights = async (transactions: any[]) => {
  const ai = getClient();
  if (!ai) {
    return "Configure o GEMINI_API_KEY no arquivo .env.local para ativar o consultor IA.";
  }

  try {
    const summary = JSON.stringify(transactions.slice(0, 50)); // Send a sample to save tokens
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes dados financeiros (JSON) e forneça 3 dicas práticas em português para melhorar a saúde financeira: ${summary}`,
      config: {
        systemInstruction: "Você é um consultor financeiro sênior especializado em economia doméstica e pequenos negócios.",
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Desculpe, não consegui analisar seus dados no momento. Tente novamente mais tarde.";
  }
};
