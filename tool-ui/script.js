document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Theme Management
    // ==========================================
    const themeBtn = document.getElementById('theme-btn');
    const themeIcon = document.getElementById('theme-icon');
    
    const ICONS = {
        sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
        moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
    };

    function setTheme(theme) {
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            themeIcon.innerHTML = isDark ? ICONS.moon : ICONS.sun;
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            themeIcon.innerHTML = theme === 'dark' ? ICONS.moon : ICONS.sun;
        }
    }

    let currentTheme = localStorage.getItem('theme') || 'system';
    setTheme(currentTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentTheme === 'system') {
            setTheme('system');
        }
    });

    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        currentTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        setTheme(currentTheme);
    });

    // ==========================================
    // State UI Management
    // ==========================================
    const stateTypeSelect = document.getElementById('state-type');
    const stateTextContainer = document.getElementById('state-text-container');
    const stateObjectContainer = document.getElementById('state-object-container');
    const addKvBtn = document.getElementById('add-kv-btn');
    const kvPairsContainer = document.getElementById('kv-pairs');

    stateTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'text') {
            stateTextContainer.classList.add('active');
            stateObjectContainer.classList.remove('active');
        } else {
            stateTextContainer.classList.remove('active');
            stateObjectContainer.classList.add('active');
        }
    });

    function createKvPair() {
        const div = document.createElement('div');
        div.className = 'kv-pair';
        div.innerHTML = `
            <input type="text" class="form-input kv-key" placeholder="Key (e.g. subject)">
            <input type="text" class="form-input kv-value" placeholder="Value">
            <button class="icon-btn remove-kv" title="Remove" aria-label="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        div.querySelector('.remove-kv').addEventListener('click', () => {
            if (kvPairsContainer.children.length > 1) {
                div.remove();
            }
        });
        return div;
    }

    // Attach listener to default remove button
    document.querySelector('.remove-kv').addEventListener('click', function() {
        if (kvPairsContainer.children.length > 1) {
            this.parentElement.remove();
        }
    });

    addKvBtn.addEventListener('click', () => {
        kvPairsContainer.appendChild(createKvPair());
    });

    // ==========================================
    // Execution
    // ==========================================
    async function runPrediction() {
        const outputEl = document.getElementById('output');
        const executeBtn = document.getElementById('execute-btn');
        
        executeBtn.style.opacity = '0.7';
        executeBtn.style.transform = 'translate(-50%, -50%) scale(0.95)';
        outputEl.textContent = "Running prediction via Laya Router...";

        // Extract State Payload
        let statePayload;
        if (stateTypeSelect.value === 'text') {
            statePayload = document.getElementById('state-text-input').value;
        } else {
            statePayload = {};
            document.querySelectorAll('.kv-pair').forEach(pair => {
                const key = pair.querySelector('.kv-key').value.trim();
                const value = pair.querySelector('.kv-value').value;
                if (key) {
                    statePayload[key] = value;
                }
            });
        }

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    state: statePayload || "The system is completely down and I can't log in.",
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
        } finally {
            executeBtn.style.opacity = '1';
            executeBtn.style.transform = '';
        }
    }

    document.getElementById('test-btn').addEventListener('click', runPrediction);
    document.getElementById('execute-btn').addEventListener('click', runPrediction);
});
