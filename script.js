// variabile year del footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", function() {
  // Mostra gli indicatori in stato "pending" al caricamento
  updateIndicators("");
  displayPlaceholder();
});



// Variabile globale per memorizzare i codici ABI validi
// Dizionario per ABI -> NomeBanca
let abiDictionary = {};

// Carica il JSON all'avvio
fetch('ABI-List.json')
  .then(response => response.json())
  .then(data => {
    // data è un array di oggetti [{ABI: "01005", Denominazione: "BANCA DI ESEMPIO SPA"}, ...]
    data.forEach(item => {
      // item.ABI è il codice, item.Denominazione è il nome
      abiDictionary[item.ABI] = item.Denominazione;
    });
    console.log("Dizionario ABI caricato:", abiDictionary);
  })
  .catch(err => console.error("Errore nel caricamento di ABI-List.json:", err));
// Variabile globale per memorizzare i codici CAB validi

// ********************************************************************************

// Variabile globale per la lista CAB pre-elaborata
let cabList = [];

// Carica e pre-elabora il file CAB-List.json
fetch('CAB-List.json')
  .then(response => response.json())
  .then(data => {
    // Pre-elabora ciascun record: calcola il valore numerico base e l'intervallo superiore (base + Range)
    cabList = data.map(entry => ({
      base: parseInt(entry.CAB, 10), 
      upper: parseInt(entry.CAB, 10) + parseInt(entry.Range, 10),
      Denominazione: entry.Denominazione,
      Tipo: entry.Tipo,
      Range: parseInt(entry.Range, 10),
      Sigla: entry.Sigla  // proprietà aggiunta
    }));
    // Ordina l'array in ordine crescente in base al campo base (opzionale, per robustezza)
    cabList.sort((a, b) => a.base - b.base);
    console.log("Lista CAB pre-elaborata:", cabList);
  })
  .catch(err => console.error("Errore nel caricamento di CAB-List.json:", err));

  // carica placeholder
  function displayPlaceholder() {
    let resultDiv = document.getElementById("result");
    // Rimuovi eventuali classi di risultato già applicate
    resultDiv.classList.remove("result-success", "result-error", "result-warning");
    // Aggiungi una classe specifica per il placeholder (definita in CSS)
    resultDiv.classList.add("placeholder");
    
    resultDiv.innerHTML = "<div class='result-line'><i class='fa-solid fa-info-circle'></i> Inserisci un IBAN e premi 'Verifica IBAN' per visualizzare il risultato.</div>";
    
    // Assicura che la box sia visibile
    resultDiv.style.opacity = 1;
    resultDiv.style.transform = "translateY(0)";
  }  


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
  // Rimuove tutti gli spazi dalla stringa dell'IBAN
  iban = iban.replace(/\s+/g, "");
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

  // Verifica che siano esattamente 5 cifre
  if (!/^\d{5}$/.test(cab)) {
    return false;
  }

  // Converte in numero per altri controlli
  let numericCAB = parseInt(cab, 10);

  // Verifica se il codice rientra in uno dei range validi:
  // CAB dei Capolouoghi di Regione
  if (numericCAB >  999 && numericCAB <  4999) {
    return true;
  }
  // CAB dei Capolouoghi di Provincia 
  if (numericCAB > 9999 && numericCAB < 17500) {
    return true;
  }
  // CAB dei Comuni "speciali" (Comuni L - Range 99)
  if (numericCAB > 19999 && numericCAB < 26400) {
    return true;
  }

  // CAB dei Comuni "speciali" (Comuni M - Range 09)
  if (numericCAB > 29999 && numericCAB < 85230) {
    return true;
  }
  if (numericCAB > 85249 && numericCAB < 85450) {
    return true;
  }
  if (numericCAB > 85769 && numericCAB < 89930) {
    return true;
  }
  
  // Se non rientra in nessun range, controlla se è presente in cabList
  if (cabList && cabList.length > 0) {
    const record = cabList.find(rec => numericCAB >= rec.base && numericCAB <= rec.upper);
    return record !== undefined;
  }
  
  // Se il dizionario non è stato ancora caricato, puoi decidere di tornare false
  return false;
}

/****************************************************
 * 6a) Funzione per estrarre il comune dal CAB
 ****************************************************/
