// Language Learning Extension - Content Script
(function() {
    'use strict';

    let config = {
        apiKey: '',
        model: 'google/gemini-2.5-flash',
        targetLanguage: 'English',
        wordPrompt: "Translate the word '{{text}}' into {{language}}. Provide a brief explanation if helpful.",
        selectionPrompt: "Translate this text into {{language}}: {{text}}"
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
                    max_tokens: 4000,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const translation = data.choices[0].message.content;

            // Update with translation
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="original-text">${trimmedText}</div>
                    <div class="translated-text">${renderMarkdown(translation)}</div>
                `;
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
    
    // Double-click handler
    document.addEventListener('dblclick', (e) => {
        // Skip if clicking on our sidebar
        if (e.target.closest('#language-translator-sidebar')) return;
        
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
        
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            if (!canTranslate()) return;
            
            const selection = window.getSelection();
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
