import { getChance, getBonusPercent, getSixthSubjectScore, bestPick } from '../common.js';

function compute(prog, scores) {
    const formula = prog.formula;
    const base = scores.eng*2 + scores.math*2;
    const others = ['chi','m2','phy','chem','bio'];

    if (formula === 'hkust_eng_ai' || formula === 'hkust_dual') {
        let best = -1, used = [];
        for (const b of ['phy','chem','bio']) {
            const rem = others.filter(s => s!==b);
            const r = bestPick(rem, 2, scores, s => s==='m2'?1.5:1);
            const total = base + scores[b]*2 + r.sum;
            if (total > best) { best = total; used = ['eng','math',b,...r.subjects]; }
        }
        return {best5Sum: best, usedSubjects: used};
    }
    if (formula === 'hkust_bba') {
        const r = bestPick(others, 3, scores, () => 1);
        return {best5Sum: base + r.sum, usedSubjects: ['eng','math',...r.subjects]};
    }
    if (formula === 'hkust_qfin') {
        const optA = bestPick(others, 3, scores, () => 1);
        let bestB = -1, usedB = [];
        for (const sp of ['chem','phy','m2']) {
            const rem = others.filter(s => s!==sp);
            const r = bestPick(rem, 2, scores, () => 1);
            const total = base + scores[sp]*1.5 + r.sum;
            if (total > bestB) { bestB = total; usedB = ['eng','math',sp,...r.subjects]; }
        }
        return (base+optA.sum >= bestB) ? {best5Sum: base+optA.sum, usedSubjects: ['eng','math',...optA.subjects]} : {best5Sum: bestB, usedSubjects: usedB};
    }
    if (formula === 'hkust_cse') {
        const wB = s => s==='phy'?2:1;
        let best = -1, used = [];
        for (const b of ['phy','chem','bio']) {
            const rem = others.filter(s => s!==b);
            const r = bestPick(rem, 2, scores, s => s==='m2'?2:1);
            const total = base + scores[b]*wB(b) + r.sum;
            if (total > best) { best = total; used = ['eng','math',b,...r.subjects]; }
        }
        return {best5Sum: best, usedSubjects: used};
    }
    return null;
}

export function computeAllHKUST(programmes, scores) {
    return programmes.map(prog => {
        const result = compute(prog, scores);
        if (!result) return null;
        const sixth = getSixthSubjectScore(result.usedSubjects, scores);
        const finalScore = result.best5Sum + prog.max_score * getBonusPercent(sixth);
        const chance = getChance(finalScore, null, prog.median, prog.lq);
        return {
            jupas_code: prog.jupas_code,
            programme_name: prog.programme_name,
            finalScore,
            uq: null,
            median: prog.median,
            lq: prog.lq,
            chance
        };
    }).filter(Boolean);
}