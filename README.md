# Language Learning Translator Extension

A Chrome/Edge browser extension that helps you learn foreign languages by providing instant AI-powered translations. Double-click words or highlight text to get translations in a convenient sidebar panel.

## Features

- **Double-click Translation**: Double-click any word for instant translation and sidebar opening
- **Highlight Translation**: Highlight text for translation when sidebar is open
- **AI-Powered**: Uses OpenRouter API with support for multiple AI models (Claude, GPT-4, Gemini, etc.)
- **Non-Intrusive**: All translations appear in a sidebar without disrupting webpage layout
- **Customizable**: Configure target language, AI model, and translation prompts
- **Markdown Support**: Formatted responses with rich text rendering
- **Translation History**: Keep track of all your translations in one session
- **Keyboard Shortcuts**: Quick sidebar access with Ctrl+Shift+T
- **Universal Compatibility**: Works on any website

## Installation

### Step 1: Download the Extension

1. **Download or clone** this repository to your computer
2. **Extract** the files to a folder (e.g., `language-translator-extension`)

### Step 2: Install in Browser

1. **Open Chrome or Edge** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** (toggle switch in the top right corner)
3. **Click "Load unpacked"** and select your extension folder
4. **Pin the extension** to your browser toolbar (click the puzzle piece icon, then pin)

### Step 3: Get an API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to your API Keys section
4. Generate a new API key (starts with `sk-or-`)
5. Copy the key for the next step

### Step 4: Configure the Extension

1. **Click the extension icon** in your browser toolbar
2. **Enter your OpenRouter API key** in the settings popup
3. **Configure your preferences**:
   - **Model**: Enter any OpenRouter model (e.g., `anthropic/claude-3.5-sonnet`)
   - **Target Language**: Select the language you want translations in
   - **Prompts**: Customize how the AI translates words vs longer selections
4. **Click "Save Settings"**

## How to Use

### Method 1: Double-Click Words
- **Double-click any word** on any webpage
- The sidebar will automatically open and show the translation
- Perfect for quick vocabulary lookups while reading

### Method 2: Highlight Text (Sidebar Open)
- **Open the sidebar first** using `Ctrl+Shift+T` or the extension icon
- **Highlight any text** (words, phrases, sentences, paragraphs)
- Translation appears automatically in the sidebar
- Great for translating longer passages or specific phrases

### Sidebar Controls
- **Toggle sidebar**: Press `Ctrl+Shift+T` or click the extension icon
- **Close sidebar**: Press `Escape` or click the × button in sidebar header
- **Clear translations**: Click "Clear All" to remove translation history
- **Access settings**: Click "Settings" button in the sidebar footer

### Keyboard Shortcuts
- `Ctrl+Shift+T`: Toggle sidebar visibility
- `Escape`: Close sidebar (when sidebar is open)

## Configuration Options

### Recommended Models

You can use any model available on OpenRouter. Here are some popular choices:

- `anthropic/claude-3.5-sonnet` - Best overall translation quality
- `openai/gpt-4o-mini` - Fast and cost-effective
- `openai/gpt-4o` - Premium quality translations  
- `google/gemini-pro-1.5` - Good alternative option
- `meta-llama/llama-3.1-8b-instruct` - Open source option

### Custom Translation Prompts

Customize how translations work by editing the prompt templates in settings:

**Word Translation Prompt** (for double-clicked words):
```
Translate the word '{{text}}' into {{language}}. Provide a brief explanation.
```

**Selection Translation Prompt** (for highlighted text):
```
Translate this text into {{language}}: {{text}}
```

**Template Variables:**
- `{{text}}` - The selected text or word
- `{{language}}` - Your chosen target language

## Workflow Examples

### Learning While Reading Articles
1. Open an article in a foreign language
2. Double-click unknown words for quick definitions
3. When you want to understand longer passages, press `Ctrl+Shift+T` to open sidebar
4. Highlight sentences or paragraphs for full translation
5. Keep sidebar open to continue highlighting text for translation

### Vocabulary Building
1. Double-click words you don't know
2. Read the AI explanation in the sidebar
3. Continue reading and double-clicking new words
4. All translations stay in your sidebar history for review

### Understanding Complex Text
1. Open sidebar with `Ctrl+Shift+T`
2. Highlight phrases, sentences, or paragraphs
3. Get instant contextual translations
4. Use "Clear All" to start fresh when moving to new content

## Privacy & Security

- **Local storage only**: Your API key and settings stay on your device
- **No data collection**: We don't collect or store your translations
- **Direct API calls**: Communications go directly to OpenRouter
- **Open source**: Full source code available for review

## Troubleshooting

### Extension Won't Load
- Ensure all files are in the same folder
- Check that Developer Mode is enabled in `chrome://extensions/`
- Verify `manifest.json` is present and valid

### Double-Click Not Working
- Make sure you've saved your API key in settings
- Check browser console for error messages (F12 → Console tab)
- Try refreshing the webpage after configuring the extension

### Translations Not Appearing
- Verify your OpenRouter API key is correct and has credits
- Check your internet connection
- Try a different model if one isn't responding
- For highlight translation: ensure sidebar is open first

### Sidebar Issues
- Use `Ctrl+Shift+T` to toggle sidebar
- Check if extension is enabled in `chrome://extensions/`
- Refresh the webpage and try again

## API Costs

Translation costs depend on your chosen model and usage:

- **GPT-4o Mini**: ~$0.15 per 1M tokens (most cost-effective)
- **Claude 3.5 Sonnet**: ~$3 per 1M tokens (best quality)
- **GPT-4o**: ~$5 per 1M tokens (premium option)

**Typical usage**: A few cents per day for moderate language learning (50-100 translations)

## Development

### File Structure
```
language-translator-extension/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality
├── content.css           # Sidebar styling
├── popup.html           # Settings interface
├── popup.js             # Settings logic
├── background.js        # Extension background service
└── README.md           # This file
```

### Making Changes
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the reload button on the extension
4. Test your changes on any webpage

## Support

- **Issues**: Report bugs via GitHub Issues
- **API Questions**: Check [OpenRouter Documentation](https://openrouter.ai/docs)
- **Feature Requests**: Submit via GitHub Issues

## License

MIT License - Feel free to modify and distribute.

---

**Happy Language Learning!** 🌍📚

*Tip: Start with double-clicking words to build vocabulary, then graduate to highlighting full sentences for contextual understanding.*
