export default async function handler(req, res) {
    // Zorg ervoor dat de juiste API-sleutel wordt gebruikt
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API-sleutel niet gevonden' });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt: req.body.thought || "Hello world!",
                max_tokens: 50
            })
        });
        const data = await response.json();
        res.status(200).json({ reframe: data.choices[0].text.trim() });
    } catch (error) {
        res.status(500).json({ error: 'Fout bij het ophalen van de herformulering' });
    }
}
