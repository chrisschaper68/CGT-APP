
/// Stemming Check-in
document.getElementById("mood-meter").addEventListener("input", function () {
    const moodValue = Number(this.value);
    document.getElementById("mood-level").textContent = moodValue;

    // Verberg alle stemming-afbeeldingen
    const moodImages = document.querySelectorAll("#mood-images img");
    moodImages.forEach(img => img.style.display = "none");

    // Toon de juiste afbeelding gebaseerd op de stemming
    if (moodValue >= 9) {
        document.getElementById("mood-happy").style.display = "block";
    } else if (moodValue >= 7) {
        document.getElementById("mood-good").style.display = "block";
    } else if (moodValue >= 5) {
        document.getElementById("mood-neutral").style.display = "block";
    } else if (moodValue >= 3) {
        document.getElementById("mood-sad").style.display = "block";
    } else {
        document.getElementById("mood-depressed").style.display = "block";
    }
});

// Functie om stemming op te slaan in Firestore
async function saveMood() {
    const saveButton = document.getElementById("save-mood-btn");
    saveButton.disabled = true; // Schakel knop tijdelijk uit om dubbele clicks te voorkomen

    const user = firebase.auth().currentUser;
    if (user) {
        const moodLevel = Number(document.getElementById("mood-meter").value);
        const userRef = firebase.firestore().collection("users").doc(user.uid).collection("moods");

        try {
            await userRef.add({
                moodLevel: moodLevel,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Stemming opgeslagen!");
            await getMoodHistory(); // Laad de stemminghistorie
            document.getElementById("mood-chart").style.display = "block";
            document.getElementById("mood-average-chart").style.display = "block";
        } catch (error) {
            console.error("Fout bij opslaan stemming:", error);
        } finally {
            saveButton.disabled = false; // Activeer knop weer
        }
    } else {
        alert("Log eerst in om je stemming op te slaan.");
        saveButton.disabled = false; // Activeer knop weer bij fout
    }
}

// Verwijder bestaande event listeners en voeg een nieuwe toe
const saveMoodButton = document.getElementById("save-mood-btn");
saveMoodButton.replaceWith(saveMoodButton.cloneNode(true));
document.getElementById("save-mood-btn").addEventListener("click", saveMood);



// Gedachtenlogboek opslaan
async function saveThought() {
    const thoughtInput = document.getElementById("thought-input").value;
    const thoughtList = document.getElementById("thought-list");
    const user = firebase.auth().currentUser;  // Haal de ingelogde gebruiker op

    if (thoughtInput && user) {
        const thoughtRef = firebase.firestore().collection("users").doc(user.uid).collection("thoughts");

        try {
            // Sla de gedachte op in Firestore
            await thoughtRef.add({
                thought: thoughtInput,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Voeg een timestamp toe om te sorteren
            });

            document.getElementById("thought-input").value = "";  // Wis het invoerveld

            // Laad de gedachten opnieuw nadat de nieuwe gedachte is opgeslagen
            loadThoughts();
        } catch (error) {
            console.error("Fout bij opslaan gedachte:", error);
        }
    } else {
        alert("Log eerst in om je gedachte op te slaan.");
    }
}

// Gedachten ophalen en weergeven bij inloggen
async function loadThoughts() {
    const user = firebase.auth().currentUser;  // Haal de ingelogde gebruiker op
    const thoughtList = document.getElementById("thought-list");

    if (user) {
        try {
            const thoughtRef = firebase.firestore().collection("users").doc(user.uid).collection("thoughts");
            const querySnapshot = await thoughtRef.orderBy("timestamp", "desc").get();

            // Maak de lijst leeg voordat je nieuwe gegevens toevoegt
            thoughtList.innerHTML = ""; 

            // Controleer of er überhaupt gedachten zijn
            if (querySnapshot.empty) {
                console.log("Geen opgeslagen gedachten gevonden.");
                const noThoughtsMessage = document.createElement("li");
                noThoughtsMessage.textContent = "Je hebt nog geen gedachten opgeslagen.";
                thoughtList.appendChild(noThoughtsMessage);
            }

            // Voeg alle gedachten toe aan de lijst
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const listItem = document.createElement("li");
                listItem.textContent = data.thought;
                thoughtList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Fout bij het ophalen van gedachten:", error);
        }
    }
}

// Functie voor Google Inloggen
document.getElementById("google-signin-btn").addEventListener("click", async () => {
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        if (user) {
            alert(`Welkom ${user.displayName}`);
            loadThoughts();  // Laad de gedachten van de gebruiker na inloggen
            loadGratitude(); // Laad de dankbaarheid van de gebruiker na inloggen
            getMoodHistory(); // Laad de stemminggeschiedenis van de gebruiker na inloggen
            // Zorg dat de stemming tool zichtbaar is
            document.getElementById("mood-check").style.display = "block"; 
            document.getElementById("google-signin-btn").style.display = "none"; 
        }
    } catch (error) {
        console.error("Fout bij Google inloggen:", error);
    }
});

// Gecombineerde window.onload handler
window.onload = () => {
    const user = firebase.auth().currentUser;

    // Controleer of de gebruiker ingelogd is
    if (user) {
        loadThoughts();    // Laad de gedachten bij het opstarten van de pagina
        loadGratitude();  // Laad de dankbaarheid bij het opstarten van de pagina
        getMoodHistory(); // Laad de stemminggeschiedenis van de gebruiker bij het opstarten
    } else {
        alert("Je moet inloggen om toegang te krijgen tot deze functies.");
    }
};


// Functie om voortgang op te slaan
async function saveProgress() {
    const feedback = document.getElementById("result-feedback").value;
    const comments = document.getElementById("result-comments").value;
    const user = firebase.auth().currentUser;

    if (feedback && user) {
        const progressRef = firebase.firestore().collection("users").doc(user.uid).collection("progress");

        try {
            await progressRef.add({
                feedback: feedback,
                comments: comments,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });

            alert("Voortgang opgeslagen!");
            loadProgressChart(); // Update de voortgangsgrafiek na het opslaan
        } catch (error) {
            console.error("Fout bij opslaan voortgang:", error);
        }
    } else {
        alert("Vul de voortgang in voordat je opslaat.");
    }
}

// Laad voortgangsgeschiedenis en toon deze in een grafiek
async function loadProgressChart() {
    const user = firebase.auth().currentUser;
    if (user) {
        const progressRef = firebase.firestore().collection("users").doc(user.uid).collection("progress");

        try {
            const querySnapshot = await progressRef.orderBy("timestamp", "asc").get();
            const dates = [];
            const feedbackValues = [];
            const commentsArray = [];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const timestamp = data.timestamp.toDate().toLocaleDateString();
                dates.push(timestamp);
                feedbackValues.push(data.feedback === "ja" ? 1 : 0);  // Bijv. 1 voor "ja" en 0 voor "nee"
                commentsArray.push(data.comments);
            });

            // Controleer of er gegevens zijn, anders toon een placeholdergrafiek
            if (dates.length > 0) {
                console.log("Gevonden data voor grafiek: ", dates, feedbackValues, commentsArray); // Log voor foutopsporing
                createProgressChart(dates, feedbackValues, commentsArray);
            } else {
                console.log("Geen data gevonden voor voortgangsgrafiek. Toon placeholdergrafiek.");
                createProgressChart(["Geen data"], [0], ["Geen feedbackgegevens beschikbaar"]);
            }
        } catch (error) {
            console.error("Fout bij het ophalen van voortgang:", error);
            createProgressChart(["Fout"], [0], ["Kon voortgangsgegevens niet ophalen"]);
        }
    } else {
        alert("Log eerst in om je voortgang te bekijken.");
    }
}

