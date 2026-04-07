/**
 * IBAN Correction Logic
 */

import { isValidCompleteClean, isIbanValidClean } from './validators.js';
import { cleanIban } from './utils.js';

const VALID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Positions 0-1 are always "IT" - no point substituting them
const SUBST_START = 2;

/**
 * Find possible corrections for an invalid IBAN
 * Tries single character substitutions and character swaps
 * Uses early Mod.97 exit and skips fixed "IT" prefix for performance
 * @param {string} ibanOrig - Original invalid IBAN
 * @returns {string[]} Array of valid IBAN corrections
 */
export function findCorrections(ibanOrig) {
    const results = new Set();
    ibanOrig = cleanIban(ibanOrig);

    // Strategy 1: Single character substitution (skip "IT" prefix)
    for (let i = SUBST_START; i < ibanOrig.length; i++) {
        for (const c of VALID_CHARS) {
            if (c === ibanOrig[i]) continue;
            const candidate = ibanOrig.slice(0, i) + c + ibanOrig.slice(i + 1);
            // Early exit: Mod.97 is the most discriminating check
            if (isIbanValidClean(candidate) && isValidCompleteClean(candidate)) {
                results.add(candidate);
            }
        }
    }

    // Strategy 2: Adjacent and non-adjacent character swaps
    const arr = ibanOrig.split("");
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) continue; // Skip identical chars
            [arr[i], arr[j]] = [arr[j], arr[i]];
            const candidate = arr.join("");
            if (isIbanValidClean(candidate) && isValidCompleteClean(candidate)) {
                results.add(candidate);
            }
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    return Array.from(results);
}
