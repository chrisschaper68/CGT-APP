// Importeren van benodigde modules
const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer"); // Nodemailer toevoegen
const express = require('express');
const cors = require('cors');  // Voor CORS
const { Configuration, OpenAIApi } = require('openai'); // OpenAI importeren
const functions = require("firebase-functions");

const app = express();

// Stel de poort in die Cloud Run vereist (poort 8080)
const port = process.env.PORT || 5000;

// CORS configureren (alleen als je een frontend hebt dat van andere domeinen komt)
app.use(cors({ origin: true }));
app.use(express.json());

// Configureer de Nodemailer transporter om e-mails te versturen
const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail als voorbeeld
  auth: {
    user: "chschaper@gmail.com", // Vul hier je e-mail in
    pass: "zevi unob sczx ksmg", // Gebruik een app-specifiek wachtwoord als je tweefactorauthenticatie hebt
  },
  tls: {
    rejectUnauthorized: false, // Schakel de SSL/TLS certificaatcontrole uit voor ontwikkelomgevingen
  },
});

// Configureer de OpenAI API
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Zorg ervoor dat de API-sleutel goed is ingesteld in je .env-bestand
}));

// Firebase Cloud Function om de e-mail te versturen
app.post("/sendReminderEmail", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("E-mail is vereist");
  }

  const mailOptions = {
    from: "chschaper@gmail.com", // Je e-mailadres
    to: email, // Ontvanger
    subject: "Herinnering voor je welzijn",
    text: "Dit is een herinnering om tijd te nemen voor jezelf en je welzijn. " +
          "Vergeet niet de aanbevolen oefeningen te doen zoals ademhalingsoefeningen, mindfulness, etc.",
  };

  // Verstuur de e-mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Fout bij het versturen van de e-mail:", error);
      return res.status(500).send("Er is een fout opgetreden bij het versturen van de e-mail.");
    }
    return res.status(200).send("Herinnering verzonden naar " + email);
  });
});

// Route voor vraag (gebruikersgedachten en advies genereren via OpenAI)
app.post("/askQuestion", async (req, res) => {
  const { thought, feedback, comments } = req.body;

  if (!thought) {
    return res.status(400).send("Gedachte is vereist");
  }

  try {
    // Herformuleer de gedachte via OpenAI
    const reframeResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: thought }],
    });

    // Advies op basis van feedback en opmerkingen
    const adviceResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Geef advies op basis van de feedback: ${feedback} en de opmerkingen: ${comments}`,
      }],
    });

    // Stuur het herformuleerde gedachte en advies als antwoord
    res.json({
      reframe: reframeResponse.data.choices[0].message.content,
      advice: adviceResponse.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Fout bij OpenAI-aanroep:", error);
    res.status(500).send("Er is een fout opgetreden bij het ophalen van de herformulering.");
  }
});

// Firebase Functions exporteren
exports.api = functions.https.onRequest(app);

// Start de Express server en luister op de poort
app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
