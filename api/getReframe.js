export default async function handler(req, res) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("API-sleutel niet gevonden");  // Debugging: Log als de sleutel niet is ingesteld
        return res.status(500).json({ error: 'API-sleutel niet gevonden' });
    }

    console.log("API-sleutel gevonden:", apiKey);  // Debugging: Log de sleutel om te bevestigen dat deze wordt opgehaald

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
        
        if (!response.ok) {
            throw new Error(`Fout bij API-aanroep: ${response.status}`);
        }
        
        const data = await response.json();
        res.status(200).json({ reframe: data.choices[0].text.trim() });
    } catch (error) {
        console.error("API call error:", error);
        res.status(500).json({ error: 'Fout bij het ophalen van de herformulering' });
    }
}

