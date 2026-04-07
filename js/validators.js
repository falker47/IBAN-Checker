/**
 * IBAN Validation functions
 */

import { STATE } from './data.js';
import { cleanIban } from './utils.js';

// Italian IBAN position constants
export const POS = {
    CHECK_START: 2, CHECK_END: 4,
    CIN: 4,
    ABI_START: 5, ABI_END: 10,
    CAB_START: 10, CAB_END: 15,
    CC_START: 15, CC_END: 27,
    LENGTH: 27,
    PREFIX: "IT"
};

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
        if ((i + 1) % 2 === 1) {
            sum += CIN_ODD[char] ?? 0;
        } else {
            sum += CIN_EVEN[char] ?? 0;
        }
    }

    return CIN_ALPHABET[sum % 26];
}

// --- Internal validators (work on already-cleaned IBAN, no redundant cleanIban calls) ---

function _isValidCIN(iban) {
    if (iban.length !== POS.LENGTH || !iban.startsWith(POS.PREFIX)) return false;
    const cinFromIban = iban[POS.CIN];
    const abi = iban.substring(POS.ABI_START, POS.ABI_END);
    const cab = iban.substring(POS.CAB_START, POS.CAB_END);
    const cc = iban.substring(POS.CC_START, POS.CC_END);
    return cinFromIban === calculateCIN(abi, cab, cc);
}

function _isIbanValid(iban) {
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let expanded = "";
    for (let i = 0; i < rearranged.length; i++) {
        const code = rearranged.charCodeAt(i);
        if (code >= 65 && code <= 90) {
            expanded += (code - 55).toString();
        } else {
            expanded += rearranged[i];
        }
    }
    let remainder = 0;
    for (let i = 0; i < expanded.length; i += 7) {
        const part = remainder.toString() + expanded.substring(i, i + 7);
        remainder = parseInt(part, 10) % 97;
    }
    return remainder === 1;
}

function _isValidABI(iban) {
    if (iban.length < POS.ABI_END) return false;
    return /^\d{5}$/.test(iban.substring(POS.ABI_START, POS.ABI_END));
}

function _isValidCAB(iban) {
    if (iban.length < POS.CAB_END) return false;
    return /^\d{5}$/.test(iban.substring(POS.CAB_START, POS.CAB_END));
}

function _isStrictAccountNumber(iban) {
    if (iban.length !== POS.LENGTH) return false;
    return /^(?:\d{2}|CC)\d{7}[0-9X]\d{2}$/.test(iban.substring(POS.CC_START));
}

function _isValidAccountNumber(iban) {
    if (iban.length !== POS.LENGTH) return false;
    return /^[A-Z0-9]{12}$/.test(iban.substring(POS.CC_START));
}

function _isItalianIbanStructure(iban) {
    if (iban.length !== POS.LENGTH) return false;
    if (!iban.startsWith(POS.PREFIX)) return false;
    if (!/^\d{2}$/.test(iban.substring(POS.CHECK_START, POS.CHECK_END))) return false;
    if (!/^[A-Z]$/.test(iban[POS.CIN])) return false;
    if (!_isValidCIN(iban)) return false;
    if (!_isValidABI(iban)) return false;
    if (!_isValidCAB(iban)) return false;
    if (!_isValidAccountNumber(iban)) return false;
    return true;
}

/**
 * Internal complete validation on already-cleaned IBAN (used by corrections)
 * @param {string} iban - Pre-cleaned IBAN string
 * @returns {boolean} True if completely valid
 */
export function isValidCompleteClean(iban) {
    return _isIbanValid(iban) && _isItalianIbanStructure(iban);
}

/**
 * Internal Mod.97 check on already-cleaned IBAN (used for early-exit in corrections)
 * @param {string} iban - Pre-cleaned IBAN string
 * @returns {boolean} True if Mod.97 passes
 */
export function isIbanValidClean(iban) {
    return _isIbanValid(iban);
}

// --- Public validators (clean IBAN before checking, used by UI) ---

/** @see _isValidCIN */
export function isValidCIN(iban) { return _isValidCIN(cleanIban(iban)); }

/** @see _isIbanValid */
export function isIbanValid(iban) { return _isIbanValid(cleanIban(iban)); }

/** Check if ABI code exists in loaded dictionary */
export function isKnownABI(iban) {
    const clean = cleanIban(iban);
    if (clean.length < POS.ABI_END) return false;
    return STATE.abiDictionary.hasOwnProperty(clean.substring(POS.ABI_START, POS.ABI_END));
}

/** @see _isValidABI */
export function isValidABI(iban) { return _isValidABI(cleanIban(iban)); }

/** @see _isValidCAB */
export function isValidCAB(iban) { return _isValidCAB(cleanIban(iban)); }

/** @see _isStrictAccountNumber */
export function isStrictAccountNumber(iban) { return _isStrictAccountNumber(cleanIban(iban)); }

/** @see _isValidAccountNumber */
export function isValidAccountNumber(iban) { return _isValidAccountNumber(cleanIban(iban)); }

/** @see _isItalianIbanStructure */
export function isItalianIbanStructure(iban) { return _isItalianIbanStructure(cleanIban(iban)); }

/**
 * Complete validation: Modulo 97 + Italian structure
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if completely valid
 */
export function isValidComplete(iban) {
    const clean = cleanIban(iban);
    return _isIbanValid(clean) && _isItalianIbanStructure(clean);
}
