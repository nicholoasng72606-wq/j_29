import { inputToMedScore, getChance } from '../common.js';

// CUHK Best5 (加權 + special_weight)
function computeBest5(prog, scores) {
    const weights = {...prog.weights};
    if (prog.special_weight) {
        const { subjects, weight } = prog.special_weight;
        let best = null, bestVal = -1;
        for (const s of subjects) {
            if (scores[s] > bestVal) { bestVal = scores[s]; best = s; }
        }
        if (best) weights[best] = weight;
    }
    let arr = [];
    for (const [s, w] of Object.entries(weights)) {
        if (scores[s] !== undefined) arr.push(scores[s] * w);
    }
    arr.sort((a,b)=>b-a);
    return arr.slice(0,5).reduce((a,b)=>a+b, 0);
}

// CUHK Medicine 專用
function computeMedicine(medScores) {
    const six = ['chi','eng','math','phy','chem','bio'];
    let sum = six.reduce((a,s) => a + medScores[s], 0);
    const min = Math.min(...six.map(s => medScores[s]));
    if (medScores.m2 > min) {
        sum = sum - min + (min + medScores.m2) / 2;
    }
    return sum;
}

/**
 * 計算全部 CUHK programmes 的分數
 * @param {Array} programmes - CUHK JSON 數據
 * @param {Object} scores - 加權分數 (inputToScore)
 * @param {Object} medScores - 7分制分數 (inputToMedScore)
 * @returns {Array} 每個 programme 的結果物件
 */
export function computeAllCUHK(programmes, scores, medScores) {
    return programmes.map(prog => {
        let finalScore = null;
        if (prog.formula === 'cuhk_medicine') {
            finalScore = computeMedicine(medScores);
        } else if (prog.weights) {
            finalScore = computeBest5(prog, scores);
        }
        if (finalScore === null) return null;
        const chance = getChance(finalScore, prog.uq, prog.median, prog.lq);
        return {
            jupas_code: prog.jupas_code,
            programme_name: prog.programme_name,
            finalScore,
            uq: prog.uq,
            median: prog.median,
            lq: prog.lq,
            chance
        };
    }).filter(Boolean);
}
