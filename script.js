// variabile year del footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", function() {
  // Mostra gli indicatori in stato "pending" al caricamento
  updateIndicators("");
});



// Variabile globale per memorizzare i codici ABI validi
// Dizionario per ABI -> NomeBanca
let abiDictionary = {};

// Carica il JSON all'avvio
fetch('abiList.json')
  .then(response => response.json())
  .then(data => {
    // data è un array di oggetti [{ABI: "01005", Denominazione: "BANCA DI ESEMPIO SPA"}, ...]
    data.forEach(item => {
      // item.ABI è il codice, item.Denominazione è il nome
      abiDictionary[item.ABI] = item.Denominazione;
    });
    console.log("Dizionario ABI caricato:", abiDictionary);
  })
  .catch(err => console.error("Errore nel caricamento di abiList.json:", err));

/****************************************************
 * 1) pasteIban(): Incolla dagli Appunti
 ****************************************************/
function pasteIban() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    alert("La funzionalità di incolla non è supportata dal tuo browser o non è sicura.");
    return;
  }
  navigator.clipboard.readText()
    .then(text => {
      document.getElementById("ibanInput").value = text;
    })
    .catch(err => {
      console.error("Errore lettura appunti:", err);
      alert("Impossibile incollare: manca il permesso o il browser non è compatibile.");
    });
}

/****************************************************
 * 2) Funzione per il calcolo del modulo 97
 ****************************************************/
function isIbanValid(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  let rearranged = iban.slice(4) + iban.slice(0, 4);
  let expanded = "";
  for (let i = 0; i < rearranged.length; i++) {
    let c = rearranged[i];
    if (c >= "A" && c <= "Z") {
      expanded += (c.charCodeAt(0) - 55).toString();
    } else {
      expanded += c;
    }
  }
  let remainder = 0;
  let blockSize = 9;
  let pos = 0;
  remainder = parseInt(expanded.substr(pos, blockSize), 10) % 97;
  pos += blockSize;
  while (pos < expanded.length) {
    let size = Math.min(7, expanded.length - pos);
    let part = remainder.toString() + expanded.substr(pos, size);
    remainder = parseInt(part, 10) % 97;
    pos += size;
  }
  return remainder === 1;
}

/****************************************************
 * 3) Funzione per validare ABI tramite un array di combinazioni valide
 ****************************************************/
function isValidABI(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length < 10) return false;
  let abi = iban.substring(5, 10);
  
  // Se il dizionario non è ancora stato caricato, potrebbe essere vuoto
  if (!abiDictionary || Object.keys(abiDictionary).length === 0) {
    console.warn("Dizionario ABI non ancora caricato o vuoto.");
    return false;
  }
  
  return abiDictionary.hasOwnProperty(abi);
}

/****************************************************
 * 4) Funzione per recuperare il nome banca
 ****************************************************/
function getBankName(iban) {
  let abi = iban.substring(5, 10);
  return abiDictionary[abi] || "Banca Sconosciuta";
}

/****************************************************
 * 5) Funzione che esclude CAB invalidi
 ****************************************************/

function isValidCAB(iban) {
  // Normalizzazione
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length < 15) return false;
  
  // Estrae i 5 caratteri del CAB
  let cab = iban.substring(10, 15);

  // 1) Verifica che siano esattamente 5 cifre
  if (!/^\d{5}$/.test(cab)) {
    return false;
  }

  // 2) Converte in numero per altri controlli
  let numericCAB = parseInt(cab, 10);

  // Se numericCAB = 0 o > 89999 (eccetto 99999), escludi
  if (numericCAB === 0 || (numericCAB > 89999 && numericCAB !== 99999)) {
    return false;
  }
  
  return true;
}


/****************************************************
 * 6) Funzione per verificare il numero di conto
 ****************************************************/
