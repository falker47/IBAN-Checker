
// --- Constants & Global State ---
const DOM = {
  currentYear: document.getElementById('currentYear'),
  ibanInput: document.getElementById('ibanInput'),
  indicators: document.getElementById('indicators'),
  resultDiv: document.getElementById('result')
};

const STATE = {
  abiDictionary: {},
  cabList: []
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  DOM.currentYear.textContent = new Date().getFullYear();
  initIndicatorsState();
  displayPlaceholder();

  // Parallel fetch of resources
  try {
    const [abiData, cabData] = await Promise.all([
      fetchData('ABI-List.json'),
      fetchData('CAB-List.json')
    ]);

    // Process ABI Data
    if (abiData) {
      abiData.forEach(item => {
        STATE.abiDictionary[item.ABI] = item.Denominazione;
      });
      console.log("Dizionario ABI caricato:", Object.keys(STATE.abiDictionary).length, "voci");
    }

    // Process CAB Data
    if (cabData) {
      STATE.cabList = cabData.map(entry => ({
        base: parseInt(entry.CAB, 10),
        upper: parseInt(entry.CAB, 10) + parseInt(entry.Range, 10),
        Denominazione: entry.Denominazione,
        Tipo: entry.Tipo,
        Range: parseInt(entry.Range, 10),
        Sigla: entry.Sigla
      })).sort((a, b) => a.base - b.base);
      console.log("Lista CAB pre-elaborata:", STATE.cabList.length, "voci");
    }

  } catch (error) {
    console.error("Critical: Failed to load bank data assets", error);
    // Optionally show a toast error here
  }
});

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(`Failed loading ${url}:`, err);
    return null;
  }
}

// --- UI Interaction Functions ---

window.pasteIban = async () => {
  if (!navigator.clipboard?.readText) {
    alert("Incolla non supportato o permessi negati.");
    return;
  }
  try {
    const text = await navigator.clipboard.readText();
    DOM.ibanInput.value = text;
  } catch (err) {
    console.warn("Clipboard read failed:", err);
    alert("Impossibile accedere agli appunti.");
  }
};

window.copyToClipboard = (text) => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => console.log("Copiato:", text))
      .catch(err => console.error("Copy failed:", err));
  } else {
    // Fallback
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
    } catch (e) { console.error("Fallback copy failed", e); }
    document.body.removeChild(temp);
  }
};

// --- Core Validation Logic ---

function isIbanValid(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let expanded = "";

  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    // 'A' is 65, we want A=10, B=11... so code-55
    if (code >= 65 && code <= 90) {
      expanded += (code - 55).toString();
    } else {
      expanded += rearranged[i];
    }
  }

  // Modulo 97 on large number using block method
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const part = remainder.toString() + expanded.substring(i, i + 7);
    remainder = parseInt(part, 10) % 97;
  }

  return remainder === 1;
}

function isValidABI(iban) {
  if (iban.length < 10) return false;
  const abi = iban.toUpperCase().replace(/\s+/g, "").substring(5, 10);
  return STATE.abiDictionary.hasOwnProperty(abi);
}

function isValidCAB(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length < 15) return false;
  const cabStr = iban.substring(10, 15);
  if (!/^\d{5}$/.test(cabStr)) return false;

  const numericCAB = parseInt(cabStr, 10);

  // Check known ranges
  if ((numericCAB > 999 && numericCAB < 4999) ||    // Capoluoghi Regione
    (numericCAB > 9999 && numericCAB < 17500) ||  // Capoluoghi Provincia
    (numericCAB > 19999 && numericCAB < 26400) || // Comuni L
    (numericCAB > 29999 && numericCAB < 85230) || // Comuni M (subset 1)
    (numericCAB > 85249 && numericCAB < 85450) || // Comuni M (subset 2)
    (numericCAB > 85769 && numericCAB < 89930)) { // Comuni M (subset 3)
    return true;
  }

  // Check loaded list
  if (STATE.cabList.length > 0) {
    return STATE.cabList.some(rec => numericCAB >= rec.base && numericCAB <= rec.upper);
  }
  return false;
}

