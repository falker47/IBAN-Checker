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
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm font-medium border transition-all duration-300 whitespace-nowrap";

    const clean = cleanIban(iban.trim());

    if (!clean) {
        ["Format", "Mod.97", "CIN", "ABI", "CAB", "CC"].forEach(name => {
            const chip = document.createElement("div");
            chip.className = `${baseClasses} chip-neutral bg-slate-50 text-slate-400 border-slate-200`;
            chip.setAttribute("role", "status");
            chip.setAttribute("aria-label", `${name}: in attesa`);
            chip.innerHTML = `<span class="chip-dot"></span>${name}`;
            DOM.indicators.appendChild(chip);
        });
        return;
    }

    const abiFormatValid = isValidABI(clean);
    const abiKnown = isKnownABI(clean);
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

    const ariaStatus = { pass: "valido", warn: "attenzione", fail: "non valido" };

    const statusClasses = {
        pass: "chip-pass bg-green-50 text-green-700 border-green-200",
        warn: "chip-warn bg-amber-50 text-amber-800 border-amber-200",
        fail: "chip-fail bg-red-50 text-red-800 border-red-200"
    };

    checks.forEach(check => {
        const chip = document.createElement("div");
        chip.className = `${baseClasses} ${statusClasses[check.status]}`;
        chip.setAttribute("role", "status");
        chip.setAttribute("aria-label", `${check.name}: ${ariaStatus[check.status]}`);
        chip.innerHTML = `<span class="chip-dot"></span>${check.name}`;
        DOM.indicators.appendChild(chip);
    });
}

/**
 * Display placeholder message in result area
 */
export function displayPlaceholder() {
    const el = DOM.resultDiv;
    el.className = "mt-6 sm:mt-8 md:mt-10 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center transition-all duration-500 transform";
    el.style.transitionTimingFunction = "cubic-bezier(0.16, 1, 0.3, 1)";
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

    el.className = "mt-6 sm:mt-8 md:mt-10 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border transition-all duration-500 transform text-xs sm:text-sm md:text-base";
    el.style.transitionTimingFunction = "cubic-bezier(0.16, 1, 0.3, 1)";

    if (type === "success") {
        el.classList.add("bg-green-50", "border-green-200", "text-green-900");
    } else if (type === "error") {
        el.classList.add("bg-red-50", "border-red-200", "text-red-900");
    } else if (type === "warning") {
        el.classList.add("bg-amber-50", "border-amber-200", "text-amber-900");
    }

    el.innerHTML = htmlContent;

    el.classList.remove("hidden", "opacity-0", "translate-y-4");
    el.classList.add("opacity-100", "translate-y-0");
}