// Functie om een voortgangsgrafiek te maken
function createProgressChart(dates, feedbackValues, commentsArray) {
    const ctx = document.getElementById("progressChart");

    if (!ctx) {
        console.error("Canvas element voor 'progressChart' niet gevonden. Controleer of het canvas-element in de HTML aanwezig is.");
        return;
    }

    console.log("Initialiseer grafiek met gegevens:", dates, feedbackValues, commentsArray); // Log voor foutopsporing

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Voortgang (Ja/Nee)',
                data: feedbackValues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            const feedbackText = feedbackValues[index] === 1 ? "Ja" : "Nee";
                            const comment = commentsArray[index] || "Geen opmerkingen";
                            return `Feedback: ${feedbackText} - Opmerkingen: ${comment}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return value === 1 ? "Ja" : "Nee";
                        }
                    },
                    title: {
                        display: true,
                        text: 'Feedback'
                    },
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

// Functie om dankbaarheid op te slaan in Firestore
async function saveGratitude() {
    const gratitudeInput = document.getElementById("gratitude-input").value;
    const gratitudeList = document.getElementById("gratitude-list");
    const user = firebase.auth().currentUser;

    if (gratitudeInput && user) {
        const gratitudeRef = firebase.firestore().collection("users").doc(user.uid).collection("gratitude");
        try {
            // Voeg de dankbaarheid toe aan Firestore
            await gratitudeRef.add({
                gratitude: gratitudeInput,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()  // Voeg een timestamp toe
            });

            // Wis het invoerveld na opslaan
            document.getElementById("gratitude-input").value = "";  
            loadGratitude();  // Herlaad de lijst met dankbaarheid

            // Toon een succesmelding
            alert("Dankbaarheid opgeslagen!");
        } catch (error) {
            console.error("Fout bij opslaan dankbaarheid:", error);
            alert("Er is een fout opgetreden bij het opslaan van dankbaarheid.");
        }
    } else {
        alert("Vul een dankbaarheid in om deze op te slaan.");
    }
}

// Functie om dankbaarheid op te halen uit Firestore
async function loadGratitude() {
    const user = firebase.auth().currentUser;  
    const gratitudeList = document.getElementById("gratitude-list");

    if (user) {
        const gratitudeRef = firebase.firestore().collection("users").doc(user.uid).collection("gratitude");

        try {
            const querySnapshot = await gratitudeRef.orderBy("timestamp", "desc").get();
            gratitudeList.innerHTML = "";  // Maak de lijst leeg voordat je nieuwe gegevens toevoegt

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const listItem = document.createElement("li");
                listItem.textContent = data.gratitude;  // Voeg de dankbaarheid toe aan de lijst
                gratitudeList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Fout bij ophalen van dankbaarheid:", error);
            alert("Er is een fout opgetreden bij het ophalen van de dankbaarheid.");
        }
    }
}

// Event listener voor de 'Bewaar Dankbaarheid' knop
document.getElementById("save-gratitude-btn").addEventListener("click", saveGratitude);

// Gedachte herformuleren met AI
async function getAIReframe() {
    const thought = document.getElementById("example-thoughts").value || document.getElementById("reframe-input").value;
    const suggestionDiv = document.getElementById("reframe-suggestion");

    if (!thought) {
        suggestionDiv.innerHTML = "<p>Vul een gedachte in om te herformuleren.</p>";
        return;
    }

    suggestionDiv.innerHTML = "<p>Bezig met herformuleren...</p>";

    try {
        const response = await fetch("/api/getReframe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ thought })
        });

        if (!response.ok) {
            throw new Error(`Fout bij API-aanroep: ${response.status}`);
        }

        const data = await response.json();
        suggestionDiv.innerHTML = `<p>Herformuleerde gedachte: ${data.reframe}</p>`;
    } catch (error) {
        console.error("API call error for reframe:", error);
        suggestionDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van de herformulering.</p>";
    }
}
// Klok Functie
document.addEventListener("DOMContentLoaded", () => {
    // Selectors
    const bedtimeClock = document.querySelector(".bedtime-clock");
    const bedtimeDisplay = document.getElementById("bedtime-display");

    const wakeTimeClock = document.querySelector(".wake-time-clock");
    const wakeTimeDisplay = document.getElementById("wake-time-display");

    const saveButton = document.getElementById("save-sleep-data");
    const sleepChartSection = document.getElementById("sleep-chart-section");
    const sleepChartCanvas = document.getElementById("sleepChart");

    let sleepDataArray = []; // Opslag voor meerdere dagen slaapgegevens

    // Functie om graden om te zetten naar tijd (24-uurs formaat)
    function degreesToTime(degrees) {
        const totalMinutes = Math.round((degrees / 360) * 1440);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return {
            hours: hours < 10 ? `0${hours}` : hours,
            minutes: minutes < 10 ? `0${minutes}` : minutes,
        };
    }

    // Update klok display en wijzerrotatie
    function updateClock(clockElement, displayElement, degrees) {
        const { hours, minutes } = degreesToTime(degrees);
        const formattedTime = `${hours}:${minutes}`;
        displayElement.textContent = formattedTime;

        const hourHand = clockElement.querySelector(".hour-hand");
        hourHand.style.transform = `rotate(${degrees}deg)`;
    }

    // Maak klok interactief
    function enableClockRotation(clockElement, displayElement) {
        let isDragging = false;
        let degrees = 0;

        clockElement.addEventListener("mousedown", () => {
            isDragging = true;
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            const rect = clockElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            degrees = (angle * (180 / Math.PI) + 90 + 360) % 360;

            updateClock(clockElement, displayElement, degrees);
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
        });
    }

    enableClockRotation(bedtimeClock, bedtimeDisplay);
    enableClockRotation(wakeTimeClock, wakeTimeDisplay);

    // Opslaan van slaapgegevens
    saveButton.addEventListener("click", () => {
        const bedtime = bedtimeDisplay.textContent;
        const wakeTime = wakeTimeDisplay.textContent;
        const sleepQuality = document.getElementById("sleep-quality").value;
        const alcoholAmount = document.getElementById("alcohol-amount").value || 0;
        const caffeineAmount = document.getElementById("caffeine-amount").value || 0;
        const medicationName = document.getElementById("medication-name").value || "Geen";
        const medicationAmount = document.getElementById("medication-amount").value || 0;
        const napDuration = document.getElementById("nap-duration").value || 0;

        const sleepData = {
            bedtime,
            wakeTime,
            sleepQuality,
            alcoholAmount,
            caffeineAmount,
            medicationName,
            medicationAmount,
            napDuration,
        };

        sleepDataArray.push(sleepData);

        console.log("Opgeslagen slaapgegevens:", sleepData);
        alert("Slaapgegevens succesvol opgeslagen!");

        generateSleepChart();
    });

    // Genereer grafiek
    function generateSleepChart() {
        const labels = sleepDataArray.map((data, index) => `Dag ${index + 1}`);
        const bedtimes = sleepDataArray.map((data) => {
            const [hours, minutes] = data.bedtime.split(":").map(Number);
            return hours + minutes / 60;
        });
        const wakeTimes = sleepDataArray.map((data) => {
            const [hours, minutes] = data.wakeTime.split(":").map(Number);
            return hours + minutes / 60;
        });

        if (sleepChartCanvas.chart) sleepChartCanvas.chart.destroy(); // Vernietig oude grafiek

        sleepChartCanvas.chart = new Chart(sleepChartCanvas, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Bedtijd (uur)",
                        data: bedtimes,
                        borderColor: "blue",
                        fill: false,
                        tension: 0.4,
                    },
                    {
                        label: "Wakker Tijd (uur)",
                        data: wakeTimes,
                        borderColor: "green",
                        fill: false,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Tijd (uur)",
                        },
                        ticks: {
                            callback: function (value) {
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
                            },
                        },
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Dagen",
                        },
                    },
                },
            },
        });

        sleepChartSection.style.display = "block";
    }
});



// Vraag stellen en advies opslaan
async function askAIQuestion() {
    const question = document.getElementById("example-questions").value || document.getElementById("user-question").value;
    const responseDiv = document.getElementById("ai-response");

    if (!question) {
        responseDiv.innerHTML = "<p>Vul een vraag in om een antwoord te krijgen.</p>";
        return;
    }

    responseDiv.innerHTML = "<p>Bezig met het ophalen van het antwoord...</p>";

    try {
        const response = await fetch("api/getAnswer", { // Volledige URL toegevoegd
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error(`Fout bij API-aanroep: ${response.status}`);
        }

        const data = await response.json();
        responseDiv.innerHTML = `<p>Antwoord: ${data.answer}</p>`;
        
        // Sla de vraag en het antwoord op in Firestore
        const user = firebase.auth().currentUser;
        if (user) {
            const userRef = firebase.firestore().collection("users").doc(user.uid).collection("questions");
            await userRef.add({
                question: question,
                answer: data.answer,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Toont het gedeelte om voortgang op te slaan
            document.getElementById("result-section").style.display = "block";
        }
    } catch (error) {
        console.error("Fout bij het ophalen van het antwoord:", error);
        responseDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van het antwoord.</p>";
    }
}


// Functie om voortgang op te slaan en vervolgadvies van AI te verkrijgen
async function saveProgress() {
    const feedback = document.getElementById("result-feedback").value;
    const comments = document.getElementById("result-comments").value;
    const user = firebase.auth().currentUser;

    if (user && feedback && comments) {
        const progressRef = firebase.firestore().collection("users").doc(user.uid).collection("progress");

        try {
            // Voeg de voortgang toe aan Firestore
            await progressRef.add({
                feedback: feedback,
                comments: comments,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()  // Voeg een timestamp toe voor het sorteren van de voortgang
            });

            alert("Voortgang opgeslagen!");

            // Toon het laadbericht dat we bezig zijn met het ophalen van advies
            document.getElementById("loading-message").style.display = "block";

            // Haal de gebruiker zijn data op uit Firestore
            const userData = await loadUserData(); // Haal voortgang, stemming, en gedachten op
            
            // Roep AI aan voor vervolgadvies op basis van de gegevens
            await getAIAdvice(userData); 

            // Zorg ervoor dat je geen dubbele antwoorden krijgt door de 'loading-message' te verbergen
            document.getElementById("loading-message").style.display = "none";

        } catch (error) {
            console.error("Fout bij opslaan voortgang:", error);
        }
    } else {
        alert("Vul alle velden in om voortgang op te slaan.");
    }
}

// Functie om gegevens van de gebruiker op te halen uit Firestore
async function loadUserData() {
    const user = firebase.auth().currentUser;
    if (user) {
        const userRef = firebase.firestore().collection("users").doc(user.uid);

        // Verzamelen van voortgang, stemming en gedachten
        const progressRef = userRef.collection("progress");
        const moodsRef = userRef.collection("moods");
        const thoughtsRef = userRef.collection("thoughts");

        // Ophalen van gegevens
        const progressSnapshot = await progressRef.orderBy("timestamp", "desc").get();
        const moodsSnapshot = await moodsRef.orderBy("timestamp").get();
        const thoughtsSnapshot = await thoughtsRef.orderBy("timestamp", "desc").get();

        const userData = {
            progress: [],
            moods: [],
            thoughts: []
        };

        progressSnapshot.forEach(doc => {
            const data = doc.data();
            userData.progress.push(data);
        });

        moodsSnapshot.forEach(doc => {
            const data = doc.data();
            userData.moods.push(data);
        });

        thoughtsSnapshot.forEach(doc => {
            const data = doc.data();
            userData.thoughts.push(data);
        });

        return userData;
    } else {
        alert("Je moet ingelogd zijn om voortgang en gegevens op te halen.");
    }
}

// Functie om AI-advies op te halen
async function getAIAdvice(userData) {
    console.log("Verzonden gebruikersdata naar AI:", userData); // Log de verzonden data naar de console

    try {
        const response = await fetch("/api/getAIAdvice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                progress: userData.progress,
                moods: userData.moods,
                thoughts: userData.thoughts
            })
        });

        if (!response.ok) {
            throw new Error(`Fout bij API-aanroep: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ontvangen AI-advies:", data); // Log het ontvangen advies van de API
        displayFollowUpAdvice(data.advice, data.tools); // Gebruik de AI-advies data hier
    } catch (error) {
        console.error("Fout bij het ophalen van AI-advies:", error);
    }
}