function isValidAccountNumber(iban) {
  // Rimuove spazi e rende l'IBAN tutto maiuscolo
  iban = iban.toUpperCase().replace(/\s+/g, "");
  // L'IBAN italiano deve essere lungo 27 caratteri
  if (iban.length !== 27) return false;
  // Estrae il numero di conto (ultimi 12 caratteri)
  let account = iban.substring(15);
  // La regex applica le seguenti regole:
  // - ^(?:\d{2}|CC)   : le prime due cifre devono essere due cifre (0-9) oppure "CC"
  // - [0-2]           : la terza cifra deve essere 0, 1 o 2
  // - \d{6}           : dalla quarta alla nona cifra: sei cifre (0-9)
  // - [0-9X]          : la decima cifra può essere un numero o la lettera X
  // - \d{2}           : l'undicesima e la dodicesima cifra devono essere numeri
  // - $              : fine stringa
  const regex = /^(?:\d{2}|CC)[0-2]\d{6}[0-9X]\d{2}$/;
  return regex.test(account);
}


/****************************************************
 * 7) Funzione per controllare la struttura IBAN italiano (27 caratteri)
 ****************************************************/
function isItalianIbanStructure(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length !== 27) return false;
  if (!iban.startsWith("IT")) return false;
  
  // Check digit (2 cifre)
  let checkDigits = iban.substring(2, 4);
  if (!/^\d{2}$/.test(checkDigits)) return false;
  
  // CIN (1 lettera)
  let cin = iban.substring(4, 5);
  if (!/^[A-Z]$/.test(cin)) return false;
  
  // 5) ABI: invece di un controllo regex, usa isValidABI
  if (!isValidABI(iban)) {
    return false;
  }

  // 6) CAB: invece di un controllo regex, usa isValidCAB
  if (!isValidCAB(iban)) {
    return false;
  }
  
  // Numero conto: 12 caratteri con il nuovo controllo
  if (!isValidAccountNumber(iban)) return false;
  
  return true;
}

/****************************************************
 * 8) Funzione per formattare l'IBAN italiano con spazi
 ****************************************************/
function formatIbanItalian(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  if (iban.length !== 27) return iban;
  return (
    iban.substring(0,2) + " " +
    iban.substring(2,4) + " " +
    iban.substring(4,5) + " " +
    iban.substring(5,10) + " " +
    iban.substring(10,15) + " " +
    iban.substring(15)
  );
}

/****************************************************
 * 6) findSingleCharCorrectionsItalian:
 * Cerca IBAN validi modificando 1 solo carattere, includendo il filtro ABI/CAB
 ****************************************************/
function findSingleCharCorrectionsItalian(ibanOrig) {
  const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let results = new Set();
  ibanOrig = ibanOrig.toUpperCase().replace(/\s+/g, "");
  for (let i = 0; i < ibanOrig.length; i++) {
    for (let c of validChars) {
      if (c === ibanOrig[i]) continue;
      let newIban = ibanOrig.slice(0, i) + c + ibanOrig.slice(i+1);
      if (isIbanValid(newIban) && isItalianIbanStructure(newIban) && isValidABI(newIban)) {
        results.add(newIban);
      }
    }
  }
  return Array.from(results);
}

/****************************************************
 * 7) findSwapCorrectionsItalian:
 * Cerca IBAN validi scambiando due caratteri, includendo il filtro ABI/CAB
 ****************************************************/
function findSwapCorrectionsItalian(ibanOrig) {
  let results = new Set();
  ibanOrig = ibanOrig.toUpperCase().replace(/\s+/g, "");
  let arr = ibanOrig.split("");
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      let tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      let newIban = arr.join("");
      if (isIbanValid(newIban) && isItalianIbanStructure(newIban) && isValidABI(newIban)) {
        results.add(newIban);
      }
      // Ripristina lo scambio
      arr[j] = arr[i];
      arr[i] = tmp;
    }
  }
  return Array.from(results);
}

