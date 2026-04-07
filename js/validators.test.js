import { describe, it, expect } from 'vitest';
import { calculateCIN, isValidCIN, isIbanValid, isValidABI, isValidCAB, isStrictAccountNumber, isValidAccountNumber, isItalianIbanStructure, isValidComplete, isValidCompleteClean, POS } from './validators.js';

// Test IBAN: IT60X0542811101000000123456 (example from Italian banking standards)
// We use the standard example: IT47X0123456789000000123456 (may not pass CIN)
// Let's compute a valid one: we need CIN to match

describe('POS constants', () => {
    it('should define correct IBAN positions', () => {
        expect(POS.LENGTH).toBe(27);
        expect(POS.PREFIX).toBe("IT");
        expect(POS.CIN).toBe(4);
        expect(POS.ABI_START).toBe(5);
        expect(POS.ABI_END).toBe(10);
        expect(POS.CAB_START).toBe(10);
        expect(POS.CAB_END).toBe(15);
        expect(POS.CC_START).toBe(15);
        expect(POS.CC_END).toBe(27);
    });
});

describe('calculateCIN', () => {
    it('should return a letter A-Z', () => {
        const cin = calculateCIN('01234', '56789', '000000123456');
        expect(cin).toMatch(/^[A-Z]$/);
    });

    it('should be deterministic', () => {
        const cin1 = calculateCIN('01234', '56789', '000000123456');
        const cin2 = calculateCIN('01234', '56789', '000000123456');
        expect(cin1).toBe(cin2);
    });

    it('should change with different input', () => {
        const cin1 = calculateCIN('01234', '56789', '000000123456');
        const cin2 = calculateCIN('01234', '56789', '000000123457');
        expect(cin1).not.toBe(cin2);
    });
});

describe('isIbanValid (Mod.97)', () => {
    it('should validate correct Mod.97 IBAN', () => {
        // Known valid IBAN: IT60X0542811101000000123456
        expect(isIbanValid('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject incorrect check digits', () => {
        expect(isIbanValid('IT00X0542811101000000123456')).toBe(false);
    });

    it('should handle spaces in input', () => {
        expect(isIbanValid('IT60 X054 2811 1010 0000 0123 456')).toBe(true);
    });

    it('should handle lowercase input', () => {
        expect(isIbanValid('it60x0542811101000000123456')).toBe(true);
    });

    it('should reject wrong length', () => {
        expect(isIbanValid('IT60X054281110100000012345')).toBe(false);
    });
});

describe('isValidABI', () => {
    it('should accept 5-digit ABI', () => {
        expect(isValidABI('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject non-digit ABI', () => {
        expect(isValidABI('IT60XABCD811101000000123456')).toBe(false);
    });

    it('should reject too-short input', () => {
        expect(isValidABI('IT60X')).toBe(false);
    });
});

describe('isValidCAB', () => {
    it('should accept 5-digit CAB', () => {
        expect(isValidCAB('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject non-digit CAB', () => {
        expect(isValidCAB('IT60X05428ABCDE000000123456')).toBe(false);
    });
});

describe('isStrictAccountNumber', () => {
    it('should accept standard account numbers', () => {
        // Account: 000000123456 - starts with 2 digits, 7 digits, digit, 2 digits
        expect(isStrictAccountNumber('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject wrong length IBAN', () => {
        expect(isStrictAccountNumber('IT60X054281110100000012345')).toBe(false);
    });
});

describe('isValidAccountNumber', () => {
    it('should accept 12 alphanumeric chars', () => {
        expect(isValidAccountNumber('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject wrong length', () => {
        expect(isValidAccountNumber('IT60X054281110100000012345')).toBe(false);
    });
});

describe('isValidCIN', () => {
    it('should validate correct CIN', () => {
        // Build an IBAN with correct CIN
        const abi = '05428';
        const cab = '11101';
        const cc = '000000123456';
        const cin = calculateCIN(abi, cab, cc);
        const iban = `IT60${cin}${abi}${cab}${cc}`;
        expect(isValidCIN(iban)).toBe(true);
    });

    it('should reject wrong CIN', () => {
        const iban = 'IT60A0542811101000000123456';
        const cin = calculateCIN('05428', '11101', '000000123456');
        if (cin !== 'A') {
            expect(isValidCIN(iban)).toBe(false);
        }
    });

    it('should reject non-IT IBAN', () => {
        expect(isValidCIN('DE60X0542811101000000123456')).toBe(false);
    });

    it('should reject wrong length', () => {
        expect(isValidCIN('IT60X054281110100000012345')).toBe(false);
    });
});

describe('isItalianIbanStructure', () => {
    it('should accept correctly structured IBAN', () => {
        // Build a structurally valid IBAN
        const abi = '05428';
        const cab = '11101';
        const cc = '000000123456';
        const cin = calculateCIN(abi, cab, cc);
        const iban = `IT60${cin}${abi}${cab}${cc}`;
        expect(isItalianIbanStructure(iban)).toBe(true);
    });

    it('should reject non-IT prefix', () => {
        expect(isItalianIbanStructure('DE89370400440532013000')).toBe(false);
    });

    it('should reject wrong length', () => {
        expect(isItalianIbanStructure('IT60X054281110100000012')).toBe(false);
    });
});

describe('isValidComplete', () => {
    it('should validate a fully valid IBAN', () => {
        // IT60X0542811101000000123456 - verify it passes everything
        expect(isValidComplete('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject empty string', () => {
        expect(isValidComplete('')).toBe(false);
    });

    it('should reject non-Italian IBAN', () => {
        expect(isValidComplete('DE89370400440532013000')).toBe(false);
    });

    it('should reject IBAN with wrong check digits', () => {
        expect(isValidComplete('IT00X0542811101000000123456')).toBe(false);
    });
});

describe('isValidCompleteClean (internal optimized)', () => {
    it('should validate pre-cleaned IBAN', () => {
        expect(isValidCompleteClean('IT60X0542811101000000123456')).toBe(true);
    });

    it('should reject invalid pre-cleaned IBAN', () => {
        expect(isValidCompleteClean('IT00X0542811101000000123456')).toBe(false);
    });
});
