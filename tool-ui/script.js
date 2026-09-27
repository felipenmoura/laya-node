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
    const stateTypeRadios = document.querySelectorAll('input[name="state-type"]');
    const stateTextContainer = document.getElementById('state-text-container');
    const stateObjectContainer = document.getElementById('state-object-container');
    const addKvBtn = document.getElementById('add-kv-btn');
    const kvPairsContainer = document.getElementById('kv-pairs');

    function getStateType() {
        const checked = document.querySelector('input[name="state-type"]:checked');
        return checked ? checked.value : 'text';
    }

    stateTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'text') {
                stateTextContainer.classList.add('active');
                stateObjectContainer.classList.remove('active');
            } else {
                stateTextContainer.classList.remove('active');
                stateObjectContainer.classList.add('active');
            }
        });
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

    document.querySelector('.remove-kv').addEventListener('click', function() {
        if (kvPairsContainer.children.length > 1) {
            this.parentElement.remove();
        }
    });

    addKvBtn.addEventListener('click', () => {
        kvPairsContainer.appendChild(createKvPair());
    });

    // ==========================================
    // Questions Management
    // ==========================================
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');

    function renderCriteriaUI(type, container) {
        container.innerHTML = '';
        if (type === 'noul') {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        const isScore = type === 'score';
        
        const listDiv = document.createElement('div');
        listDiv.className = 'criteria-list';
        listDiv.style.display = 'flex';
        listDiv.style.flexDirection = 'column';
        listDiv.style.gap = '8px';
        listDiv.style.marginBottom = '8px';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'secondary-btn add-criteria';
        addBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Criterion`;
        
        const addFn = () => {
            const cDiv = document.createElement('div');
            cDiv.className = 'criterion-item';
            if (isScore) {
                cDiv.innerHTML = `
                    <input type="text" class="form-input c-value" placeholder="Criterion string (e.g. not urgent)">
                    <button class="icon-btn remove-c" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                `;
            } else {
                cDiv.innerHTML = `
                    <input type="text" class="form-input c-key" placeholder="Key (e.g. bug)">
                    <input type="text" class="form-input c-value" placeholder="Description">
                    <button class="icon-btn remove-c" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                `;
            }
            cDiv.querySelector('.remove-c').addEventListener('click', () => {
                if (listDiv.children.length > 1) {
                    cDiv.remove();
                }
            });
            listDiv.appendChild(cDiv);
        };

        // Add initial items
        addFn();
        if (isScore) { addFn(); addFn(); } // provide 3 default lines for score
        else { addFn(); } // 2 for choice
        
        addBtn.addEventListener('click', addFn);
        
        container.appendChild(listDiv);
        container.appendChild(addBtn);
    }

    function createQuestionCard() {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-card';
        
        qDiv.innerHTML = `
            <div class="q-header" style="cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <svg class="q-collapse-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    <input type="text" class="form-input q-name" placeholder="Question Key (e.g. urgency)" style="flex: 1;" onclick="event.stopPropagation()">
                </div>
                <button class="icon-btn remove-q" title="Remove Question" aria-label="Remove Question" onclick="event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="q-content">
                <div class="q-body" style="margin-top: 12px;">
                    <input type="text" class="form-input q-inst" placeholder="Instructions (e.g. How urgent is this?)">
                    <select class="form-select q-type">
                        <option value="noul" selected>Noul</option>
                        <option value="score">Score</option>
                        <option value="choice">Choice</option>
                    </select>
                </div>
                <div class="q-criteria-container"></div>
            </div>
        `;

        const typeSelect = qDiv.querySelector('.q-type');
        const criteriaContainer = qDiv.querySelector('.q-criteria-container');
        
        const qHeader = qDiv.querySelector('.q-header');
        const qContent = qDiv.querySelector('.q-content');
        const qIcon = qDiv.querySelector('.q-collapse-icon');

        qHeader.addEventListener('click', () => {
            qDiv.classList.toggle('collapsed');
            if (qDiv.classList.contains('collapsed')) {
                qContent.style.display = 'none';
                qIcon.style.transform = 'rotate(-90deg)';
            } else {
                qContent.style.display = 'block';
                qIcon.style.transform = 'rotate(0deg)';
            }
        });
        
        typeSelect.addEventListener('change', () => {
            renderCriteriaUI(typeSelect.value, criteriaContainer);
        });

        qDiv.querySelector('.remove-q').addEventListener('click', () => {
            qDiv.style.opacity = '0';
            setTimeout(() => qDiv.remove(), 200);
        });

        // Initialize criteria
        renderCriteriaUI('noul', criteriaContainer);

        return qDiv;
    }

    addQuestionBtn.addEventListener('click', () => {
        questionsContainer.appendChild(createQuestionCard());
    });

    // Add a default question right away
    questionsContainer.appendChild(createQuestionCard());

    // ==========================================
    // Load & Templates Modal Management
    // ==========================================
    const loadBtn = document.getElementById('load-btn');
    const loadModal = document.getElementById('load-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const savedTestsList = document.getElementById('load-tab');
    const templatesList = document.getElementById('templates-tab');

    const DEFAULT_TEMPLATES = [
        {
            name: "E-mail Support",
            description: "Classify an incoming support email.",
            stateType: "object",
            state: {
                "subject": "App crashes on startup",
                "body": "Hi, every time I open the app on my iPhone it immediately crashes.",
                "sender": "user@example.com"
            },
            questions: {
                "category": {
                    "type": "choice",
                    "instructions": "What category does this email fall into?",
                    "criteria": {
                        "bug": "App crashes or errors",
                        "billing": "Invoice or payment issues",
                        "feature_request": "Asking for new features",
                        "general": "General questions"
                    }
                },
                "urgency": {
                    "type": "score",
                    "instructions": "How urgent is this issue?",
                    "criteria": ["low", "medium", "high", "critical"]
                }
            }
        },
        {
            name: "Support Ticket",
            description: "Classify a standard support ticket.",
            stateType: "text",
            state: "The user reported that they cannot reset their password using the recovery link.",
            questions: {
                "issue_type": {
                    "type": "choice",
                    "instructions": "Identify the type of issue.",
                    "criteria": {
                        "login_issue": "Problems logging in or resetting password",
                        "performance": "System is slow or timing out",
                        "data_loss": "User lost their data"
                    }
                },
                "requires_escalation": {
                    "type": "noul",
                    "instructions": "Does this ticket need to be escalated to tier 2?"
                }
            }
        },
        {
            name: "Mood Classification",
            description: "Classify the mood from a user comment.",
            stateType: "text",
            state: "I really absolutely loved the new update, it makes everything so much faster!",
            questions: {
                "sentiment": {
                    "type": "score",
                    "instructions": "What is the sentiment of this comment?",
                    "criteria": ["very negative", "negative", "neutral", "positive", "very positive"]
                },
                "emotion": {
                    "type": "choice",
                    "instructions": "What primary emotion is expressed?",
                    "criteria": {
                        "joy": "Happy, excited, or pleased",
                        "anger": "Mad, frustrated, or annoyed",
                        "sadness": "Disappointed or sad",
                        "confusion": "Unsure or puzzled"
                    }
                }
            }
        }
    ];

    // Tab switching
    document.querySelectorAll('.modal-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.modal-body').forEach(body => body.classList.remove('active-tab-content'));
            
            tabBtn.classList.add('active');
            document.getElementById(tabBtn.getAttribute('data-tab')).classList.add('active-tab-content');
        });
    });

    function populateTemplates() {
        templatesList.innerHTML = '';
        DEFAULT_TEMPLATES.forEach(test => {
            const div = document.createElement('div');
            div.className = 'saved-test-item';
            div.innerHTML = `
                <h4>${test.name}</h4>
                ${test.description ? `<p>${test.description}</p>` : ''}
            `;
            div.addEventListener('click', () => {
                loadTestIntoUI(test);
                loadModal.classList.remove('active');
            });
            templatesList.appendChild(div);
        });
    }

    populateTemplates();

    loadBtn.addEventListener('click', () => {
        const savedTests = JSON.parse(localStorage.getItem('laya_tests') || '{}');
        savedTestsList.innerHTML = '';
        
        const keys = Object.keys(savedTests);
        if (keys.length === 0) {
            savedTestsList.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No saved tests found.</p>';
        } else {
            keys.forEach(key => {
                const test = savedTests[key];
                const div = document.createElement('div');
                div.className = 'saved-test-item';
                div.innerHTML = `
                    <h4>${test.name}</h4>
                    ${test.description ? `<p>${test.description}</p>` : ''}
                `;
                div.addEventListener('click', () => {
                    loadTestIntoUI(test);
                    loadModal.classList.remove('active');
                });
                savedTestsList.appendChild(div);
            });
        }
        
        loadModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
        loadModal.classList.remove('active');
    });

    loadModal.addEventListener('click', (e) => {
        if (e.target === loadModal) {
            loadModal.classList.remove('active');
        }
    });

    function loadTestIntoUI(test) {
        document.getElementById('test-name').value = test.name || '';
        document.getElementById('test-description').value = test.description || '';
        
        const typeValue = test.stateType || 'text';
        const typeRadio = document.querySelector(`input[name="state-type"][value="${typeValue}"]`);
        if (typeRadio) {
            typeRadio.checked = true;
            typeRadio.dispatchEvent(new Event('change'));
        }
        
        if (test.stateType === 'text') {
            document.getElementById('state-text-input').value = test.state || '';
        } else if (test.stateType === 'object' && test.state) {
            kvPairsContainer.innerHTML = '';
            Object.keys(test.state).forEach(k => {
                const pair = createKvPair();
                pair.querySelector('.kv-key').value = k;
                pair.querySelector('.kv-value').value = test.state[k];
                kvPairsContainer.appendChild(pair);
            });
            if (kvPairsContainer.children.length === 0) kvPairsContainer.appendChild(createKvPair());
        }

        if (test.questions) {
            questionsContainer.innerHTML = '';
            Object.keys(test.questions).forEach(qKey => {
                const qData = test.questions[qKey];
                const qCard = createQuestionCard();
                qCard.querySelector('.q-name').value = qKey;
                qCard.querySelector('.q-inst').value = qData.instructions || '';
                
                const typeSelect = qCard.querySelector('.q-type');
                typeSelect.value = qData.type || 'noul';
                typeSelect.dispatchEvent(new Event('change'));

                if (qData.type !== 'noul' && qData.criteria) {
                    const criteriaListDiv = qCard.querySelector('.criteria-list');
                    if (criteriaListDiv) criteriaListDiv.innerHTML = '';

                    if (qData.type === 'score' && Array.isArray(qData.criteria)) {
                        qData.criteria.forEach(c => {
                            qCard.querySelector('.add-criteria').click();
                            const items = qCard.querySelectorAll('.criterion-item');
                            items[items.length - 1].querySelector('.c-value').value = c;
                        });
                    } else if (qData.type === 'choice' && typeof qData.criteria === 'object') {
                        Object.keys(qData.criteria).forEach(k => {
                            qCard.querySelector('.add-criteria').click();
                            const items = qCard.querySelectorAll('.criterion-item');
                            items[items.length - 1].querySelector('.c-key').value = k;
                            items[items.length - 1].querySelector('.c-value').value = qData.criteria[k];
                        });
                    }
                }
                
                questionsContainer.appendChild(qCard);
            });
        }
    }


    // ==========================================
    // Execution and Results View
    // ==========================================
    const resultsViewRadios = document.getElementById('results-view-radios');
    const radioInputs = document.querySelectorAll('input[name="results-view"]');
    const resultsTableView = document.getElementById('results-table-view');
    const outputEl = document.getElementById('output');
    const outputCurl = document.getElementById('output-curl');
    const outputFetch = document.getElementById('output-fetch');
    const outputPlaceholder = document.getElementById('output-placeholder');

    radioInputs.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const val = e.target.value;
            resultsTableView.style.display = val === 'answers' ? 'block' : 'none';
            outputEl.style.display = val === 'source' ? 'block' : 'none';
            outputCurl.style.display = val === 'curl' ? 'block' : 'none';
            outputFetch.style.display = val === 'fetch' ? 'block' : 'none';
        });
    });

    function setupCodeSnippets(statePayload, questionsPayload) {
        const payloadStr = JSON.stringify({
            state: statePayload || "Sample state text",
            questions: questionsPayload
        }, null, 2);

        // Curl
        const curlSnippet = `curl -X POST http://localhost:3000/predict \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \\
  -d '${payloadStr.replace(/'/g, "'\\''")}'`;
        outputCurl.textContent = curlSnippet;

        // Fetch
        const fetchSnippet = `fetch('http://localhost:3000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SECRET_API_KEY'
  },
  body: JSON.stringify(${payloadStr.replace(/\n/g, '\n  ')})
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
        outputFetch.textContent = fetchSnippet;
    }

    function setupTableView(data, clientTimeElapsedSec, questionsPayload) {
        if (!data) return;
        
        let html = '<table class="results-table">';
        html += '<thead><tr><th>Question Key</th><th>Answer</th></tr></thead><tbody>';
        
        let hasAnswers = false;
        const answers = data.answers || {};
        
        Object.keys(answers).forEach(k => {
            hasAnswers = true;
            let val = answers[k];
            let displayVal = val;
            
            if (questionsPayload && questionsPayload[k] && typeof val === 'object' && val !== null) {
                const qType = questionsPayload[k].type;
                if (qType === 'choice' && val.choice !== undefined) {
                    displayVal = val.choice;
                } else if (qType === 'score' && val.score !== undefined) {
                    const floored = Math.floor(val.score);
                    if (val.legend && val.legend[floored] !== undefined) {
                        displayVal = val.legend[floored];
                    } else {
                        displayVal = val.score;
                    }
                } else if (qType === 'noul' && val.noul !== undefined) {
                    displayVal = val.noul > 0.5 ? 'yes' : 'no';
                } else {
                    displayVal = JSON.stringify(val);
                }
            } else if (typeof val === 'object' && val !== null) {
                displayVal = JSON.stringify(val);
            }
            
            html += `<tr><td>${k}</td><td style="text-transform: capitalize;">${displayVal}</td></tr>`;
        });
        
        if (!hasAnswers) {
            html += `<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">No answers found in response.</td></tr>`;
        }
        html += '</tbody></table>';

        let tokens = 'N/A';
        if (data.usage && typeof data.usage.input_tokens === 'number' && typeof data.usage.output_tokens === 'number') {
            tokens = data.usage.input_tokens + data.usage.output_tokens;
        } else if (data.tokens || data.tokens_used) {
            tokens = data.tokens || data.tokens_used;
        }
        
        const time = clientTimeElapsedSec ? clientTimeElapsedSec.toFixed(2) : 'N/A';
        
        html += `<div class="results-meta">
            <span><strong>Tokens:</strong> ${tokens}</span>
            <span><strong>Time elapsed:</strong> ${time}s</span>
        </div>`;
        
        resultsTableView.innerHTML = html;
    }

    async function runPrediction() {
        const executeBtn = document.getElementById('execute-btn');
        
        executeBtn.style.opacity = '0.7';
        // executeBtn.style.transform = 'translate(-50%, -50%) scale(0.95)';
        
        outputPlaceholder.textContent = "Compiling payload and contacting Laya Router...";
        outputPlaceholder.style.display = 'block';
        resultsTableView.style.display = 'none';
        outputEl.style.display = 'none';
        outputCurl.style.display = 'none';
        outputFetch.style.display = 'none';
        resultsViewRadios.style.display = 'none';

        // Extract State Payload
        let statePayload;
        if (getStateType() === 'text') {
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

        // Extract Questions Payload
        const questionsPayload = {};
        document.querySelectorAll('.question-card').forEach(qCard => {
            const name = qCard.querySelector('.q-name').value.trim();
            if (!name) return;
            
            const inst = qCard.querySelector('.q-inst').value.trim();
            const type = qCard.querySelector('.q-type').value;
            
            const qData = { type, instructions: inst };
            
            if (type === 'score') {
                qData.criteria = [];
                qCard.querySelectorAll('.criterion-item').forEach(cItem => {
                    const val = cItem.querySelector('.c-value').value.trim();
                    if (val) qData.criteria.push(val);
                });
            } else if (type === 'choice') {
                qData.criteria = {};
                qCard.querySelectorAll('.criterion-item').forEach(cItem => {
                    const k = cItem.querySelector('.c-key').value.trim();
                    const v = cItem.querySelector('.c-value').value.trim();
                    if (k) qData.criteria[k] = v;
                });
            }
            
            questionsPayload[name] = qData;
        });

        if (Object.keys(questionsPayload).length === 0) {
            outputEl.textContent = "Error: Please specify at least one question with a Question Key.";
            executeBtn.style.opacity = '1';
            executeBtn.style.transform = '';
            return;
        }

        const nameInput = document.getElementById('test-name').value.trim();
        const descriptionInput = document.getElementById('test-description').value.trim();

        if (nameInput) {
            const savedTests = JSON.parse(localStorage.getItem('laya_tests') || '{}');
            savedTests[nameInput] = {
                name: nameInput,
                description: descriptionInput,
                stateType: getStateType(),
                state: statePayload,
                questions: questionsPayload
            };
            localStorage.setItem('laya_tests', JSON.stringify(savedTests));
        }

        try {
            const startTime = performance.now();

            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    state: statePayload || "Sample state text",
                    questions: questionsPayload
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            const timeElapsedSec = (endTime - startTime) / 1000;
            
            outputEl.textContent = JSON.stringify(data, null, 2);
            setupTableView(data, timeElapsedSec, questionsPayload);
            setupCodeSnippets(statePayload, questionsPayload);
            
            // Default to table view
            document.querySelector('input[name="results-view"][value="answers"]').checked = true;
            resultsTableView.style.display = 'block';
            outputEl.style.display = 'none';
            outputCurl.style.display = 'none';
            outputFetch.style.display = 'none';
            outputPlaceholder.style.display = 'none';
            resultsViewRadios.style.display = 'flex';

        } catch (err) {
            outputPlaceholder.style.display = 'block';
            resultsTableView.style.display = 'none';
            outputEl.style.display = 'none';
            outputCurl.style.display = 'none';
            outputFetch.style.display = 'none';
            resultsViewRadios.style.display = 'none';
            outputPlaceholder.textContent = `Error: ${err.message}`;
        } finally {
            executeBtn.style.opacity = '1';
            executeBtn.style.transform = '';
        }
    }

    // document.getElementById('test-btn').addEventListener('click', runPrediction);
    document.getElementById('execute-btn').addEventListener('click', runPrediction);
});
