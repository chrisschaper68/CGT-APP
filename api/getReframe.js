export default async function handler(req, res) {
    // Controleer of de API-sleutel beschikbaar is
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("API-sleutel niet gevonden");  // Log de foutmelding
        return res.status(500).json({ error: 'API-sleutel niet gevonden' });
    }

    console.log("API-sleutel gevonden:", apiKey);  // Voeg deze log toe om te bevestigen dat de sleutel is geladen

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
        console.error("API call error:", error);  // Log foutmelding van de API-aanroep
        res.status(500).json({ error: 'Fout bij het ophalen van de herformulering' });
    }
}
