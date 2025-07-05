// Language Translator Extension - Popup Script
const defaultConfig = {
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    targetLanguage: 'English',
    wordPrompt: "Translate the word '{{text}}' into {{language}}. Provide a brief explanation if helpful.",
    selectionPrompt: "Translate this text into {{language}}: {{text}}",
    maxConversationTurns: 3,
    verificationModel: '',
    verificationPrompt: "Please verify this translation and provide the correct version if needed:\n\nOriginal: {{text}}\nTranslation: {{translation}}\nTarget Language: {{language}}"
};

// Load saved configuration
async function loadConfig() {
    try {
        const result = await chrome.storage.sync.get('translatorConfig');
        const config = result.translatorConfig || defaultConfig;
        
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('model').value = config.model || defaultConfig.model;
        document.getElementById('targetLanguage').value = config.targetLanguage || defaultConfig.targetLanguage;
        document.getElementById('wordPrompt').value = config.wordPrompt || defaultConfig.wordPrompt;
        document.getElementById('selectionPrompt').value = config.selectionPrompt || defaultConfig.selectionPrompt;
        document.getElementById('maxTurns').value = config.maxConversationTurns || defaultConfig.maxConversationTurns;
        document.getElementById('verificationModel').value = config.verificationModel || '';
        document.getElementById('verificationPrompt').value = config.verificationPrompt || defaultConfig.verificationPrompt;
    } catch (error) {
        showStatus('Failed to load settings', 'error');
    }
}

// Save configuration
async function saveConfig() {
    const config = {
        apiKey: document.getElementById('apiKey').value,
        model: document.getElementById('model').value,
        targetLanguage: document.getElementById('targetLanguage').value,
        wordPrompt: document.getElementById('wordPrompt').value,
        selectionPrompt: document.getElementById('selectionPrompt').value,
        maxConversationTurns: parseInt(document.getElementById('maxTurns').value) || 3,
        verificationModel: document.getElementById('verificationModel').value,
        verificationPrompt: document.getElementById('verificationPrompt').value
    };

    try {
        await chrome.storage.sync.set({ translatorConfig: config });
        showStatus('Settings saved successfully!', 'success');
        
        // Notify content script of config update
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'configUpdated' });
        }
    } catch (error) {
        showStatus('Failed to save settings', 'error');
    }
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Event listeners
document.getElementById('saveButton').addEventListener('click', saveConfig);

// Load config on popup open
loadConfig();
