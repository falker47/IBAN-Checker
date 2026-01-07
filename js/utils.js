/**
 * Utility functions for IBAN Checker
 */

/**
 * Debounce function - delays execution until after wait ms have passed
 * since the last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fetch JSON data from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<any|null>} Parsed JSON or null on error
 */
export async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`Failed loading ${url}:`, err);
        return null;
    }
}

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 */
export function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => console.log("Copiato:", text))
            .catch(err => console.error("Copy failed:", err));
    } else {
        // Fallback for older browsers
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
        } catch (e) {
            console.error("Fallback copy failed", e);
        }
        document.body.removeChild(temp);
    }
}

/**
 * Paste text from clipboard into an input element
 * @param {HTMLInputElement} inputElement - Input element to paste into
 */
export async function pasteFromClipboard(inputElement) {
    if (!navigator.clipboard?.readText) {
        alert("Incolla non supportato o permessi negati.");
        return;
    }
    try {
        const text = await navigator.clipboard.readText();
        inputElement.value = text;
        // Trigger input event for real-time validation
        inputElement.dispatchEvent(new Event('input'));
    } catch (err) {
        console.warn("Clipboard read failed:", err);
        alert("Impossibile accedere agli appunti.");
    }
}

/**
 * Clean IBAN string - uppercase and remove spaces
 * @param {string} iban - IBAN to clean
 * @returns {string} Cleaned IBAN
 */
export function cleanIban(iban) {
    return iban.toUpperCase().replace(/\s+/g, "");
}

/**
 * Format IBAN with spaces for display
 * @param {string} iban - IBAN to format
 * @returns {string} Formatted IBAN
 */
export function formatIban(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return iban;
    return `${iban.slice(0, 2)} ${iban.slice(2, 4)} ${iban.slice(4, 5)} ${iban.slice(5, 10)} ${iban.slice(10, 15)} ${iban.slice(15)}`;
}
