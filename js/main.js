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
      <div class='flex items-start gap-3'>
        <div class='result-icon result-icon-error'><i class='fa-solid fa-xmark'></i></div>
        <div class='flex flex-col gap-1'>
          <div class='font-bold text-sm sm:text-base'>IBAN non italiano</div>
          <div class='flex items-center text-slate-600'><i class='fa-solid fa-lightbulb mr-2 text-slate-400'></i> Deve iniziare con 'IT'.</div>
        </div>
      </div>`, "error");
    return;
  }

  // Wrong length
  if (iban.length !== 27) {
    const diff = iban.length - 27;
    const verb = diff > 0 ? "troppo lungo" : "troppo corto";
    displayResult(`
      <div class='flex items-start gap-3'>
        <div class='result-icon result-icon-error'><i class='fa-solid fa-xmark'></i></div>
        <div class='flex flex-col gap-1'>
          <div class='font-bold text-sm sm:text-base'>IBAN ${verb} (${iban.length} caratteri)</div>
          <div class='flex items-center text-slate-600'><i class='fa-solid fa-ruler-horizontal mr-2 text-slate-400'></i> Lunghezza corretta: 27.</div>
        </div>
      </div>`, "error");
    return;
  }

  // Valid IBAN
  if (isValidComplete(iban)) {
    const bankName = getBankName(iban);
    const { comune, sigla } = getComuneAndSigla(iban);

    const html = `
      <div class='flex flex-col gap-3'>
        <div class='flex items-center gap-3'>
          <div class='result-icon result-icon-success'><i class='fa-solid fa-check'></i></div>
          <span class='font-mono font-bold text-base sm:text-lg overflow-x-auto'>${formatIban(iban)}</span>
          <button class='ml-auto p-2 hover:bg-green-100 rounded-lg transition-colors text-slate-500 hover:text-green-700' data-copy-iban='${iban}' title='Copia' aria-label='Copia IBAN'>
            <i class='fa-solid fa-copy'></i>
          </button>
        </div>
        <div class='flex flex-col gap-2 pt-3 border-t border-black/[0.06]'>
          <div class='flex items-center gap-2.5 text-sm text-slate-600'><i class='fa-solid fa-university text-slate-400 w-4 text-center'></i> ${bankName}</div>
          <div class='flex items-center gap-2.5 text-sm text-slate-600'><i class='fa-solid fa-building text-slate-400 w-4 text-center'></i> Filiale di ${comune}${sigla}</div>
        </div>
      </div>
    `;
    displayResult(html, "success");
    return;
  }

  // Invalid - try corrections
  const corrections = findCorrections(iban);
  if (corrections.length === 0) {
    displayResult(`
      <div class='flex items-start gap-3'>
        <div class='result-icon result-icon-error'><i class='fa-solid fa-xmark'></i></div>
        <div class='flex flex-col gap-1'>
          <div class='font-bold text-sm sm:text-base'>IBAN non valido</div>
          <div class='flex items-center text-slate-600'><i class='fa-solid fa-ban mr-2 text-slate-400'></i> Nessuna correzione trovata.</div>
        </div>
      </div>`, "error");
  } else {
    const strictCorrections = corrections.filter(c => isStrictAccountNumber(c) && isKnownABI(c));
    const otherCorrections = corrections.filter(c => !isStrictAccountNumber(c) || !isKnownABI(c));
    const sortedCorrections = [...strictCorrections, ...otherCorrections];

    const corrText = sortedCorrections.length === 1 ? "1 correzione trovata:" : `${sortedCorrections.length} correzioni trovate:`;
    let corrHtml = `
      <div class='flex items-start gap-3 mb-4'>
        <div class='result-icon result-icon-warning'><i class='fa-solid fa-exclamation'></i></div>
        <div class='flex flex-col gap-1'>
          <div class='font-bold text-sm sm:text-base'>IBAN non valido</div>
          <div class='flex items-center text-slate-600'><i class='fa-solid fa-lightbulb mr-2 text-slate-400'></i> ${corrText}</div>
        </div>
      </div>
      <div class='flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1'>`;

    sortedCorrections.forEach(c => {
      const bankName = getBankName(c);
      const { comune, sigla } = getComuneAndSigla(c);
      const isStrict = isStrictAccountNumber(c) && isKnownABI(c);

      const borderClass = isStrict
        ? 'border-l-4 border-l-green-500'
        : 'border-l-4 border-l-amber-500';
      const reliabilityIcon = isStrict
        ? '<i class="fa-solid fa-star text-green-600" title="Alta affidabilità"></i>'
        : '<i class="fa-solid fa-circle-question text-amber-600" title="Formato non standard"></i>';

      corrHtml += `
        <div class='${borderClass} bg-white/70 p-3.5 rounded-xl text-sm'>
          <div class='flex items-center justify-between mb-2'>
            <div class='flex items-center gap-2'>
              ${reliabilityIcon}
              <span class='font-mono font-bold'>${formatIban(c)}</span>
            </div>
            <button class='p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500' data-copy-iban='${c}' title='Copia' aria-label='Copia IBAN'>
              <i class='fa-solid fa-copy'></i>
            </button>
          </div>
          <div class='text-xs text-slate-500 flex flex-col gap-1'>
            <div><i class='fa-solid fa-university mr-1.5 text-slate-400 w-3 text-center'></i> ${bankName}</div>
            <div><i class='fa-solid fa-building mr-1.5 text-slate-400 w-3 text-center'></i> ${comune}${sigla}</div>
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

  // Event delegation for copy buttons (replaces inline onclick handlers)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy-iban]');
    if (btn) copyToClipboard(btn.dataset.copyIban);
  });

  // Paste button handler
  document.getElementById('pasteBtn')?.addEventListener('click', () => {
    pasteFromClipboard(DOM.ibanInput);
  });

  // Load bank data with visual feedback
  DOM.ibanInput.disabled = true;
  DOM.ibanInput.placeholder = "Caricamento dati bancari...";
  try {
    await loadBankData();
  } finally {
    DOM.ibanInput.disabled = false;
    DOM.ibanInput.placeholder = "IT47X0123456789000000123456";
    DOM.ibanInput.focus();
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
