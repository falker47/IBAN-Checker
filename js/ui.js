/**
 * UI Update Functions
 */

import { isIbanValid, isValidABI, isValidCAB, isValidAccountNumber } from './validators.js';
import { cleanIban } from './utils.js';

// DOM element references (initialized in main.js)
export let DOM = {
    currentYear: null,
    ibanInput: null,
    indicators: null,
    resultDiv: null
};

/**
 * Initialize DOM references
 */
export function initDOM() {
    DOM.currentYear = document.getElementById('currentYear');
    DOM.ibanInput = document.getElementById('ibanInput');
    DOM.indicators = document.getElementById('indicators');
    DOM.resultDiv = document.getElementById('result');
}

/**
 * Initialize indicators to neutral state
 */
export function initIndicatorsState() {
    updateIndicators("");
}

/**
 * Update validation indicator chips
 * @param {string} iban - IBAN to validate for indicators
 */
export function updateIndicators(iban) {
    DOM.indicators.innerHTML = "";
    const baseClasses = "inline-flex items-center px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-colors duration-200 shadow-sm whitespace-nowrap";

    const clean = cleanIban(iban.trim());

    if (!clean) {
        // Show neutral state
        ["Format", "Mod.97", "ABI", "CAB", "CC"].forEach(name => {
            const chip = document.createElement("div");
            chip.className = `${baseClasses} bg-gray-100 text-gray-500 border-gray-200`;
            chip.innerHTML = `${name} <i class="fa-solid fa-clock ml-2"></i>`;
            DOM.indicators.appendChild(chip);
        });
        return;
    }

    const checks = [
        { name: "Format", passed: clean.length === 27 },
        { name: "Mod.97", passed: isIbanValid(clean) },
        { name: "ABI", passed: isValidABI(clean) },
        { name: "CAB", passed: isValidCAB(clean) },
        { name: "CC", passed: isValidAccountNumber(clean) }
    ];

    checks.forEach(check => {
        const chip = document.createElement("div");
        const statusClasses = check.passed
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-red-100 text-red-700 border-red-200";

        chip.className = `${baseClasses} ${statusClasses}`;
        chip.innerHTML = `${check.name} ${check.passed
            ? '<i class="fa-solid fa-check ml-2"></i>'
            : '<i class="fa-solid fa-xmark ml-2"></i>'}`;
        DOM.indicators.appendChild(chip);
    });
}

/**
 * Display placeholder message in result area
 */
export function displayPlaceholder() {
    const el = DOM.resultDiv;
    el.className = "mt-6 md:mt-8 p-4 md:p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 text-center transition-all duration-500 transform";
    el.innerHTML = "<div class='flex items-center justify-center gap-2 text-sm md:text-base'><i class='fa-solid fa-info-circle'></i> Inserisci un IBAN per vedere i risultati.</div>";
    el.classList.remove("hidden", "opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
}

/**
 * Display result in result area
 * @param {string} htmlContent - HTML content to display
 * @param {"success"|"error"|"warning"} type - Result type for styling
 */
export function displayResult(htmlContent, type) {
    const el = DOM.resultDiv;

    // Reset base classes
    el.className = "mt-6 md:mt-8 p-4 md:p-6 rounded-xl border shadow-md transition-all duration-500 transform text-sm md:text-base";

    if (type === "success") {
        el.classList.add("bg-green-50", "border-green-200", "text-green-900");
    } else if (type === "error") {
        el.classList.add("bg-red-50", "border-red-200", "text-red-900");
    } else if (type === "warning") {
        el.classList.add("bg-yellow-50", "border-yellow-200", "text-yellow-900");
    }

    el.innerHTML = htmlContent;

    el.classList.remove("hidden", "opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
}
