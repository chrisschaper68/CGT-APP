const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

module.exports = async (req, res) => {
    const { thought, feedback, comments } = req.body;

    try {
        const reframeResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: thought }]
        });

        const adviceResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 
                role: "user", 
                content: `Geef advies op basis van de feedback: ${feedback} en de opmerkingen: ${comments}` 
            }]
        });

        res.json({ 
            reframe: reframeResponse.data.choices[0].message.content, 
            advice: adviceResponse.data.choices[0].message.content 
        });
    } catch (error) {
        console.error("API Error in getReframe:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Er is een fout opgetreden bij het ophalen van de herformulering." });
    }
};





