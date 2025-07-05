// Language Learning Extension - Content Script
(function() {
    'use strict';

    let config = {
        apiKey: '',
        model: 'google/gemini-2.5-flash',
        targetLanguage: 'English',
        wordPrompt: "Translate the word '{{text}}' into {{language}}. Provide a brief explanation if helpful.",
        selectionPrompt: "Translate this text into {{language}}: {{text}}",
        maxConversationTurns: 3
    };

    let sidebar = null;
    let isInitialized = false;

    // Load configuration from Chrome storage
    async function loadConfig() {
        try {
            const result = await chrome.storage.sync.get('translatorConfig');
            if (result.translatorConfig) {
                config = { ...config, ...result.translatorConfig };
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    // Create sidebar
    function createSidebar() {
        if (sidebar) return;

        sidebar = document.createElement('div');
        sidebar.id = 'language-translator-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h3>Language Translator</h3>
                <button id="close-sidebar">×</button>
            </div>
            <div class="sidebar-content">
                <div class="translation-area" id="translation-area">
                    <div class="placeholder">
                        Select text or right-click words to see translations
                    </div>
                </div>
                <div class="sidebar-footer">
                    <button id="clear-translations">Clear All</button>
                    <button id="open-settings">Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);

        // Event listeners
        document.getElementById('close-sidebar').addEventListener('click', hideSidebar);
        document.getElementById('clear-translations').addEventListener('click', clearTranslations);
        document.getElementById('open-settings').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
    }

    function showSidebar() {
        if (!sidebar) createSidebar();
        sidebar.classList.add('visible');
        document.body.classList.add('translator-sidebar-open');
    }

    function hideSidebar() {
        if (sidebar) {
            sidebar.classList.remove('visible');
            document.body.classList.remove('translator-sidebar-open');
        }
    }

    // Markdown renderer
    function renderMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
            .replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>')
            .replace(/<\/ul>\s*<ul>/g, '')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/g, '$1')
            .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, '$1');
    }

    // Translation function
    async function translateText(text, isWord = false) {
        if (!config.apiKey) {
            alert('Please configure your OpenRouter API key in the extension settings');
            return;
        }

        const trimmedText = text.trim();
        if (!trimmedText || trimmedText.length < 2) return;

        showSidebar();

        const translationArea = document.getElementById('translation-area');
        
        // Remove placeholder
        const placeholder = translationArea.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        // Add loading item
        const loadingId = 'loading-' + Date.now();
        const loadingItem = document.createElement('div');
        loadingItem.className = 'translation-item';
        loadingItem.id = loadingId;
        loadingItem.innerHTML = `
            <div class="original-text">${trimmedText}</div>
            <div class="translated-text">
                <span class="loading"></span> Translating...
            </div>
        `;
        
        translationArea.insertBefore(loadingItem, translationArea.firstChild);

        try {
            const prompt = isWord 
                ? config.wordPrompt.replace('{{text}}', trimmedText).replace('{{language}}', config.targetLanguage)
                : config.selectionPrompt.replace('{{text}}', trimmedText).replace('{{language}}', config.targetLanguage);

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Language Learning Extension'
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const translation = data.choices[0].message.content;

            // Update with translation and add follow-up functionality
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="original-text">${trimmedText}</div>
                    <div class="translated-text">${renderMarkdown(translation)}</div>
                    <div class="follow-up-section">
                        <button class="follow-up-button" data-translation-id="${loadingId}">Ask follow-up</button>
                        <div class="follow-up-input-container" id="input-${loadingId}" style="display: none;">
                            <input type="text" placeholder="Ask a question about this translation..." class="follow-up-input" />
                            <button class="send-follow-up" data-translation-id="${loadingId}">Send</button>
                        </div>
                        <div class="conversation-history" id="history-${loadingId}"></div>
                    </div>
                `;
                
                // Store conversation history for this translation
                loadingElement.conversationHistory = [
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: translation }
                ];
                
                // Add event listeners for follow-up functionality
                const followUpButton = loadingElement.querySelector('.follow-up-button');
                const sendButton = loadingElement.querySelector('.send-follow-up');
                const input = loadingElement.querySelector('.follow-up-input');
                
                followUpButton.addEventListener('click', () => toggleFollowUp(loadingId));
                sendButton.addEventListener('click', () => sendFollowUp(loadingId));
                
                // Add enter key support for follow-up input
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendFollowUp(loadingId);
                    }
                });
            }

        } catch (error) {
            console.error('Translation error:', error);
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="original-text">${trimmedText}</div>
                    <div class="translated-text error">
                        Translation failed: ${error.message}
                    </div>
                `;
            }
        }
    }

    // Get word at cursor position
    function getWordAtPosition(x, y) {
        const range = document.caretRangeFromPoint(x, y);
        if (!range) return null;

        const textNode = range.startContainer;
        if (textNode.nodeType !== Node.TEXT_NODE) return null;

        const text = textNode.textContent;
        let start = range.startOffset;
        let end = range.startOffset;

        // Find word boundaries
        while (start > 0 && /\w/.test(text[start - 1])) start--;
        while (end < text.length && /\w/.test(text[end])) end++;

        const word = text.substring(start, end);
        return word.length > 1 ? word : null;
    }

    // Clear translations
    function clearTranslations() {
        const translationArea = document.getElementById('translation-area');
        if (translationArea) {
            translationArea.innerHTML = `
                <div class="placeholder">
                    Select text or right-click words to see translations
                </div>
            `;
        }
    }

    // Follow-up functionality
    function toggleFollowUp(translationId) {
        const inputContainer = document.getElementById(`input-${translationId}`);
        const button = document.querySelector(`#${translationId} .follow-up-button`);
        
        if (inputContainer.style.display === 'none') {
            inputContainer.style.display = 'flex';
            button.textContent = 'Hide follow-up';
            // Focus on the input
            const input = inputContainer.querySelector('.follow-up-input');
            setTimeout(() => input.focus(), 100);
        } else {
            inputContainer.style.display = 'none';
            button.textContent = 'Ask follow-up';
        }
    }

    async function sendFollowUp(translationId) {
        const translationElement = document.getElementById(translationId);
        const input = translationElement.querySelector('.follow-up-input');
        const question = input.value.trim();
        
        if (!question) return;
        
        const historyContainer = document.getElementById(`history-${translationId}`);
        
        // Add user question to UI
        const questionDiv = document.createElement('div');
        questionDiv.className = 'follow-up-question';
        questionDiv.innerHTML = `<strong>You:</strong> ${question}`;
        historyContainer.appendChild(questionDiv);
        
        // Add loading response
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'follow-up-response';
        loadingDiv.innerHTML = `<strong>AI:</strong> <span class="loading"></span> Thinking...`;
        historyContainer.appendChild(loadingDiv);
        
        // Clear input and hide it
        input.value = '';
        document.getElementById(`input-${translationId}`).style.display = 'none';
        document.querySelector(`#${translationId} .follow-up-button`).textContent = 'Ask follow-up';
        
        try {
            // Get conversation history and add new question
            const conversationHistory = translationElement.conversationHistory || [];
            const messages = [...conversationHistory];
            
            // Keep only the last N turns (configurable)
            const maxTurns = config.maxConversationTurns * 2; // *2 because each turn has user+assistant
            if (messages.length > maxTurns) {
                messages.splice(0, messages.length - maxTurns);
            }
            
            messages.push({ role: 'user', content: question });

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Language Learning Extension'
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const answer = data.choices[0].message.content;

            // Update loading response with actual answer
            loadingDiv.innerHTML = `<strong>AI:</strong> ${renderMarkdown(answer)}`;
            
            // Update conversation history
            conversationHistory.push({ role: 'user', content: question });
            conversationHistory.push({ role: 'assistant', content: answer });
            translationElement.conversationHistory = conversationHistory;

        } catch (error) {
            console.error('Follow-up error:', error);
            loadingDiv.innerHTML = `<strong>AI:</strong> <span class="error">Failed to get response: ${error.message}</span>`;
        }
    }

    // Event listeners
    let selectionTimeout;
    let lastTranslationTime = 0;
    const TRANSLATION_COOLDOWN = 500; // 500ms cooldown between translations
    
    function canTranslate() {
        const now = Date.now();
        if (now - lastTranslationTime < TRANSLATION_COOLDOWN) {
            console.log('Translation on cooldown, skipping');
            return false;
        }
        lastTranslationTime = now;
        return true;
    }
    
    // Check if we're in an editable context
    function isInEditableContext(element) {
        // Check if the element itself or any parent is editable
        let current = element;
        while (current && current !== document.body) {
            // Input fields
            if (current.tagName === 'INPUT' || current.tagName === 'TEXTAREA') {
                return true;
            }
            // Contenteditable elements
            if (current.contentEditable === 'true') {
                return true;
            }
            // Code editors often have these attributes
            if (current.getAttribute('role') === 'textbox') {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }
    
    // Double-click handler
    document.addEventListener('dblclick', (e) => {
        // Skip if clicking on our sidebar
        if (e.target.closest('#language-translator-sidebar')) return;
        
        // Skip if in an editable context
        if (isInEditableContext(e.target)) {
            console.log('Double-click in editable context, skipping translation');
            return;
        }
        
        if (!canTranslate()) return;
        
        console.log('Double-click detected'); // Debug log
        
        // Small delay to let the selection happen, then translate
        setTimeout(() => {
            const selection = window.getSelection().toString().trim();
            console.log('Double-click selection:', selection); // Debug log
            if (selection) {
                translateText(selection, true);
            }
        }, 50);
    });

    // Selection change handler - only works when sidebar is open
    document.addEventListener('selectionchange', () => {
        // Only translate on highlight if sidebar is open
        if (!sidebar || !sidebar.classList.contains('visible')) {
            return;
        }
        
        // Check if current selection is in an editable context
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (range.startContainer) {
                const element = range.startContainer.nodeType === Node.TEXT_NODE 
                    ? range.startContainer.parentElement 
                    : range.startContainer;
                if (isInEditableContext(element)) {
                    console.log('Selection in editable context, skipping translation');
                    return;
                }
            }
        }
        
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            if (!canTranslate()) return;
            
            const selectedText = selection.toString().trim();
            
            if (selectedText.length > 1) {
                const isWord = /^\w+$/.test(selectedText);
                translateText(selectedText, isWord);
            }
        }, 300);
    });

    // Right-click handler removed per user request

    document.addEventListener('keydown', (e) => {
        // Toggle sidebar with Ctrl+Shift+T
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            if (sidebar && sidebar.classList.contains('visible')) {
                hideSidebar();
            } else {
                showSidebar();
            }
        }
        // Close sidebar with Escape
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('visible')) {
            hideSidebar();
        }
    });

    // Listen for config updates from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'configUpdated') {
            loadConfig();
        }
    });

    // Initialize
    async function init() {
        if (isInitialized) return;
        isInitialized = true;
        
        await loadConfig();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
