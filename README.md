# IBAN Checker 🏦

A modern, real-time Italian IBAN validation tool with instant feedback. Built with ES6 modules and a glassmorphism UI.

## ✨ Features

### Real-time Validation

- **Instant feedback** as you type (no button click needed)
- **6 validation indicators**: Format, Mod.97, CIN, ABI, CAB, CC
- **3-state indicators**: ✅ Valid, ⚠️ Warning, ❌ Invalid

### Comprehensive Checks

- **Format Validation**: 27 characters, starts with IT
- **Modulo 97**: ISO 13616 international standard
- **CIN Algorithm**: Italian Control Internal Number verification
- **ABI Lookup**: Bank identification with 1800+ banks database
- **CAB Validation**: Branch code format check
- **CC Validation**: Account number pattern (hybrid strict + permissive)

### Smart Features

- **Bank & Branch Info**: Displays bank name and branch location
- **Typo Correction**: Suggests fixes for invalid IBANs (single char substitution, swaps)
- **Clipboard Support**: Paste from clipboard, copy results
- **Responsive Design**: Works on desktop and mobile

## 🚀 Usage

### Quick Start

1. Clone the repository
2. Open `index.html` via a local server (e.g., VS Code Live Server)
3. Start typing an IBAN - results appear instantly!

> **Note**: A local server is required due to ES6 module imports and JSON fetch requests.

### Development

```bash
# Install dependencies
npm install

# Watch for CSS changes
npm run watch

# Build for production
npm run build
```

## 📁 Project Structure

```
├── index.html              # Main HTML file
├── style.css               # Compiled Tailwind CSS
├── js/
│   ├── main.js             # App initialization
│   ├── validators.js       # Validation functions (CIN, Mod97, etc.)
│   ├── corrections.js      # Typo correction logic
│   ├── ui.js               # UI updates and indicators
│   ├── data.js             # Bank data loading
│   └── utils.js            # Utilities (debounce, clipboard)
├── ABI-List.json           # 1800+ Italian bank codes
└── CAB-List.json           # Branch codes database
```

## 🔧 Technologies

- **HTML5** - Semantic markup
- **JavaScript ES6+** - Modular architecture
- **Tailwind CSS** - Utility-first styling
- **Font Awesome** - Icons

## 📋 Validation Logic

| Check   | Green ✅               | Yellow ⚠️                  | Red ❌         |
| ------- | ---------------------- | -------------------------- | -------------- |
| **ABI** | Known bank             | Valid format, unknown bank | Invalid format |
| **CC**  | Matches strict pattern | Matches permissive only    | Invalid        |

The CC strict pattern is based on empirical analysis of 300+ real Italian IBANs from various banks.

## 📄 License

ISC
