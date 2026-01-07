/**
 * IBAN Correction Logic
 */

import { isValidComplete } from './validators.js';
import { cleanIban } from './utils.js';

const VALID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Find possible corrections for an invalid IBAN
 * Tries single character substitutions and character swaps
 * @param {string} ibanOrig - Original invalid IBAN
 * @returns {string[]} Array of valid IBAN corrections
 */
export function findCorrections(ibanOrig) {
    const results = new Set();
    ibanOrig = cleanIban(ibanOrig);

    // Strategy 1: Single character substitution
    for (let i = 0; i < ibanOrig.length; i++) {
        for (const c of VALID_CHARS) {
            if (c === ibanOrig[i]) continue;
            const candidate = ibanOrig.slice(0, i) + c + ibanOrig.slice(i + 1);
            if (isValidComplete(candidate)) {
                results.add(candidate);
            }
        }
    }

    // Strategy 2: Adjacent and non-adjacent character swaps
    const arr = ibanOrig.split("");
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            // Swap
            [arr[i], arr[j]] = [arr[j], arr[i]];
            const candidate = arr.join("");
            if (isValidComplete(candidate)) {
                results.add(candidate);
            }
            // Swap back
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    return Array.from(results);
}
