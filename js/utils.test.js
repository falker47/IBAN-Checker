import { describe, it, expect } from 'vitest';
import { cleanIban, formatIban, debounce } from './utils.js';

describe('cleanIban', () => {
    it('should uppercase and remove spaces', () => {
        expect(cleanIban('it60 x054 2811 101')).toBe('IT60X0542811101');
    });

    it('should handle already clean input', () => {
        expect(cleanIban('IT60X0542811101000000123456')).toBe('IT60X0542811101000000123456');
    });

    it('should handle multiple spaces', () => {
        expect(cleanIban('IT60  X054   2811')).toBe('IT60X0542811');
    });
});

describe('formatIban', () => {
    it('should format 27-char IBAN correctly', () => {
        const result = formatIban('IT60X0542811101000000123456');
        expect(result).toBe('IT 60 X 05428 11101 000000123456');
    });

    it('should return unchanged if not 27 chars', () => {
        expect(formatIban('IT60X')).toBe('IT60X');
    });

    it('should handle lowercase input', () => {
        const result = formatIban('it60x0542811101000000123456');
        expect(result).toBe('IT 60 X 05428 11101 000000123456');
    });
});

describe('debounce', () => {
    it('should delay execution', async () => {
        let called = 0;
        const fn = debounce(() => called++, 50);
        fn();
        fn();
        fn();
        expect(called).toBe(0);
        await new Promise(r => setTimeout(r, 100));
        expect(called).toBe(1);
    });
});
