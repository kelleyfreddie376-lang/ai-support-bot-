const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function askGemini(prompt) {
    const models = [
        "gemini-3.7-flash",
        "gemini-3.6-flash"
    ];

    let lastError;

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt
            });

            return response.text;
        } catch (error) {
            lastError = error;

            console.log(
                `⚠️ Gemini model ${model} failed (${error.status || "unknown"}). Trying another model...`
            );
        }
    }

    throw lastError;
}

module.exports = {
    askGemini
};