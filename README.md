# IBAN Checker 🏦

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Font Awesome](https://img.shields.io/badge/Font_Awesome-339AF0?style=for-the-badge&logo=fontawesome&logoColor=white)

A browser-based Italian IBAN format and checksum checker with real-time feedback. Built with ES6 modules and a glassmorphism UI.

**Live demo:** https://falker47.github.io/IBAN-Checker/

## ✨ Features

### Real-time Validation

- **Automatic feedback** as you type, with a 300 ms debounce
- **6 validation indicators**: Format, Mod.97, CIN, ABI, CAB, CC
- **3-state indicators**: ✅ Valid, ⚠️ Warning, ❌ Invalid

Each indicator reports the result of its own check. A green indicator does not establish that a bank account exists or can receive payments.

### Comprehensive Checks

- **Italian IBAN format**: 27 characters beginning with `IT`, followed by two international check digits, one national CIN letter, five-digit ABI and CAB codes, and a 12-character alphanumeric account number
- **Modulo 97**: International check-digit verification using the MOD 97-10 algorithm defined by ISO/IEC 7064 and used in IBAN validation under ISO 13616
- **CIN Algorithm**: Verification of the Italian national control character
- **ABI Lookup**: Matches bank identification codes against the bundled `ABI-List.json`, containing more than 1,800 records. These are directory entries, not necessarily distinct or currently operating banks
- **CAB Validation**: Checks the five-digit branch-code format and uses the bundled `CAB-List.json` for locality information. It does not verify that a particular bank operates a branch at that location
- **CC Validation**: Accepts the 12-character alphanumeric account-number format and applies an additional heuristic pattern to distinguish common-looking values

### Smart Features

- **Bank & Locality Info**: Displays the bank name associated with an ABI code and a locality hint derived from CAB data, where available
- **Typo Correction**: Suggests possible alternatives using single-character substitutions or swaps between two character positions. Suggestions must pass the same structural and checksum validation as ordinary inputs
- **Clipboard Support**: Paste an IBAN from the clipboard or copy a result using the browser's clipboard capabilities
- **Responsive Design**: Works on desktop and mobile

## 🚀 Usage

### Quick Start

1. Clone the repository.
2. Open `index.html` through a local server, such as VS Code Live Server.
3. Enter an Italian IBAN. Validation results appear automatically.

> **Note:** A local server is required because the application uses ES6 module imports and fetches local JSON files. Opening `index.html` directly from the filesystem may prevent these resources from loading.

The bank and locality datasets are loaded when the application starts. If they cannot be loaded, lookup information may be unavailable, even though the mathematical checks can still run.

### Development

```bash
# Install dependencies
npm install

# Watch for CSS changes
npm run watch

# Build for production
npm run build
```

### Testing

```bash
npm test
```

The Vitest suite covers the core Italian IBAN structure, Mod.97, CIN, ABI/CAB and account-number validation, input formatting utilities, and typo-correction behavior.

These are automated tests of the implemented logic, not verification against live banking systems.

## 📁 Project Structure

```text
├── index.html              # Main HTML file
├── style.css               # Compiled Tailwind CSS
├── src/
│   └── input.css           # Tailwind CSS source
├── js/
│   ├── main.js             # App initialization
│   ├── validators.js       # Validation functions (CIN, Mod97, etc.)
│   ├── validators.test.js  # Core validation tests
│   ├── corrections.js      # Typo correction logic
│   ├── corrections.test.js # Typo correction tests
│   ├── ui.js               # UI updates and indicators
│   ├── data.js             # Bank data loading
│   ├── utils.js            # Utilities (debounce, clipboard)
│   └── utils.test.js       # Utility tests
├── ABI-List.json           # Bundled ABI directory
├── CAB-List.json           # Bundled CAB/locality data
├── package.json            # Development scripts and dependencies
└── package-lock.json       # Dependency lockfile
```

## 🔧 Technologies

- **HTML5** — Semantic markup
- **JavaScript ES6+** — Modular architecture
- **Tailwind CSS** — Utility-first styling
- **Font Awesome** — Icons
- **Vitest** — Unit tests

## 📋 Validation Logic

| Check | Green ✅ | Yellow ⚠️ | Red ❌ |
| --- | --- | --- | --- |
| **ABI** | Code found in the local directory | Five-digit code not found in the directory | Invalid code format |
| **CC** | Matches the additional strict heuristic | Valid 12-character alphanumeric format, but does not match the strict heuristic | Invalid account-number format |

The **Format** indicator checks the normalized input length. Complete validation also checks the Italian prefix, character constraints, national CIN and international checksum.

The strict CC pattern is an empirical heuristic, not an additional official IBAN requirement. An account number that passes the permissive alphanumeric check but fails the strict heuristic can still be formally valid.

## ⚠️ Scope and Limitations

**IBAN Checker validates the formal structure and check digits of Italian IBANs. It does not verify real accounts.**

A formally valid result does not prove that:

- The account exists, is open or can receive payments.
- The identified bank or branch is currently operating.
- The account belongs to the intended beneficiary.

The ABI and CAB information comes from bundled local datasets. Their original sources, complete update history and current accuracy are not established by the repository. A directory match should therefore be treated as informational rather than authoritative.

Similarly, suggested typo corrections are mathematically plausible alternatives, not confirmed reconstructions of the intended IBAN. **Never use a suggested IBAN for a payment without independently confirming it with the recipient.**

The application does not implement Verification of Payee (VoP), which is a separate process for checking the correspondence between an IBAN and a beneficiary's identity through participating payment service providers.

For official background, consult the [Swift IBAN Registry](https://www.swift.com/standards/data-standards/iban-international-bank-account-number), [Banca d'Italia's IBAN guide](https://economiapertutti.bancaditalia.it/aree-tematiche/pagamenti/iban/index.html) and the [European Payments Council's Verification of Payee scheme](https://www.europeanpaymentscouncil.eu/document-library/rulebooks/verification-payee-scheme-rulebook).

## 🔒 Privacy and Data Handling

IBAN validation is performed in the browser. The application code does not submit entered IBANs to an application server or explicitly store them in application storage.

The page loads its bundled ABI/CAB JSON datasets and a Font Awesome stylesheet from cdnjs. These resource requests are separate from IBAN validation. Browser autofill, clipboard access and clipboard retention depend on browser settings and permissions.

## 📄 License

The repository currently has no `LICENSE` file or `license` declaration in `package.json`. Although `package-lock.json` still contains `ISC` metadata, the project's licensing terms are not clearly established by the published files. Contact the author to clarify reuse and redistribution rights.
