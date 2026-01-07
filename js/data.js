/**
 * Data loading and bank lookup functions
 */

import { fetchData } from './utils.js';

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
    }
}

/**
 * Get bank name from ABI code in IBAN
 * @param {string} iban - IBAN string
 * @returns {string} Bank name
 */
export function getBankName(iban) {
    const abi = iban.replace(/\s+/g, "").substring(5, 10);
    return STATE.abiDictionary[abi] || "Banca Sconosciuta";
}

/**
 * Get comune and sigla from CAB code in IBAN
 * @param {string} iban - IBAN string
 * @returns {{comune: string, sigla: string}} Location info
 */
export function getComuneAndSigla(iban) {
    const cabStr = iban.replace(/\s+/g, "").substring(10, 15);
    if (!/^\d{5}$/.test(cabStr)) return { comune: "N/D", sigla: "" };

    const numericCAB = parseInt(cabStr, 10);
    const record = STATE.cabList.find(rec => numericCAB >= rec.base && numericCAB <= rec.upper);

    return {
        comune: record ? record.Denominazione : "Comune sconosciuto",
        sigla: record?.Sigla ? ` (${record.Sigla})` : ""
    };
}