function getComuneFromCAB(iban) {
  // Normalizza l'IBAN: rimuove spazi e converte in maiuscolo
  const normalizedIban = iban.toUpperCase().replace(/\s+/g, "");
  
  // Verifica che l'IBAN sia sufficientemente lungo (almeno 15 caratteri)
  if (normalizedIban.length < 15) return "IBAN troppo corto";
  
  // Estrai la porzione di 5 caratteri che rappresenta il CAB (es. dalla posizione 10 a 15)
  const cabStr = normalizedIban.substring(10, 15);
  
  // Controlla che il CAB sia composto da 5 cifre
  if (!/^\d{5}$/.test(cabStr)) return "CAB non valido";
  
  // Converti in numero intero
  const numericCAB = parseInt(cabStr, 10);
  
  // Se la lista CAB non è ancora caricata, restituisci un messaggio di attesa
  if (!cabList || cabList.length === 0) return "CAB non disponibile";
  
  // Usa Array.find per cercare il record per cui il CAB corrente rientra nel range [base, base+Range]
  const record = cabList.find(rec => numericCAB >= rec.base && numericCAB <= rec.upper);
  
  // Se trovato, restituisci il nome del comune (Denominazione), altrimenti un fallback
  return record ? record.Denominazione : "Comune sconosciuto";
}

/****************************************************
 * 6b) Funzione per estrarre la sigla del comune dal CAB
 ****************************************************/
function getSiglaFromCAB(iban) {
  // Normalizza l'IBAN: rimuove spazi e converte in maiuscolo
  const normalizedIban = iban.toUpperCase().replace(/\s+/g, "");
  if (normalizedIban.length < 15) return "";
  
  // Estrae i 5 caratteri del CAB (dalla posizione 10 a 15)
  const cabStr = normalizedIban.substring(10, 15);
  if (!/^\d{5}$/.test(cabStr)) return "";
  
  const numericCAB = parseInt(cabStr, 10);
  
  // Se la lista cabList non è disponibile, restituisce una stringa vuota
  if (!cabList || cabList.length === 0) return "";
  
  // Trova il record corrispondente al CAB
  const record = cabList.find(rec => numericCAB >= rec.base && numericCAB <= rec.upper);
  
  // Se il record è trovato e ha una Sigla, restituiscila, altrimenti vuoto
  return record && record.Sigla ? record.Sigla : "";
}



/****************************************************
 * 7) Funzione per verificare il numero di conto
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
  // - \d{7}           : dalla terza alla nona cifra: sei cifre (0-9)
  // - [0-9X]          : la decima cifra può essere un numero o la lettera X
  // - \d{2}           : l'undicesima e la dodicesima cifra devono essere numeri
  // - $              : fine stringa
  const regex = /^(?:\d{2}|CC)\d{7}[0-9X]\d{2}$/;
  return regex.test(account);
}


/****************************************************
 * 8) Funzione per controllare la struttura IBAN italiano (27 caratteri)
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
 * 9) Funzione per formattare l'IBAN italiano con spazi
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
 * 10) findSingleCharCorrectionsItalian:
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
 * 11) findSwapCorrectionsItalian:
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
 * 12) findAllCorrectionsItalian:
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

function displayResult(message, type) {
  let resultDiv = document.getElementById("result");
  // Rimuovi tutte le classi precedenti, inclusa quella del placeholder
  resultDiv.classList.remove("result-success", "result-error", "result-warning", "placeholder", "visible");

  // Aggiungi la classe in base al tipo di messaggio
  if (type === "success") {
    resultDiv.classList.add("result-success");
  } else if (type === "error") {
    resultDiv.classList.add("result-error");
  } else if (type === "warning") {
    resultDiv.classList.add("result-warning");
  }
  
  // Imposta il contenuto formattato (usa innerHTML per consentire tag HTML come <br>)
  resultDiv.innerHTML = message;
  
  // Forza un reflow per la transizione (facoltativo)
  void resultDiv.offsetWidth;
  
  // Aggiungi la classe 'visible' per attivare l'effetto fade-in
  resultDiv.classList.add("visible");
}



/****************************************************
 * 13) checkIBAN():
 * Esegue la verifica e mostra il risultato (e le correzioni se necessarie)
 ****************************************************/
