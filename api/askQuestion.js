// api/askQuestion.js
const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

// Configuratie van omgevingsvariabelen
dotenv.config();

const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

module.exports = async function (req, res) {
    const { question } = req.body;

    // Controleer of de vraag geldig is en stuur een foutmelding als er geen vraag is
    if (!question) {
        return res.status(400).json({ error: "Geen vraag ontvangen." });
    }

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: question }]
        });

        // Stuur het antwoord terug als JSON
        res.json({ answer: response.data.choices[0].message.content });
    } catch (error) {
        console.error("API Error in askQuestion:", error.response ? error.response.data : error.message);

        // Controleer het type fout en stuur een specifieke status terug
        if (error.response) {
            res.status(error.response.status).json({
                error: "Fout bij API-aanroep.",
                details: error.response.data
            });
        } else {
            res.status(500).json({ error: "Interne serverfout." });
        }
    }
};




