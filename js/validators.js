/**
 * IBAN Validation functions
 */

import { STATE } from './data.js';
import { cleanIban } from './utils.js';

// CIN (Control Internal Number) lookup tables for Italian IBAN
// Used to calculate the check character at position 5
const CIN_ODD = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const CIN_EVEN = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const CIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Calculate CIN (Control Internal Number) from ABI+CAB+CC
 * @param {string} abi - ABI code (5 characters)
 * @param {string} cab - CAB code (5 characters)
 * @param {string} cc - Account number (12 characters)
 * @returns {string} Calculated CIN character (A-Z)
 */
export function calculateCIN(abi, cab, cc) {
    const bban = abi + cab + cc; // 22 characters
    let sum = 0;

    for (let i = 0; i < bban.length; i++) {
        const char = bban[i].toUpperCase();
        // Position is 1-indexed: odd positions use CIN_ODD, even use CIN_EVEN
        if ((i + 1) % 2 === 1) {
            sum += CIN_ODD[char] ?? 0;
        } else {
            sum += CIN_EVEN[char] ?? 0;
        }
    }

    return CIN_ALPHABET[sum % 26];
}

/**
 * Validate CIN (Control Internal Number) in Italian IBAN
 * The CIN is the character at position 5 (index 4)
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if CIN is valid
 */
export function isValidCIN(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return false;
    if (!iban.startsWith("IT")) return false;

    const cinFromIban = iban[4]; // Character at position 5 (0-indexed: 4)
    const abi = iban.substring(5, 10);
    const cab = iban.substring(10, 15);
    const cc = iban.substring(15, 27);

    const calculatedCIN = calculateCIN(abi, cab, cc);

    return cinFromIban === calculatedCIN;
}

/**
 * Validate IBAN using Modulo 97 algorithm (ISO 13616)
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid
 */
export function isIbanValid(iban) {
    iban = cleanIban(iban);
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let expanded = "";

    for (let i = 0; i < rearranged.length; i++) {
        const code = rearranged.charCodeAt(i);
        // A=65 maps to 10, B=66 maps to 11, etc.
        if (code >= 65 && code <= 90) {
            expanded += (code - 55).toString();
        } else {
            expanded += rearranged[i];
        }
    }

    // Modulo 97 on large number using block method
    let remainder = 0;
    for (let i = 0; i < expanded.length; i += 7) {
        const part = remainder.toString() + expanded.substring(i, i + 7);
        remainder = parseInt(part, 10) % 97;
    }

    return remainder === 1;
}

/**
 * Check if ABI code exists in loaded dictionary
 * Used for warning (not blocking validation)
 * @param {string} iban - IBAN to check
 * @returns {boolean} True if ABI is known in dictionary
 */
export function isKnownABI(iban) {
    if (iban.length < 10) return false;
    const abi = cleanIban(iban).substring(5, 10);
    return STATE.abiDictionary.hasOwnProperty(abi);
}

/**
 * Validate ABI code format (5 digits) - permissive check
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid ABI format
 */
export function isValidABI(iban) {
    if (iban.length < 10) return false;
    const abi = cleanIban(iban).substring(5, 10);
    // Just check format: 5 digits
    return /^\d{5}$/.test(abi);
}

/**
 * Validate CAB code format - permissive check (5 digits)
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid CAB format
 */
export function isValidCAB(iban) {
    iban = cleanIban(iban);
    if (iban.length < 15) return false;
    const cabStr = iban.substring(10, 15);
    // Permissive: just check that it's 5 digits
    return /^\d{5}$/.test(cabStr);
}

/**
 * Strict account number validation based on real-world observation of 300+ Italian IBANs
 * Pattern: 2 digits (or 'CC'), then 7 digits, then digit or 'X', then 2 digits
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if matches the strict pattern
 */
export function isStrictAccountNumber(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return false;
    const account = iban.substring(15);
    // Strict pattern based on empirical observation of Italian bank accounts
    return /^(?:\d{2}|CC)\d{7}[0-9X]\d{2}$/.test(account);
}

/**
 * Permissive account number validation (fallback)
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if 12 alphanumeric characters
 */
export function isValidAccountNumber(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return false;
    const account = iban.substring(15);
    // Permissive: 12 alphanumeric characters (fallback for rare formats)
    return /^[A-Z0-9]{12}$/.test(account);
}

/**
 * Validate complete Italian IBAN structure
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid Italian IBAN structure
 */
export function isItalianIbanStructure(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return false;
    if (!iban.startsWith("IT")) return false;
    if (!/^\d{2}$/.test(iban.substring(2, 4))) return false; // Check digits
    if (!/^[A-Z]$/.test(iban.substring(4, 5))) return false; // CIN format

    if (!isValidCIN(iban)) return false;  // CIN algorithm check
    if (!isValidABI(iban)) return false;
    if (!isValidCAB(iban)) return false;
    if (!isValidAccountNumber(iban)) return false;

    return true;
}

/**
 * Complete validation: Modulo 97 + Italian structure
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if completely valid
 */
export function isValidComplete(iban) {
    return isIbanValid(iban) && isItalianIbanStructure(iban);
}
