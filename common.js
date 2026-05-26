// 分數轉換 (加權用)
export function inputToScore(val) {
    const map = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5.5, 6:7, 7:8.5};
    return map[val];
}

// 分數轉換 (CU Medic 7分制)
export function inputToMedScore(val) {
    const map = {0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7};
    return map[val];
}

// Chance 判斷
export function getChance(score, uq, median, lq) {
    if (median === null || median === undefined || median === "N/A") return "N/A";
    const uqVal = (uq !== null && uq !== "N/A") ? parseFloat(uq) : null;
    const medianVal = parseFloat(median);
    const lqVal = (lq !== null && lq !== "N/A") ? parseFloat(lq) : null;
    if ((uqVal !== null && score >= uqVal) || score >= 1.05 * medianVal) return "Ezzzzzzz";
    if (score >= medianVal) return "Easy";
    if (lqVal !== null && score >= lqVal * 0.99) return "Yes";
    if (lqVal !== null && score >= lqVal * 0.95) return "Can try";
    return "Gambling";
}

// HKUST 加分比例
export function getBonusPercent(gs) {
    if(gs>=8.5)return 0.05;
    if(gs>=7)return 0.0412;
    if(gs>=5.5)return 0.0324;
    if(gs>=4)return 0.0235;
    if(gs>=3)return 0.0176;
    return 0;
}

// 搵未使用科目中最高分嗰科
export function getSixthSubjectScore(used, scores) {
    const all = ['chi','eng','math','m2','phy','chem','bio'];
    return Math.max(...all.filter(s => !used.includes(s)).map(s => scores[s]));
}

// 組合最佳選擇（HKUST 用）
export function bestPick(candidates, n, scores, wFn) {
    let bestSum = -1, bestCombo = [];
    const arr = [...candidates];
    (function combine(start, chosen) {
        if (chosen.length === n) {
            let sum = chosen.reduce((a,s) => a + scores[s]*wFn(s), 0);
            if (sum > bestSum) { bestSum = sum; bestCombo = [...chosen]; }
            return;
        }
        for (let i=start; i<arr.length; i++) combine(i+1, [...chosen, arr[i]]);
    })(0, []);
    return {sum: bestSum, subjects: bestCombo};
}