/****************************************************
 * 8) findAllCorrectionsItalian:
 * Unisce le correzioni trovate (single char e swap)
 ****************************************************/
function findAllCorrectionsItalian(ibanOrig) {
  let singleCharList = findSingleCharCorrectionsItalian(ibanOrig);
  let swapList = findSwapCorrectionsItalian(ibanOrig);
  let allSet = new Set([...singleCharList, ...swapList]);
  return Array.from(allSet);
}

// Funzione per aggiornare gli indicatori dei controlli
function updateIndicators(iban) {
  const indicatorsContainer = document.getElementById("indicators");
  // Svuota il contenuto precedente
  indicatorsContainer.innerHTML = "";
  
  // Definisci i nomi dei controlli
  const checkNames = ["Format", "Mod.97", "ABI", "CAB", "CC"];
  
  // Se l'IBAN è vuoto, mostra lo stato "in attesa" per tutti i controlli
  if (iban.trim() === "") {
    checkNames.forEach(name => {
      const chip = document.createElement("div");
      chip.className = "indicator pending"; // classe "pending" per lo stato iniziale
      chip.innerHTML = `${name} <i class="fa-solid fa-clock"></i>`;
      indicatorsContainer.appendChild(chip);
    });
  } else {
    // Se c'è un input, esegui i controlli e mostra i risultati:
    const checks = [
      { name: "Format", passed: (iban.replace(/\s+/g, "").length === 27) },
      { name: "Mod.97", passed: isIbanValid(iban) },
      { name: "ABI", passed: isValidABI(iban) },
      { name: "CAB", passed: isValidCAB(iban) },
      { name: "CC", passed: isValidAccountNumber(iban) }
    ];
    
  
    checks.forEach(check => {
      const chip = document.createElement("div");
      // Se il controllo è superato, assegna classe "success" (verde pastello),
      // altrimenti "error" (rosso pastello)
      chip.className = "indicator " + (check.passed ? "success" : "error");
      chip.innerHTML = `${check.name} ${check.passed ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>'}`;
      indicatorsContainer.appendChild(chip);
    });
  }
}


/****************************************************
 * 9) checkIBAN():
 * Esegue la verifica e mostra il risultato (e le correzioni se necessarie)
 ****************************************************/
function checkIBAN() {
  const iban = document.getElementById("ibanInput").value;
  // Aggiorna gli indicatori con i controlli
  updateIndicators(iban);

  let input = document.getElementById("ibanInput").value;
  
  input = input.toUpperCase().replace(/\s+/g, "");
  let resultDiv = document.getElementById("result");
  if (!input) {
    resultDiv.textContent =
      "Campo vuoto: incolla o inserisci un IBAN prima di verificare.";
    return;
  }
  if (input.length > 27) {
    resultDiv.textContent = "IBAN troppo lungo, ha " + input.length + " caratteri.\n\nDovrebbe averne 27.";
    return;
  }
  if (input.length < 27) {
    resultDiv.textContent = "IBAN troppo corto, ha " + input.length + " caratteri.\n\nDovrebbe averne 27.";
    return;
  }
  // Ora controlla anche solo l'ABI
  if (isIbanValid(input) && isItalianIbanStructure(input) && isValidABI(input) && isValidCAB(input)) {
  let bankName = getBankName(input);
  resultDiv.textContent = "IBAN VALIDO!\n\n" + formatIbanItalian(input) + "\n" + bankName;
  return;
  }
  let allCorrections = findAllCorrectionsItalian(input);
  if (allCorrections.length === 0) {
    resultDiv.textContent = "IBAN non valido.\n\nNessuna correzione valida trovata (1 char o swap).";
  } else {
    let msg = "IBAN non valido.\nCorrezioni trovate: " + allCorrections.length + "\n";
    let lines = allCorrections.map(x => formatIbanItalian(x));
    msg += lines.join("\n");
    resultDiv.textContent = msg;
  }
}

