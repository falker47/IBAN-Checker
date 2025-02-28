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
 * 3) Funzione per controllare la struttura IBAN italiano (27 caratteri)
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
  
  // ABI (5 cifre) - la prima deve essere 0 o 1
  let abi = iban.substring(5, 10);
  if (!/^[01]\d{4}$/.test(abi)) return false;
  
  // CAB (5 cifre)
  let cab = iban.substring(10, 15);
  if (!/^\d{5}$/.test(cab)) return false;
  
  // Numero conto (12 caratteri): accetta [0-9X]{12}, oppure C[0-9X]{11} oppure CC[0-9X]{10}
  let conto = iban.substring(15);
  if (!/^(?:[0-9X]{12}|C[0-9X]{11}|CC[0-9X]{10})$/.test(conto)) return false;
  
  return true;
}

/****************************************************
 * 4) Funzione per validare ABI/CAB tramite un array di combinazioni valide
 ****************************************************/
function isValidBankBranch(iban) {
  iban = iban.toUpperCase().replace(/\s+/g, "");
  // Verifica lunghezza minima per estrarre ABI e CAB
  if (iban.length < 15) return false;
  let abi = iban.substring(5, 10);
  let cab = iban.substring(10, 15);
  
  // Array di combinazioni valide in formato "ABI_CAB"
  const validBranches = [
    "07092_41220",
    "07092_41221",
    "07092_41222",
    "03069_11101"
    // Aggiungi qui le combinazioni ufficiali
  ];
  
  let key = abi + "_" + cab;
  return validBranches.includes(key);
}

/****************************************************
 * 5) Funzione per formattare l'IBAN italiano con spazi
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
      if (isIbanValid(newIban) && isItalianIbanStructure(newIban) && isValidBankBranch(newIban)) {
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
      if (isIbanValid(newIban) && isItalianIbanStructure(newIban) && isValidBankBranch(newIban)) {
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

/****************************************************
 * 9) checkIBAN():
 * Esegue la verifica e mostra il risultato (e le correzioni se necessarie)
 ****************************************************/
function checkIBAN() {
  let input = document.getElementById("ibanInput").value;
  input = input.toUpperCase().replace(/\s+/g, "");
  let resultDiv = document.getElementById("result");
  if (!input) {
    resultDiv.textContent =
      "Campo vuoto: incolla o inserisci un IBAN prima di verificare.";
    return;
  }
  if (input.length > 27) {
    resultDiv.textContent = "IBAN troppo lungo, ha " + input.length + " caratteri.";
    return;
  }
  if (input.length < 27) {
    resultDiv.textContent = "IBAN troppo corto, ha " + input.length + " caratteri.";
    return;
  }
  if (isIbanValid(input) && isItalianIbanStructure(input) && isValidBankBranch(input)) {
    resultDiv.textContent = "IBAN già valido: " + formatIbanItalian(input);
    return;
  }
  let allCorrections = findAllCorrectionsItalian(input);
  if (allCorrections.length === 0) {
    resultDiv.textContent = "Nessuna correzione valida trovata (1 char o swap).";
  } else {
    let msg = "Trovate " + allCorrections.length + " correzioni:\n";
    let lines = allCorrections.map(x => formatIbanItalian(x));
    msg += lines.join("\n");
    resultDiv.textContent = msg;
  }
}
