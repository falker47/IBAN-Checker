/**
 * IBAN Checker - Main Entry Point
 */

import { debounce, copyToClipboard, pasteFromClipboard, formatIban, cleanIban } from './utils.js';
import { loadBankData, getBankName, getComuneAndSigla } from './data.js';
import { isValidComplete, isStrictAccountNumber, isKnownABI } from './validators.js';
import { findCorrections } from './corrections.js';
import { DOM, initDOM, initIndicatorsState, displayPlaceholder, displayResult, updateIndicators } from './ui.js';

/**
 * Main IBAN check function
 */
function checkIBAN() {
  const rawIban = DOM.ibanInput.value;
  updateIndicators(rawIban);

  const iban = cleanIban(rawIban);

  // Empty input
  if (!iban) {
    displayPlaceholder();
    return;
  }

  // Not Italian
  if (!iban.startsWith("IT")) {
    displayResult(`
      <div class='flex flex-col gap-1'>
        <div class='flex items-center'><i class='fa-solid fa-globe mr-2'></i> IBAN non italiano.</div>
        <div class='flex items-center'><i class='fa-solid fa-lightbulb mr-2'></i> Deve iniziare con 'IT'.</div>
      </div>`, "error");
    return;
  }

  // Wrong length
  if (iban.length !== 27) {
    const diff = iban.length - 27;
    const verb = diff > 0 ? "troppo lungo" : "troppo corto";
    displayResult(`
      <div class='flex flex-col gap-1'>
        <div class='flex items-center'><i class='fa-solid fa-times-circle mr-2'></i> IBAN ${verb} (${iban.length} caratteri).</div>
        <div class='flex items-center'><i class='fa-solid fa-ruler-horizontal mr-2'></i> Lunghezza corretta: 27.</div>
      </div>`, "error");
    return;
  }

  // Valid IBAN
  if (isValidComplete(iban)) {
    const bankName = getBankName(iban);
    const { comune, sigla } = getComuneAndSigla(iban);

    const html = `
      <div class='flex flex-col gap-2'>
        <div class='flex items-center justify-between bg-white/60 p-2 rounded-lg'>
          <div class='flex items-center font-mono font-bold text-lg overflow-x-auto'>
            <i class='fa-solid fa-check-circle mr-2 text-green-600'></i> ${formatIban(iban)}
          </div>
          <button class='ml-2 p-2 hover:bg-green-100 rounded-full transition-colors' onclick='window.copyToClipboard("${iban}")' title='Copia'>
            <i class='fa-solid fa-copy'></i>
          </button>
        </div>
        <div class='flex items-center'><i class='fa-solid fa-university mr-2'></i> ${bankName}</div>
        <div class='flex items-center'><i class='fa-solid fa-building mr-2'></i> Filiale di ${comune}${sigla}</div>
      </div>
    `;
    displayResult(html, "success");
    return;
  }

  // Invalid - try corrections
  const corrections = findCorrections(iban);
  if (corrections.length === 0) {
    displayResult(`
      <div class='flex flex-col gap-1'>
        <div class='flex items-center font-bold'><i class='fa-solid fa-times-circle mr-2'></i> IBAN non valido.</div>
        <div class='flex items-center'><i class='fa-solid fa-ban mr-2'></i> Nessuna correzione trovata.</div>
      </div>`, "error");
  } else {
    // Separate strict (more reliable) from permissive corrections
    const strictCorrections = corrections.filter(c => isStrictAccountNumber(c) && isKnownABI(c));
    const otherCorrections = corrections.filter(c => !isStrictAccountNumber(c) || !isKnownABI(c));

    // Sort: strict first, then others
    const sortedCorrections = [...strictCorrections, ...otherCorrections];

    const corrText = sortedCorrections.length === 1 ? "1 correzione trovata:" : `${sortedCorrections.length} correzioni trovate:`;
    let corrHtml = `
      <div class='flex flex-col gap-1 mb-3'>
        <div class='flex items-center font-bold'><i class='fa-solid fa-times-circle mr-2'></i> IBAN non valido.</div>
        <div class='flex items-center'><i class='fa-solid fa-lightbulb mr-2'></i> ${corrText}</div>
      </div>
      <div class='flex flex-col gap-2 max-h-64 overflow-y-auto pr-1'>`;

    sortedCorrections.forEach(c => {
      const bankName = getBankName(c);
      const { comune, sigla } = getComuneAndSigla(c);
      const isStrict = isStrictAccountNumber(c) && isKnownABI(c);

      // Visual distinction: strict = green border + star, other = yellow border + question
      const borderClass = isStrict
        ? 'border-l-4 border-l-green-500'
        : 'border-l-4 border-l-yellow-500';
      const reliabilityIcon = isStrict
        ? '<i class="fa-solid fa-star text-green-600" title="Alta affidabilità"></i>'
        : '<i class="fa-solid fa-circle-question text-yellow-600" title="Formato non standard"></i>';

      corrHtml += `
        <div class='${borderClass} bg-white/60 p-3 rounded-lg text-sm'>
          <div class='flex items-center justify-between mb-2'>
            <div class='flex items-center gap-2'>
              ${reliabilityIcon}
              <span class='font-mono font-bold'>${formatIban(c)}</span>
            </div>
            <button class='p-1.5 hover:bg-gray-200 rounded-full transition-colors' onclick='window.copyToClipboard("${c}")' title='Copia'>
              <i class='fa-solid fa-copy'></i>
            </button>
          </div>
          <div class='text-xs text-gray-600 flex flex-col gap-0.5'>
            <div><i class='fa-solid fa-university mr-1'></i> ${bankName}</div>
            <div><i class='fa-solid fa-building mr-1'></i> ${comune}${sigla}</div>
          </div>
        </div>`;
    });
    corrHtml += "</div>";

    displayResult(corrHtml, "warning");
  }
}

/**
 * Initialize application
 */
async function init() {
  // Initialize DOM references
  initDOM();

  // Set current year
  DOM.currentYear.textContent = new Date().getFullYear();

  // Initialize UI
  initIndicatorsState();
  displayPlaceholder();

  // Setup real-time validation with debounce
  const debouncedValidation = debounce(() => {
    checkIBAN();
  }, 300);

  DOM.ibanInput.addEventListener('input', () => {
    debouncedValidation();
  });

  // Handle browser autofill (autofill often triggers 'change' instead of 'input')
  DOM.ibanInput.addEventListener('change', () => {
    checkIBAN();
  });

  // Load bank data
  await loadBankData();

  // Expose functions to window for onclick handlers
  window.copyToClipboard = copyToClipboard;
  window.pasteIban = () => pasteFromClipboard(DOM.ibanInput);
  window.checkIBAN = checkIBAN;
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
