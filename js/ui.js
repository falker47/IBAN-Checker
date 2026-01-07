/**
 * UI Update Functions
 */

import { isIbanValid, isValidABI, isValidCAB, isValidAccountNumber, isValidCIN, isKnownABI, isStrictAccountNumber } from './validators.js';
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
    const baseClasses = "inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold border transition-colors duration-200 shadow-sm whitespace-nowrap";

    const clean = cleanIban(iban.trim());

    if (!clean) {
        // Show neutral state
        ["Format", "Mod.97", "CIN", "ABI", "CAB", "CC"].forEach(name => {
            const chip = document.createElement("div");
            chip.className = `${baseClasses} bg-gray-100 text-gray-500 border-gray-200`;
            chip.innerHTML = `${name} <i class="fa-solid fa-clock ml-2"></i>`;
            DOM.indicators.appendChild(chip);
        });
        return;
    }

    // Check if ABI format is valid and if it's known in database
    const abiFormatValid = isValidABI(clean);
    const abiKnown = isKnownABI(clean);

    // Hybrid CC check: strict (from experience) vs permissive (fallback)
    const ccStrict = isStrictAccountNumber(clean);
    const ccPermissive = isValidAccountNumber(clean);

    const checks = [
        { name: "Format", status: clean.length === 27 ? "pass" : "fail" },
        { name: "Mod.97", status: isIbanValid(clean) ? "pass" : "fail" },
        { name: "CIN", status: isValidCIN(clean) ? "pass" : "fail" },
        { name: "ABI", status: !abiFormatValid ? "fail" : (abiKnown ? "pass" : "warn") },
        { name: "CAB", status: isValidCAB(clean) ? "pass" : "fail" },
        { name: "CC", status: ccStrict ? "pass" : (ccPermissive ? "warn" : "fail") }
    ];

    checks.forEach(check => {
        const chip = document.createElement("div");
        let statusClasses, icon;

        if (check.status === "pass") {
            statusClasses = "bg-green-100 text-green-700 border-green-200";
            icon = '<i class="fa-solid fa-check ml-2"></i>';
        } else if (check.status === "warn") {
            statusClasses = "bg-yellow-100 text-yellow-700 border-yellow-200";
            icon = '<i class="fa-solid fa-question ml-2"></i>';
        } else {
            statusClasses = "bg-red-100 text-red-700 border-red-200";
            icon = '<i class="fa-solid fa-xmark ml-2"></i>';
        }

        chip.className = `${baseClasses} ${statusClasses}`;
        chip.innerHTML = `${check.name} ${icon}`;
        DOM.indicators.appendChild(chip);
    });
}

/**
 * Display placeholder message in result area
 */
export function displayPlaceholder() {
    const el = DOM.resultDiv;
    el.className = "mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 text-center transition-all duration-500 transform";
    el.innerHTML = "<div class='flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base'><i class='fa-solid fa-info-circle'></i> Inserisci un IBAN per vedere i risultati.</div>";
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

    // Reset base classes - responsive padding and text
    el.className = "mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border shadow-md transition-all duration-500 transform text-xs sm:text-sm md:text-base";

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