function checkIBAN() {
  const iban = document.getElementById("ibanInput").value;
  updateIndicators(iban);
  let input = iban.toUpperCase().replace(/\s+/g, "");

  // Campo vuoto
  if (!input) {
    let msg = "<div class='result-line'><i class='fa-solid fa-exclamation-circle'></i> Campo vuoto: incolla o inserisci un IBAN prima di verificare.</div>";
    displayResult(msg, "error");
    return;
  }

  // IBAN estero
  if (!input.startsWith("IT")) {
    let msg = "<div class='result-line'><i class='fa-solid fa-globe'></i>Questo è un IBAN estero.</div>"
            + "<div class='result-line'><i class='fa-solid fa-flag'></i> Inserire un IBAN italiano.</div>"
            + "<div class='result-line'><i class='fa-solid fa-lightbulb'></i> Deve cominciare con 'IT'.</div>";
    displayResult(msg, "error");
    return;
  }

  // IBAN troppo lungo
  if (input.length > 27) {
    let msg = "<div class='result-line'><i class='fa-solid fa-times-circle'></i> IBAN troppo lungo, ha " + input.length + " caratteri.</div>"
            + "<div class='result-line'><i class='fa-solid fa-compress'></i> Dovrebbe averne 27.</div>";
    displayResult(msg, "error");
    return;
  }

  // IBAN troppo corto
  if (input.length < 27) {
    let msg = "<div class='result-line'><i class='fa-solid fa-times-circle'></i> IBAN troppo corto, ha " + input.length + " caratteri.</div>"
            + "<div class='result-line'><i class='fa-solid fa-expand'></i> Dovrebbe averne 27.</div>";
    displayResult(msg, "error");
    return;
  }

  // IBAN valido: controlli modulo 97, struttura italiana, ABI e CAB
  if (isIbanValid(input) && isItalianIbanStructure(input) && isValidABI(input) && isValidCAB(input)) {
    let bankName = getBankName(input);
    let comuneName = getComuneFromCAB(input);
    let siglaProvincia = getSiglaFromCAB(input);
    let siglaText = "";
    if (siglaProvincia !== "" && siglaProvincia !== "N/D") {
      siglaText = " (" + siglaProvincia + ")";
    }
    
    // L'IBAN viene mostrato in monospace e aggiunto il bottone per copiare accanto
    let msg = "<div class='result-line'><i class='fa-solid fa-check-circle'></i> "
            + "<span>" + formatIbanItalian(input) + " </span> "
            + "<button class='btn-copy' onclick='copyToClipboard(\"" + input + "\")' title='Copia IBAN'><i class='fa-solid fa-copy'></i></button></div>"
            + "<div class='result-line'><i class='fa-solid fa-university'></i>" + bankName + "</div>"
            + "<div class='result-line'><i class='fa-solid fa-building'></i> Filiale di " + comuneName + siglaText + "</div>";
    displayResult(msg, "success");
    return;
  }

  // IBAN non valido: tenta le correzioni
  let allCorrections = findAllCorrectionsItalian(input);
  if (allCorrections.length === 0) {
    let msg = "<div class='result-line'><i class='fa-solid fa-times-circle'></i>IBAN non valido.</div>"
            + "<div class='result-line'><i class='fa-solid fa-ban'></i>Nessuna correzione valida trovata.</div>";
    displayResult(msg, "error");
  } else {
    let msg = "<div class='result-line'><i class='fa-solid fa-times-circle'></i>IBAN non valido.</div>"
            + "<div class='result-line'><i class='fa-solid fa-lightbulb'></i> Correzioni trovate: <strong>" + allCorrections.length + "</strong></div>";
    // Per ciascuna correzione, mostriamo il testo in monospace e il pulsante copia sulla stessa riga
    let lines = allCorrections.map(x => {
      return "<div class='result-line'><span class='monospace'>" + formatIbanItalian(x) + " </span> "
           + "<button class='btn-copy' onclick='copyToClipboard(\"" + x + "\")' title='Copia correzione'><i class='fa-solid fa-copy'></i></button></div>";
    });
    msg += lines.join("");
    displayResult(msg, "warning");
  }
}

// Funzione per copiare il testo negli Appunti
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Puoi anche mostrare un breve messaggio di conferma se lo desideri
        console.log("Testo copiato: " + text);
      })
      .catch(err => console.error("Errore durante la copia: ", err));
  } else {
    // Fallback se navigator.clipboard non è supportato
    let tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }
}