function displayFollowUpAdvice(advice, tools) {
    // Toon het advies
    document.getElementById("advice-text").innerHTML = advice;

    // Toon de tools als ze beschikbaar zijn
    if (tools && tools.length > 0) {
        const toolsList = document.getElementById("tools-list");
        toolsList.innerHTML = "";  // Maak de lijst leeg voordat je nieuwe tools toevoegt

        tools.forEach(tool => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${tool.name}</strong>: <a href="${tool.url}" target="_blank">${tool.description}</a>`;
            toolsList.appendChild(listItem);
        });
    }

    // Maak het advies zichtbaar
    document.getElementById("follow-up-advice").style.display = "block";
}
async function loadAIAdvice() {
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            const adviceRef = firebase.firestore().collection("users").doc(user.uid).collection("ai-advice");
            const snapshot = await adviceRef.orderBy("timestamp", "desc").limit(1).get();

            if (snapshot.empty) {
                console.log("Geen AI-advies gevonden.");
                document.getElementById("advice-text").textContent = "Nog geen advies beschikbaar.";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                console.log("Ophalen AI-advies:", data);
                document.getElementById("advice-text").textContent = data.advice;
            });
        } catch (error) {
            console.error("Fout bij het ophalen van AI-advies:", error);
        }
    } else {
        alert("Je moet inloggen om advies te bekijken.");
    }
}


// Laad voortgangsgeschiedenis en toon deze in een grafiek
async function loadProgressChart() {
    const user = firebase.auth().currentUser;
    if (user) {
        const progressRef = firebase.firestore().collection("users").doc(user.uid).collection("progress");

        try {
            const querySnapshot = await progressRef.orderBy("timestamp", "asc").get();
            const dates = [];
            const feedbackValues = [];
            const commentsArray = [];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const timestamp = data.timestamp.toDate().toLocaleDateString();
                dates.push(timestamp);
                feedbackValues.push(data.feedback === "ja" ? 1 : 0);  // Bijv. 1 voor "ja" en 0 voor "nee"
                commentsArray.push(data.comments);
            });

            // Controleer of er gegevens zijn, anders toon een placeholdergrafiek
            if (dates.length > 0) {
                console.log("Gevonden data voor grafiek: ", dates, feedbackValues, commentsArray); // Log voor foutopsporing
                createProgressChart(dates, feedbackValues, commentsArray);
            } else {
                console.log("Geen data gevonden voor voortgangsgrafiek. Toon placeholdergrafiek.");
                createProgressChart(["Geen data"], [0], ["Geen feedbackgegevens beschikbaar"]);
            }
        } catch (error) {
            console.error("Fout bij het ophalen van voortgang:", error);
            createProgressChart(["Fout"], [0], ["Kon voortgangsgegevens niet ophalen"]);
        }
    } else {
        alert("Log eerst in om je voortgang te bekijken.");
    }
}

// Functie om een voortgangsgrafiek te maken
function createProgressChart(dates, feedbackValues, commentsArray) {
    const ctx = document.getElementById("progressChart");

    if (!ctx) {
        console.error("Canvas element voor 'progressChart' niet gevonden. Controleer of het canvas-element in de HTML aanwezig is.");
        return;
    }

    console.log("Initialiseer grafiek met gegevens:", dates, feedbackValues, commentsArray); // Log voor foutopsporing

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Voortgang (Ja/Nee)',
                data: feedbackValues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            const feedbackText = feedbackValues[index] === 1 ? "Ja" : "Nee";
                            const comment = commentsArray[index] || "Geen opmerkingen";
                            return `Feedback: ${feedbackText} - Opmerkingen: ${comment}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return value === 1 ? "Ja" : "Nee";
                        }
                    },
                    title: {
                        display: true,
                        text: 'Feedback'
                    },
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

(function () {
    let breathingInProgress = false;
    const breathCircle = document.getElementById("breath-circle");
    const breathingStatus = document.getElementById("breathing-status");
    const startButton = document.getElementById("start-breathing-btn");
    const stopButton = document.getElementById("stop-breathing-btn");

    const steps = [
        { text: "Inademen door je neus (4 seconden)", duration: 4000 },
        { text: "Vasthouden (7 seconden)", duration: 7000 },
        { text: "Uitademen door je mond (8 seconden)", duration: 8000 },
    ];

    let stepIndex = 0;
    let breathingInterval = null;

    function resetBreathing() {
        clearInterval(breathingInterval);
        breathingStatus.textContent = "Ademhalingsoefening gestopt.";
        breathCircle.style.animation = "none";
        breathCircle.style.transform = "scale(1)";
        stepIndex = 0;
        breathingInProgress = false;
        startButton.disabled = false;
        stopButton.disabled = true;
    }

    function startBreathingExercise() {
        if (breathingInProgress) return;

        breathingInProgress = true;
        startButton.disabled = true;
        stopButton.disabled = false;

        breathCircle.style.animation = "breathingCycle 19s ease-in-out infinite";
        updateBreathingStep();
    }

    function updateBreathingStep() {
        breathingStatus.textContent = steps[stepIndex].text;

        breathingInterval = setTimeout(() => {
            stepIndex = (stepIndex + 1) % steps.length;
            if (breathingInProgress) {
                updateBreathingStep();
            }
        }, steps[stepIndex].duration);
    }

    function stopBreathingExercise() {
        resetBreathing();
    }

    startButton.addEventListener("click", startBreathingExercise);
    stopButton.addEventListener("click", stopBreathingExercise);

    resetBreathing();
})();


// Haal de stemminggeschiedenis van de gebruiker op
async function getMoodHistory() {
    const user = firebase.auth().currentUser;
    if (user) {
        const moodsRef = firebase.firestore().collection("users").doc(user.uid).collection("moods");

        try {
            const querySnapshot = await moodsRef.orderBy("timestamp").get();

            const moodData = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                moodData.push({
                    moodLevel: data.moodLevel,
                    timestamp: data.timestamp.toDate()
                });
            });

            createMoodChart(moodData);
            createAverageMoodChart(moodData);
        } catch (error) {
            console.error("Fout bij het ophalen van stemminggeschiedenis:", error);
        }
    } else {
        alert("Log eerst in om je stemming op te slaan.");
    }
}

