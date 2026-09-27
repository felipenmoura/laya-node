document.getElementById('test-btn').addEventListener('click', async () => {
    const outputEl = document.getElementById('output');
    outputEl.textContent = "Running prediction...";

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: "The system is completely down and I can't log in.",
                questions: {
                    urgency: {
                        type: "score",
                        instructions: "How urgent is this?",
                        criteria: ["not urgent", "annoying", "critical/blocking"]
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        outputEl.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        outputEl.textContent = `Error: ${err.message}`;
    }
});
