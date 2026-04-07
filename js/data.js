/**
 * Data loading and bank lookup functions
 */

import { fetchData } from './utils.js';
import { POS } from './validators.js';

// Global state for bank data
export const STATE = {
    abiDictionary: {},
    cabList: []
};

/**
 * Load ABI and CAB data from JSON files
 * @returns {Promise<void>}
 */
export async function loadBankData() {
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

        // Process CAB Data (compact format: [CAB, Denominazione, Tipo, Range, Sigla])
        if (cabData) {
            STATE.cabList = cabData.map(entry => {
                const base = parseInt(entry[0], 10);
                const range = parseInt(entry[3], 10);
                return {
                    base,
                    upper: base + range,
                    Denominazione: entry[1],
                    Tipo: entry[2],
                    Range: range,
                    Sigla: entry[4]
                };
            }).sort((a, b) => a.base - b.base);
            console.log("Lista CAB pre-elaborata:", STATE.cabList.length, "voci");
        }

    } catch (error) {
        console.error("Critical: Failed to load bank data assets", error);
    }
}

/**
 * Binary search for CAB record by numeric CAB value
 * @param {number} numericCAB - Numeric CAB code
 * @returns {object|null} Matching CAB record or null
 */
function findCABRecord(numericCAB) {
    let lo = 0, hi = STATE.cabList.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const rec = STATE.cabList[mid];
        if (numericCAB < rec.base) hi = mid - 1;
        else if (numericCAB > rec.upper) lo = mid + 1;
        else return rec;
    }
    return null;
}

/**
 * Get bank name from ABI code in IBAN
 * @param {string} iban - IBAN string
 * @returns {string} Bank name
 */
export function getBankName(iban) {
    const abi = iban.replace(/\s+/g, "").substring(POS.ABI_START, POS.ABI_END);
    return STATE.abiDictionary[abi] || "Banca Sconosciuta";
}

/**
 * Get comune and sigla from CAB code in IBAN
 * @param {string} iban - IBAN string
 * @returns {{comune: string, sigla: string}} Location info
 */
export function getComuneAndSigla(iban) {
    const cabStr = iban.replace(/\s+/g, "").substring(POS.CAB_START, POS.CAB_END);
    if (!/^\d{5}$/.test(cabStr)) return { comune: "N/D", sigla: "" };

    const numericCAB = parseInt(cabStr, 10);
    const record = findCABRecord(numericCAB);

    return {
        comune: record ? record.Denominazione : "Comune sconosciuto",
        sigla: record?.Sigla ? ` (${record.Sigla})` : ""
    };
}
