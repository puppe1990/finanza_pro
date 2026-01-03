
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: any[]) => {
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
