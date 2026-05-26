import { getChance } from '../common.js';

function compute(prog, scores) {
    const weights = prog.weights;
    if (!weights) return null;
    let arr = [];
    for (const [s, w] of Object.entries(weights)) {
        if (scores[s] !== undefined) arr.push(scores[s] * w);
    }
    arr.sort((a,b)=>b-a);
    if (arr.length <= 5) return arr.reduce((a,b)=>a+b, 0);
    return arr.slice(0,5).reduce((a,b)=>a+b, 0) + arr[5] * 0.1;
}

export function computeAllPolyU(programmes, scores) {
    return programmes.map(prog => {
        const finalScore = compute(prog, scores);
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