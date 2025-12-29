# IBAN Checker

A modern, client-side web application for validating Italian IBAN codes. This tool checks the structural validity of an IBAN, performs the Modulo 97 control digit check, and validates the bank (ABI) and branch (CAB) codes against a provided list.

## Features

- **Format Validation**: Checks for correct length (27 characters) and starting country code (IT).
- **Control Digit Verification**: Performs the standard Modulo 97 check to ensure the IBAN is mathematically valid.
- **Bank & Branch Lookup**: Resolves and displays the Bank name and Branch location (Comune) using `ABI-List.json` and `CAB-List.json`.
- **Intelligent Corrections**: If an IBAN is invalid, the tool suggests possible corrections based on common typing errors (single character substitution or swaps).
- **Responsive Design**: Built with Tailwind CSS for a modern, glassmorphism-inspired UI that works on desktop and mobile.
- **Copy to Clipboard**: Easily copy the formatted IBAN or suggested corrections.

## Usage

### Running Locally

1.  **Clone the repository** (or download the source code).
2.  **Open `index.html`** in your web browser.

Since the application uses relative paths to fetch JSON data (`ABI-List.json` and `CAB-List.json`), it should run directly in most modern browsers. However, for the best experience (and to avoid potential CORS policies on some strict local environments), it is recommended to run it via a local server (e.g., Live Server in VS Code).

### Development

To modify the styles or develop further:

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Watch for CSS changes** (requires Tailwind CSS):
    ```bash
    npm run watch
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

## Technologies

- **HTML5**
- **JavaScript (ES6+)**
- **Tailwind CSS**
- **Font Awesome** (for icons)

## License

ISC
