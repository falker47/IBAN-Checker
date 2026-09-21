import { describe, it, expect } from 'vitest';
import { findCorrections } from './corrections.js';

const VALID_IBAN = 'IT60X0542811101000000123456';

describe('findCorrections', () => {
    it('should recover a valid IBAN from a single-character typo', () => {
        const corrections = findCorrections('IT60X0542811101000000123457');
        expect(corrections).toContain(VALID_IBAN);
    });

    it('should recover a valid IBAN from a transposed pair', () => {
        const corrections = findCorrections('IT60X0542811101000000123465');
        expect(corrections).toContain(VALID_IBAN);
    });

    it('should normalize lowercase and spaces before searching', () => {
        const corrections = findCorrections('it60 x054 2811 1010 0000 0123 457');
        expect(corrections).toContain(VALID_IBAN);
    });

    it('should not return duplicate candidates', () => {
        const corrections = findCorrections('IT60X0542811101000000123457');
        expect(new Set(corrections).size).toBe(corrections.length);
    });
});
