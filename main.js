import { inputToScore, inputToMedScore, getChance } from './common.js';
import { computeAllCUHK } from './CUHK/CUHK.js';
import { computeAllHKU } from './HKU/HKU.js';
import { computeAllHKUST } from './HKUST/HKUST.js';
import { computeAllPolyU } from './PolyU/PolyU.js';

let allData = {};

// 讀取 JSON 數據
async function loadData() {
    const [cuhk, hku, hkust, polyu] = await Promise.all([
        fetch('./CUHK/CUHK.json').then(r => r.json()),
        fetch('./HKU/HKU.json').then(r => r.json()),
        fetch('./HKUST/HKUST.json').then(r => r.json()),
        fetch('./PolyU/PolyU.json').then(r => r.json())
    ]);
    allData = { cuhk, hku, hkust, polyu };
}

// 獲取當前輸入成績
function getScores() {
    const ids = ['chi','eng','math','m2','phy','chem','bio'];
    const scores = {};
    const medScores = {};
    ids.forEach(id => {
        const val = parseInt(document.getElementById(id).value);
        scores[id] = inputToScore(val);
        medScores[id] = inputToMedScore(val);
    });
    return { scores, medScores };
}

// 渲染表格
function renderTable() {
    const tbody = document.getElementById("resultBody");
    tbody.innerHTML = "";

    if (!allData.cuhk && !allData.hku && !allData.hkust && !allData.polyu) {
        tbody.innerHTML = '<tr><td colspan="7" class="error-msg">No data loaded.</td></tr>';
        return;
    }

    const { scores, medScores } = getScores();

    const schools = [
        { name: "HKU", data: allData.hku, fn: computeAllHKU, extra: scores },
        { name: "CUHK", data: allData.cuhk, fn: computeAllCUHK, extra: medScores },
        { name: "HKUST", data: allData.hkust, fn: computeAllHKUST, extra: scores },
        { name: "PolyU", data: allData.polyu, fn: computeAllPolyU, extra: scores }
    ];

    for (const school of schools) {
        if (!school.data || !school.data.length) continue;

        const sep = document.createElement('tr');
        sep.innerHTML = `<td colspan="7" class="school-separator">${school.name}</td>`;
        tbody.appendChild(sep);

        let results;
        if (school.name === "CUHK") {
            results = school.fn(school.data, scores, medScores);
        } else {
            results = school.fn(school.data, school.extra);
        }

        results.forEach(r => {
            const cls = r.chance === "Ezzzzzzz" ? "Ezzzzzzz" :
                        r.chance === "Easy" ? "Easy" :
                        r.chance === "Yes" ? "Yes" :
                        r.chance === "Can try" ? "Can-try" :
                        r.chance === "Gambling" ? "Gambling" : "N-A";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="data-cell">${r.jupas_code||''}</td>
                <td class="data-cell">${r.programme_name||''}</td>
                <td class="data-cell">${r.finalScore.toFixed(2)}</td>
                <td class="data-cell">${r.uq != null ? r.uq : 'N/A'}</td>
                <td class="data-cell">${r.median != null ? r.median : 'N/A'}</td>
                <td class="data-cell">${r.lq != null ? r.lq : 'N/A'}</td>
                <td class="${cls}">${r.chance}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="7">No valid programmes to display.</td></tr>';
    }
}

// 綁定事件
function bindEvents() {
    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', renderTable);
    });
}

// 啟動
(async () => {
    try {
        await loadData();
        bindEvents();
        renderTable();
    } catch (err) {
        document.getElementById("resultBody").innerHTML =
            `<tr><td colspan="7" class="error-msg">❌ Failed to load data. Check JSON files.<br>${err.message}</td></tr>`;
    }
})();
