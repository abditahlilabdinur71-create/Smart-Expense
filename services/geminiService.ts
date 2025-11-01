import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SummaryData, Budget } from '../types';
import { DEFAULT_CATEGORIES, GEMINI_MODEL_TEXT } from '../constants';

const getGeminiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const categorizeTransaction = async (description: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const prompt = `Categorize the following transaction description into one of these categories: ${DEFAULT_CATEGORIES.join(', ')}. If none fit well, use 'Others'. Respond with only the category name. Description: "${description}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'The determined category for the transaction.',
            },
          },
          propertyOrdering: ["category"],
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result.category || 'Others';
  } catch (error) {
    console.error('Error categorizing transaction with Gemini:', error);
    // Fallback to 'Others' or a default if API call fails
    return 'Others';
  }
};

export const getSpendingInsights = async (summary: SummaryData, budgets: Budget[], currencyCode: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const budgetInfo = budgets.map(b => `${b.category}: ${currencyCode} ${b.amount}`).join(', ') || 'No budgets set.';
    const categoryBreakdown = summary.categoryBreakdown.map(cb => `${cb.category}: ${currencyCode} ${cb.amount}`).join(', ');

    const prompt = `You are Smart Expense, an intelligent personal finance assistant.
    Analyze the following financial summary and provide helpful insights and suggestions to save money.
    Respond in a friendly, helpful tone.

    Summary:
    Total Income: ${currencyCode} ${summary.totalIncome.toFixed(2)}
    Total Expenses: ${currencyCode} ${summary.totalExpense.toFixed(2)}
    Net Savings: ${currencyCode} ${summary.netSavings.toFixed(2)}

    Spending Breakdown by Category:
    ${categoryBreakdown}

    Budgets:
    ${budgetInfo}

    Based on this, what are the key spending patterns? Suggest actionable ways to save money, particularly highlighting areas where spending is high or near budget limits.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error getting spending insights with Gemini:', error);
    return 'Could not retrieve spending insights at this time. Please try again later.';
  }
};