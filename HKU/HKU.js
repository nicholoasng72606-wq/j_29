import { getChance } from '../common.js';

function compute(prog, scores) {
    const f = prog.formula;
    const all = ['chi','eng','math','m2','phy','chem','bio'];
    if (f === 'hku_best5') {
        const arr = all.map(s => scores[s]).sort((a,b)=>b-a);
        return arr.slice(0,5).reduce((a,b)=>a+b,0);
    }
    if (f === 'hku_eng_math_best3') {
        const base = scores.eng + scores.math;
        const others = ['chi','m2','phy','chem','bio'].map(s => scores[s]).sort((a,b)=>b-a);
        return base + others[0] + others[1] + others[2];
    }
    if (f === 'hku_best6') {
        const arr = all.map(s => scores[s]).sort((a,b)=>b-a);
        return arr.slice(0,6).reduce((a,b)=>a+b,0);
    }
    if (f === 'hku_6224') {
        const base = 2*scores.eng + 2*scores.math + 2*scores.m2;
        const pool = [scores.phy, scores.chem, scores.bio].sort((a,b)=>b-a);
        return base + (pool[0] + pool[1]) * 1.5;
    }
    if (f === 'hku_6688') {
        const fixed = scores.eng + scores.math;
        const pool = [scores.phy, scores.chem, scores.bio, scores.m2].sort((a,b)=>b-a);
        return fixed + 1.2 * (pool[0] + pool[1] + pool[2]);
    }
    if (f === 'hku_6729') {
        const base = 1.2 * (scores.eng + scores.math + scores.m2);
        const others = ['chi','phy','chem','bio'].map(s => scores[s]).sort((a,b)=>b-a);
        return base + others[0] + others[1];
    }
    if (f === 'hku_6884') {
        const base = 1.5*scores.eng + 1.25*(scores.math + scores.m2);
        const others = ['chi','phy','chem','bio'].map(s => scores[s]).sort((a,b)=>b-a);
        return base + others[0] + others[1] + others[2] + 0.2*others[3];
    }
    return null;
}

export function computeAllHKU(programmes, scores) {
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
