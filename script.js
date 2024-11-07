// Stemming Check-in
document.getElementById("mood-meter").addEventListener("input", function () {
    document.getElementById("mood-level").textContent = this.value;
});

// Gedachtenlogboek opslaan
function saveThought() {
    const thoughtInput = document.getElementById("thought-input").value;
    const thoughtList = document.getElementById("thought-list");

    if (thoughtInput) {
        const listItem = document.createElement("li");
        listItem.textContent = thoughtInput;
        thoughtList.appendChild(listItem);
        document.getElementById("thought-input").value = ""; // Wis het invoerveld
    }
}

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

        const data = await response.json();
        if (response.ok) {
            suggestionDiv.innerHTML = `<p>Herformuleerde gedachte: ${data.reframe}</p>`;
        } else {
            console.error("API error:", data.error);
            suggestionDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van de herformulering.</p>";
        }
    } catch (error) {
        console.error("API-aanroep fout:", error);
        suggestionDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van de herformulering.</p>";
    }
}

// Vraag stellen
async function askAIQuestion() {
    const question = document.getElementById("example-questions").value || document.getElementById("user-question").value;
    const responseDiv = document.getElementById("ai-response");

    if (!question) {
        responseDiv.innerHTML = "<p>Vul een vraag in om een antwoord te krijgen.</p>";
        return;
    }

    responseDiv.innerHTML = "<p>Bezig met het ophalen van het antwoord...</p>";

    try {
        const response = await fetch("/api/askQuestion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        if (response.ok) {
            responseDiv.innerHTML = `<p>Antwoord: ${data.answer}</p>`;
        } else {
            console.error("API error:", data.error);
            responseDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van het antwoord.</p>";
        }
    } catch (error) {
        console.error("API-aanroep fout:", error);
        responseDiv.innerHTML = "<p>Er is een fout opgetreden bij het ophalen van het antwoord.</p>";
    }
}

// Ademhalingsoefening starten met animatie
function startBreathingExercise() {
    const breathCircle = document.getElementById("breath-circle");
    breathCircle.style.animation = "breathing 6s ease-in-out infinite";
}