function isValidAccountNumber(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length !== 27) return false;
  const account = iban.substring(15);
  // first 2 digits or 'CC', then 7 digits, then digit or 'X', then 2 digits
  return /^(?:\d{2}|CC)\d{7}[0-9X]\d{2}$/.test(account);
}

function isItalianIbanStructure(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length !== 27) return false;
  if (!iban.startsWith("IT")) return false;
  if (!/^\d{2}$/.test(iban.substring(2, 4))) return false; // Check digits
  if (!/^[A-Z]$/.test(iban.substring(4, 5))) return false; // CIN

  if (!isValidABI(iban)) return false;
  if (!isValidCAB(iban)) return false;
  if (!isValidAccountNumber(iban)) return false;

  return true;
}

// --- Data Retrieval ---

function getBankName(iban) {
  const abi = iban.replace(/\s+/g, "").substring(5, 10);
  return STATE.abiDictionary[abi] || "Banca Sconosciuta";
}

function getComuneAndSigla(iban) {
  const cabStr = iban.replace(/\s+/g, "").substring(10, 15);
  if (!/^\d{5}$/.test(cabStr)) return { comune: "N/D", sigla: "" };

  const numericCAB = parseInt(cabStr, 10);
  const record = STATE.cabList.find(rec => numericCAB >= rec.base && numericCAB <= rec.upper);

  return {
    comune: record ? record.Denominazione : "Comune sconosciuto",
    sigla: record?.Sigla ? ` (${record.Sigla})` : ""
  };
}

// --- Correction Logic ---

function findCorrections(ibanOrig) {
  const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const results = new Set();
  ibanOrig = ibanOrig.toUpperCase().replace(/\s+/g, "");

  // 1. Single substitution
  for (let i = 0; i < ibanOrig.length; i++) {
    for (let c of validChars) {
      if (c === ibanOrig[i]) continue;
      const candidate = ibanOrig.slice(0, i) + c + ibanOrig.slice(i + 1);
      if (isValidComplete(candidate)) results.add(candidate);
    }
  }

  // 2. Swaps
  const arr = ibanOrig.split("");
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
      const candidate = arr.join("");
      if (isValidComplete(candidate)) results.add(candidate);
      [arr[i], arr[j]] = [arr[j], arr[i]]; // swap back
    }
  }

  return Array.from(results);
}

function isValidComplete(iban) {
  return isIbanValid(iban) && isItalianIbanStructure(iban);
  // Note: isItalian structure calls isValidABI/CAB/Account internally
}

function formatIban(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length !== 27) return iban;
  return `${iban.slice(0, 2)} ${iban.slice(2, 4)} ${iban.slice(4, 5)} ${iban.slice(5, 10)} ${iban.slice(10, 15)} ${iban.slice(15)}`;
}

// --- UI Updates ---

function initIndicatorsState() {
  updateIndicators("");
}

function updateIndicators(iban) {
  DOM.indicators.innerHTML = "";
  const baseClasses = "inline-flex items-center px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold border transition-colors duration-200 shadow-sm whitespace-nowrap";

  const cleanIban = iban.trim().replace(/\s+/g, "");

  if (!cleanIban) {
    ["Format", "Mod.97", "ABI", "CAB", "CC"].forEach(name => {
      const chip = document.createElement("div");
      chip.className = `${baseClasses} bg-gray-100 text-gray-500 border-gray-200`;
      chip.innerHTML = `${name} <i class="fa-solid fa-clock ml-2"></i>`;
      DOM.indicators.appendChild(chip);
    });
    return;
  }

  const checks = [
    { name: "Format", passed: cleanIban.length === 27 },
    { name: "Mod.97", passed: isIbanValid(cleanIban) },
    { name: "ABI", passed: isValidABI(cleanIban) },
    { name: "CAB", passed: isValidCAB(cleanIban) },
    { name: "CC", passed: isValidAccountNumber(cleanIban) }
  ];

  checks.forEach(check => {
    const chip = document.createElement("div");
    const statusClasses = check.passed
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200";

    chip.className = `${baseClasses} ${statusClasses}`;
    chip.innerHTML = `${check.name} ${check.passed ? '<i class="fa-solid fa-check ml-2"></i>' : '<i class="fa-solid fa-xmark ml-2"></i>'}`;
    DOM.indicators.appendChild(chip);
  });
}

