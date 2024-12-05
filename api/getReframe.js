const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

dotenv.config(); // Laad je .env bestand met de API-sleutel

const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

module.exports = async function (req, res) {
    const { thought, feedback, comments } = req.body; // We halen ook feedback en comments op

    try {
        // Gedachten herformuleren via OpenAI
        const reframeResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: thought }]
        });

        // Vervolgadvies via OpenAI, afhankelijk van de feedback en comments
        const adviceResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Geef advies op basis van de feedback: ${feedback} en de opmerkingen: ${comments}` 
            }]
        });

        // Stuur het herformuleerde gedachte en advies als antwoord
        res.json({ 
            reframe: reframeResponse.data.choices[0].message.content, 
            advice: adviceResponse.data.choices[0].message.content 
        });
    } catch (error) {
        console.error("API Error in getReframe:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van de herformulering." });
    }
};




