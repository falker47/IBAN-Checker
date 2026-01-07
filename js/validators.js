/**
 * IBAN Validation functions
 */

import { STATE } from './data.js';
import { cleanIban } from './utils.js';

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
 * Validate ABI code against loaded dictionary
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid ABI
 */
export function isValidABI(iban) {
    if (iban.length < 10) return false;
    const abi = cleanIban(iban).substring(5, 10);
    return STATE.abiDictionary.hasOwnProperty(abi);
}

/**
 * Validate CAB code against known ranges and loaded list
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid CAB
 */
export function isValidCAB(iban) {
    iban = cleanIban(iban);
    if (iban.length < 15) return false;
    const cabStr = iban.substring(10, 15);
    if (!/^\d{5}$/.test(cabStr)) return false;

    const numericCAB = parseInt(cabStr, 10);

    // Check known ranges for Italian municipalities
    if ((numericCAB > 999 && numericCAB < 4999) ||    // Capoluoghi Regione
        (numericCAB > 9999 && numericCAB < 17500) ||    // Capoluoghi Provincia
        (numericCAB > 19999 && numericCAB < 26400) ||   // Comuni L
        (numericCAB > 29999 && numericCAB < 85230) ||   // Comuni M (subset 1)
        (numericCAB > 85249 && numericCAB < 85450) ||   // Comuni M (subset 2)
        (numericCAB > 85769 && numericCAB < 89930)) {   // Comuni M (subset 3)
        return true;
    }

    // Check loaded list
    if (STATE.cabList.length > 0) {
        return STATE.cabList.some(rec => numericCAB >= rec.base && numericCAB <= rec.upper);
    }
    return false;
}

/**
 * Validate account number format
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid account number format
 */
export function isValidAccountNumber(iban) {
    iban = cleanIban(iban);
    if (iban.length !== 27) return false;
    const account = iban.substring(15);
    // Pattern: 2 digits or 'CC', then 7 digits, then digit or 'X', then 2 digits
    return /^(?:\d{2}|CC)\d{7}[0-9X]\d{2}$/.test(account);
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
    if (!/^[A-Z]$/.test(iban.substring(4, 5))) return false; // CIN

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
