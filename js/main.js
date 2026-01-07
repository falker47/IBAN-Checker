/**
 * IBAN Checker - Main Entry Point
 */

import { debounce, copyToClipboard, pasteFromClipboard, formatIban, cleanIban } from './utils.js';
import { loadBankData, getBankName, getComuneAndSigla } from './data.js';
import { isValidComplete } from './validators.js';
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
    const corrText = corrections.length === 1 ? "1 correzione trovata:" : `${corrections.length} correzioni trovate:`;
    let corrHtml = `
      <div class='flex flex-col gap-1 mb-3'>
        <div class='flex items-center font-bold'><i class='fa-solid fa-times-circle mr-2'></i> IBAN non valido.</div>
        <div class='flex items-center'><i class='fa-solid fa-lightbulb mr-2'></i> ${corrText}</div>
      </div>
      <div class='flex flex-col gap-2 max-h-48 overflow-y-auto pr-1'>`;

    corrections.forEach(c => {
      corrHtml += `
        <div class='flex items-center justify-between bg-white/60 p-2 rounded-lg text-sm'>
          <span class='font-mono'>${formatIban(c)}</span>
          <button class='ml-2 hover:text-yellow-700' onclick='window.copyToClipboard("${c}")'>
            <i class='fa-solid fa-copy'></i>
          </button>
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

  // Load bank data
  await loadBankData();

  // Expose functions to window for onclick handlers
  window.copyToClipboard = copyToClipboard;
  window.pasteIban = () => pasteFromClipboard(DOM.ibanInput);
  window.checkIBAN = checkIBAN;
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
