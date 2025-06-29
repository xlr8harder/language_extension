// Language Translator Extension - Background Script
chrome.runtime.onInstalled.addListener(() => {
    console.log('Language Translator Extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.action.openPopup();
    }
});
