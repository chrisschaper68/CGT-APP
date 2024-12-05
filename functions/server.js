const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer'); // Nodemailer voor e-mail
const getReframe = require('./api/getReframe'); // API voor gedachtenherformulering
const askQuestion = require('./api/askQuestion'); // API voor vraagmodule
const admin = require('firebase-admin'); // Firebase Admin SDK
const cors = require('cors'); // CORS middleware om verzoeken van andere domeinen toe te staan
const axios = require('axios'); // Voor de OpenAI API-aanroepen

// Initialiseer Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://mentalegezondheidapp.firebaseio.com" // Vervang dit met jouw URL
});

const app = express();
const PORT = 5000; // Poort direct instellen zonder .env bestand

// Gebruik CORS om verzoeken van andere domeinen toe te staan
app.use(cors());

// Gebruik body-parser om JSON-gegevens te verwerken
app.use(bodyParser.json());

// Stel de static map in, zodat je statische bestanden kunt bedienen
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'dist')));


// Route voor de hoofdpagina (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Nodemailer transporter configuratie
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Zorg dat dit in je .env staat
        pass: process.env.EMAIL_PASSWORD // Gebruik een app-specifiek wachtwoord
    }
});

// Gebruik de getReframe module voor de herformulering van gedachten
app.post('/api/getReframe', getReframe);

// Vraag module via AI
app.post('/api/getAnswer', askQuestion);
// Slaapdagboek API
// Slaapdagboek opslaan
app.post('/api/sleep-journal', async (req, res) => {
    const {
        userId,
        date,
        bedtime,
        wakeTime,
        sleepLatency,
        stayInBed,
        nightWakings,
        overallRating,
        napDuration,
        alcoholAmount,
        alcoholTime,
        caffeineAmount,
        caffeineTime,
        sleepMedicationAmount,
        sleepMedicationTime,
        sleepMedicationName
    } = req.body;

    if (!userId || !date || !bedtime || !wakeTime) {
        return res.status(400).json({ message: "Vul alle verplichte velden in." });
    }

    try {
        const sleepJournalRef = admin.firestore().collection("users").doc(userId).collection("sleep-journal");

        await sleepJournalRef.add({
            date,
            bedtime,
            wakeTime,
            sleepLatency,
            stayInBed,
            nightWakings,
            overallRating,
            napDuration,
            alcoholAmount,
            alcoholTime,
            caffeineAmount,
            caffeineTime,
            sleepMedicationAmount,
            sleepMedicationTime,
            sleepMedicationName,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Slaapgegevens succesvol opgeslagen!" });
    } catch (error) {
        console.error("Fout bij opslaan slaapgegevens:", error);
        res.status(500).json({ message: "Er is een fout opgetreden." });
    }
});

app.get('/api/get-sleep-data', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: "Gebruikers-ID is vereist." });
    }

    try {
        const sleepJournalRef = admin.firestore().collection("users").doc(userId).collection("sleep-journal");
        const snapshot = await sleepJournalRef.orderBy("timestamp", "desc").get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "Geen slaapgegevens gevonden." });
        }

        const sleepData = snapshot.docs.map(doc => doc.data());
        res.status(200).json(sleepData);
    } catch (error) {
        console.error("Fout bij ophalen slaapgegevens:", error);
        res.status(500).json({ message: "Er is een fout opgetreden." });
    }
});


