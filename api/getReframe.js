export default async function handler(req, res) {
    // API-sleutel van OpenAI
    const apiKey = "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";

    // Controleer of er een gedachte is om te herformuleren
    const thought = req.body.thought;
    if (!thought) {
        return res.status(400).json({ error: "Geen gedachte ingevoerd om te herformuleren." });
    }

    try {
        // Verstuur de API-aanvraag naar OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: `Herformuleer deze gedachte: ${thought}` }],
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

