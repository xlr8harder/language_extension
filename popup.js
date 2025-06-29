// Language Translator Extension - Popup Script
const defaultConfig = {
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    targetLanguage: 'English',
    wordPrompt: "Translate the word '{{text}}' into {{language}}. Provide a brief explanation.",
    selectionPrompt: "Translate this text into {{language}}: {{text}}"
};

// Load saved configuration
async function loadConfig() {
    try {
        const result = await chrome.storage.sync.get('translatorConfig');
        const config = result.translatorConfig || defaultConfig;
        
        document.getElementById('apiKey').value = config.apiKey;
        document.getElementById('model').value = config.model;
        document.getElementById('targetLanguage').value = config.targetLanguage;
        document.getElementById('wordPrompt').value = config.wordPrompt;
        document.getElementById('selectionPrompt').value = config.selectionPrompt;
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
        selectionPrompt: document.getElementById('selectionPrompt').value
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
