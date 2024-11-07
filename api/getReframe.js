export default async function handler(req, res) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API-sleutel niet gevonden in omgevingsvariabele." });
    }

    const thought = req.body.thought;
    if (!thought) {
        return res.status(400).json({ error: "Geen gedachte ingevoerd om te herformuleren." });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: `Geef een positief alternatief voor de gedachte: "${thought}". Formuleer het op een bemoedigende manier.` }],
                max_tokens: 50
            })
        });

        const data = await response.json();

        if (response.ok) {
            const reframe = data.choices[0].message.content;
            res.status(200).json({ reframe });
        } else {
            console.error("Fout bij API-aanroep:", data);
            res.status(response.status).json({ error: data.error.message });
        }
    } catch (error) {
        console.error("API-aanroep fout:", error);
        res.status(500).json({ error: "Er is een fout opgetreden bij de API-aanroep." });
    }
}



