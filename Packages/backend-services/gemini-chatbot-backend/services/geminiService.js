const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
  }

  async generateResponse(userMessage, databaseContext = '', chatHistory = []) {
    const systemPrompt = `You are an intelligent AI assistant integrated with a knowledge database. 
    Use the following database information to provide accurate, helpful responses:

    DATABASE CONTEXT:
    ${databaseContext}

    USER MESSAGE: ${userMessage}`;

    const result = await this.model.generateContent(systemPrompt);
    return result.response.text();
  }
}

module.exports = new GeminiService();