// Voeg een nieuwe route toe voor AI-advies
app.post('/api/getAIAdvice', async (req, res) => {
    const { progress, moods, thoughts } = req.body;
    const toolsList = [
        {
            name: "Positieve Gewoonten Versterken",
            url: "https://burnoutcoach.nu/wp-content/uploads/2024/11/Mindfulness-meditatie-voor-positieve-energie-‐-Gemaakt-met-Clipchamp.mp4",
            description: "Bekijk deze mindfulness video om je positieve energie verder te versterken."
        },
        {
            name: "Ademhalingsoefeningen",
            url: "#start-breathing-exercise",
            description: "Probeer de 4-7-8 ademhalingsoefening voor ontspanning."
        },
        {
            name: "Zelfzorg Oefeningen",
            url: "https://www.stressverlichting.com",
            description: "Leer eenvoudige technieken om je stress te verminderen."
        },
        {
            name: "Zelfcompassie Oefeningen",
            url: "https://self-compassion-tools.com",
            description: "Probeer zelfcompassie oefeningen om je negatieve gedachten om te buigen."
        },
        {
            name: "Stressverlichtingstools",
            url: "https://mindfulnessvideos.com",
            description: "Bekijk deze video's voor een rustige, stressverlichtende ervaring."
        }
    ];

    // Debugging: Log de ontvangen gegevens van de frontend
    console.log("Ontvangen gegevens van frontend:", { progress, moods, thoughts });

    // Controleer of de ontvangen gegevens geldig zijn
    if (!progress || !moods || !thoughts) {
        return res.status(400).json({ message: "Vereiste gegevens ontbreken. Zorg dat progress, moods en thoughts zijn ingevuld." });
    }

    try {
        // Beperk de hoeveelheid data die naar OpenAI wordt gestuurd
        const recentProgress = progress.slice(-10); // Laatste 10 items
        const recentMoods = moods.slice(-10); // Laatste 10 items
        const recentThoughts = thoughts.slice(-10); // Laatste 10 items

        // Debugging: Log de beperkte gegevens
        console.log("OpenAI-aanroep gestart met beperkte gegevens:", {
            recentProgress,
            recentMoods,
            recentThoughts
        });

        // OpenAI API-aanroep
        const OPENAI_API_KEY = "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";
        const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

        const aiResponse = await axios.post(OPENAI_API_URL, {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Je bent een coach voor mentale gezondheid. Geef advies op basis van de gebruiker zijn/haar gegevens."
                },
                {
                    role: "user",
                    content: `Op basis van de volgende gegevens, geef specifiek advies en eventueel hulpmiddelen voor iemand die worstelt met mentale gezondheid:
                        Laatste progress: ${JSON.stringify(recentProgress)},
                        Laatste moods: ${JSON.stringify(recentMoods)},
                        Laatste thoughts: ${JSON.stringify(recentThoughts)}`
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // Debugging: Log het antwoord van OpenAI
        console.log("OpenAI-response ontvangen:", aiResponse.data);

        // Verwerk de respons van OpenAI
        const aiAdvice = aiResponse.data.choices[0]?.message?.content?.trim();
        if (!aiAdvice) {
            throw new Error("Geen advies ontvangen van OpenAI.");
        }

        // Stuur het advies en de hulpmiddelen terug
        res.json({ advice: aiAdvice, tools: toolsList });

    } catch (error) {
        // Debugging: Log de foutdetails
        console.error("Fout bij het aanroepen van de OpenAI API:", error.response?.data || error.message);

        // Stuur een duidelijke foutmelding terug naar de frontend
        res.status(500).json({
            message: "Er is een fout opgetreden bij het ophalen van AI-advies.",
            error: error.response?.data || error.message
        });
    }
});


// Voeg een nieuwe route toe voor het versturen van een e-mail met Firebase-data
app.post('/api/sendReminderWithDetails', async (req, res) => {
    const { email, userId } = req.body;

    if (!email || !userId) {
        return res.status(400).json({ message: "E-mail en userId zijn vereist" });
    }

    try {
        // Haal gebruikersgegevens op uit Firestore
        const userDoc = await admin.firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }

        const userData = userDoc.data();
        const { thoughts, progress, moods } = userData;

        const emailContent = `
            Hallo,

            Hier is jouw dagelijkse welzijnsherinnering.

            Laatste gedachten: ${thoughts ? thoughts.join(", ") : "Geen gedachten opgeslagen"}
            Laatste stemming: ${moods && moods.length > 0 ? moods[moods.length - 1].moodLevel : "Geen stemming opgeslagen"}
            Voortgang: ${progress && progress.length > 0 ? progress[progress.length - 1].feedback : "Geen voortgang opgeslagen"}

            Vergeet niet gebruik te maken van de tools:
            - <a href="https://tool-link-1.com">Tool 1</a>
            - <a href="https://tool-link-2.com">Tool 2</a>

            Groeten,
            MGA Team
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Dagelijkse herinnering en tools',
            html: emailContent,
        };

        // Verstuur de e-mail
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Herinnering verzonden met details" });
    } catch (error) {
        console.error("Fout bij het versturen van e-mail:", error);
        res.status(500).json({ message: "Er is een fout opgetreden", error });
    }
});

// Start de server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
