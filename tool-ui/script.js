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
    // Run Test Action
    // ==========================================
    document.getElementById('test-btn').addEventListener('click', async () => {
        const outputEl = document.getElementById('output');
        const btn = document.getElementById('test-btn');
        
        btn.style.opacity = '0.7';
        btn.style.transform = 'scale(0.95)';
        outputEl.textContent = "Running prediction via Laya Router...";

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
        } finally {
            btn.style.opacity = '1';
            btn.style.transform = '';
        }
    });
});