// Maak een grafiek van de stemming door de tijd heen
function createMoodChart(moodData) {
    const ctx = document.getElementById("moodChart").getContext("2d");

    const labels = moodData.map(data => data.timestamp.toLocaleDateString());
    const moodLevels = moodData.map(data => data.moodLevel);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stemming door de tijd',
                data: moodLevels,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    min: 1,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Stemming'
                    }
                }
            }
        }
    });
}

// Maak een grafiek van de gemiddelde stemming per dag
function createAverageMoodChart(moodData) {
    const dailyMoodData = groupMoodByDate(moodData);

    const ctx = document.getElementById("moodAverageChart").getContext("2d");

    const labels = Object.keys(dailyMoodData);
    const averageMoods = Object.values(dailyMoodData).map(moods => {
        const sum = moods.reduce((acc, mood) => acc + mood, 0);
        return sum / moods.length;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gemiddelde Stemming per Dag',
                data: averageMoods,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    min: 1,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Gemiddelde Stemming'
                    }
                }
            }
        }
    });
}

// Groepeer stemming op datum
function groupMoodByDate(moodData) {
    return moodData.reduce((acc, data) => {
        const date = data.timestamp.toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(data.moodLevel);
        return acc;
    }, {});
}

// Laad stemminghistorie bij inloggen
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        getMoodHistory();
    }
});
