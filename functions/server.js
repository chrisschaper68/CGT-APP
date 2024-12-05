const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const getReframe = require('./api/getReframe');
const askQuestion = require('./api/askQuestion');
const admin = require('firebase-admin');
const cors = require('cors');
const axios = require('axios');

// Initialiseer Firebase Admin met omgevingsvariabelen
const serviceAccount = {
  "type": process.env.FIREBASE_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Statische bestanden voor afbeeldingen en andere resources
app.use('/images', express.static(path.join(__dirname, 'dist', 'images')));
app.use(express.static(path.join(__dirname, 'dist')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Nodemailer configuratie
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Gebruik de getReframe module voor de herformulering van gedachten
app.post('/api/getReframe', getReframe);

// Vraag module via AI
app.post('/api/getAnswer', askQuestion);

// Slaapdagboek API
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

    if (!progress || !moods || !thoughts) {
        return res.status(400).json({ message: "Vereiste gegevens ontbreken. Zorg dat progress, moods en thoughts zijn ingevuld." });
    }

    try {
        const recentProgress = progress.slice(-10); 
        const recentMoods = moods.slice(-10); 
        const recentThoughts = thoughts.slice(-10); 

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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

        const aiAdvice = aiResponse.data.choices[0]?.message?.content?.trim();
        if (!aiAdvice) {
            throw new Error("Geen advies ontvangen van OpenAI.");
        }

        res.json({ advice: aiAdvice, tools: toolsList });

    } catch (error) {
        console.error("Fout bij het aanroepen van de OpenAI API:", error.response?.data || error.message);
        res.status(500).json({
            message: "Er is een fout opgetreden bij het ophalen van AI-advies.",
            error: error.response?.data || error.message
        });
    }
});

// Verstuur herinneringen via e-mail
app.post('/api/sendReminderWithDetails', async (req, res) => {
    const { email, userId } = req.body;

    if (!email || !userId) {
        return res.status(400).json({ message: "E-mail en userId zijn vereist" });
    }

    try {
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
            subject: 'Dagelijkse welzijnsherinnering',
            html: emailContent
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Herinnering succesvol verstuurd.' });

    } catch (error) {
        console.error('Fout bij versturen van e-mail:', error);
        res.status(500).json({ message: 'Er is een fout opgetreden bij het versturen van de herinnering.' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Interne serverfout!' });
});

// Start de server
app.listen(PORT, () => {
    console.log(`Server draait op poort ${PORT}`);
});

module.exports = app;