function displayPlaceholder() {
  const el = DOM.resultDiv;
  el.className = "mt-6 md:mt-8 p-4 md:p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 text-center transition-all duration-500 transform";
  el.innerHTML = "<div class='flex items-center justify-center gap-2 text-sm md:text-base'><i class='fa-solid fa-info-circle'></i> Inserisci e verifica per vedere i risultati.</div>";
  el.classList.remove("hidden", "opacity-0", "translate-y-4");
  el.classList.add("opacity-100", "translate-y-0");
}

function displayResult(htmlContent, type) {
  const el = DOM.resultDiv;

  // Reset base classes
  el.className = "mt-6 md:mt-8 p-4 md:p-6 rounded-xl border shadow-md transition-all duration-500 transform text-sm md:text-base";

  if (type === "success") el.classList.add("bg-green-50", "border-green-200", "text-green-900");
  else if (type === "error") el.classList.add("bg-red-50", "border-red-200", "text-red-900");
  else if (type === "warning") el.classList.add("bg-yellow-50", "border-yellow-200", "text-yellow-900");

  el.innerHTML = htmlContent;

  el.classList.remove("hidden", "opacity-0", "translate-y-4");
  el.classList.add("opacity-100", "translate-y-0");
}

// --- Main Action ---

window.checkIBAN = () => {
  const rawIban = DOM.ibanInput.value;
  updateIndicators(rawIban);

  const iban = rawIban.toUpperCase().replace(/\s+/g, "");

  // Basic Validation
  if (!iban) {
    displayResult(`<div class='flex items-center'><i class='fa-solid fa-exclamation-circle mr-2'></i> Campo vuoto.</div>`, "error");
    return;
  }
  if (!iban.startsWith("IT")) {
    displayResult(`
      <div class='flex flex-col gap-1'>
        <div class='flex items-center'><i class='fa-solid fa-globe mr-2'></i> IBAN non italiano.</div>
        <div class='flex items-center'><i class='fa-solid fa-lightbulb mr-2'></i> Deve iniziare con 'IT'.</div>
      </div>`, "error");
    return;
  }
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

  // Full Validation
  if (isValidComplete(iban)) {
    const bankName = getBankName(iban);
    const { comune, sigla } = getComuneAndSigla(iban);

    const html = `
      <div class='flex flex-col gap-2'>
        <div class='flex items-center justify-between bg-white/60 p-2 rounded-lg'>
          <div class='flex items-center font-mono font-bold text-lg overflow-x-auto'>
            <i class='fa-solid fa-check-circle mr-2 text-green-600'></i> ${formatIban(iban)}
          </div>
          <button class='ml-2 p-2 hover:bg-green-100 rounded-full transition-colors' onclick='copyToClipboard("${iban}")' title='Copia'>
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

  // Errors & Corrections
  const corrections = findCorrections(iban);
  if (corrections.length === 0) {
    displayResult(`
      <div class='flex flex-col gap-1'>
        <div class='flex items-center font-bold'><i class='fa-solid fa-times-circle mr-2'></i> IBAN non valido.</div>
        <div class='flex items-center'><i class='fa-solid fa-ban mr-2'></i> Nessuna correzione trovata.</div>
      </div>`, "error");
  } else {
    let corrHtml = `
      <div class='flex flex-col gap-1 mb-3'>
        <div class='flex items-center font-bold'><i class='fa-solid fa-times-circle mr-2'></i> IBAN non valido.</div>
        <div class='flex items-center'><i class='fa-solid fa-lightbulb mr-2'></i> ${corrections.length} correzioni trovate:</div>
      </div>
      <div class='flex flex-col gap-2 max-h-48 overflow-y-auto pr-1'>`;

    corrections.forEach(c => {
      corrHtml += `
        <div class='flex items-center justify-between bg-white/60 p-2 rounded-lg text-sm'>
          <span class='font-mono'>${formatIban(c)}</span>
          <button class='ml-2 hover:text-yellow-700' onclick='copyToClipboard("${c}")'>
            <i class='fa-solid fa-copy'></i>
          </button>
        </div>`;
    });
    corrHtml += "</div>";

    displayResult(corrHtml, "warning");
  }
};
