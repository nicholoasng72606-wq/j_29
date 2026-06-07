import { inputToScore, inputToMedScore, getChance } from './common.js';
import { computeAllCUHK } from './CUHK/CUHK.js';
import { computeAllHKU } from './HKU/HKU.js';
import { computeAllHKUST } from './HKUST/HKUST.js';
import { computeAllPolyU } from './PolyU/PolyU.js';

let allData = {};

let categoryMap = {};

// 讀取 JSON 數據
async function loadData() {
    const basePath = window.location.pathname.includes('/j_29/') ? '/j_29' : '';
    
    const [cuhk, hku, hkust, polyu, catMap] = await Promise.all([
        fetch(basePath + '/CUHK/CUHK.json').then(r => r.json()),
        fetch(basePath + '/HKU/HKU.json').then(r => r.json()),
        fetch(basePath + '/HKUST/HKUST.json').then(r => r.json()),
        fetch(basePath + '/PolyU/PolyU.json').then(r => r.json()),
        fetch(basePath + '/cat.json').then(r => r.json())
    ]);
    allData = { cuhk, hku, hkust, polyu };
    categoryMap = catMap;
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
    const selectedCategory = document.getElementById("categoryFilter").value;

    const schools = [
        { name: "HKU", data: allData.hku, fn: computeAllHKU, extra: scores },
        { name: "CUHK", data: allData.cuhk, fn: computeAllCUHK, extra: medScores },
        { name: "HKUST", data: allData.hkust, fn: computeAllHKUST, extra: scores },
        { name: "PolyU", data: allData.polyu, fn: computeAllPolyU, extra: scores }
    ];

    // 收集所有學校的計算結果
    let allSchoolResults = [];

    for (const school of schools) {
        if (!school.data || !school.data.length) continue;

        let results;
        if (school.name === "CUHK") {
            results = school.fn(school.data, scores, medScores);
        } else {
            results = school.fn(school.data, school.extra);
        }

        // 為每個 programme 補上 category
        results = results.map(r => ({
            ...r,
            category: categoryMap[r.jupas_code] || "OTHER"
        }));

        allSchoolResults.push({ school: school.name, results });
    }

    // 根據 category 過濾（ALL 則保留全部）
    if (selectedCategory !== "ALL") {
        allSchoolResults = allSchoolResults.map(group => ({
            school: group.school,
            results: group.results.filter(r => r.category === selectedCategory)
        })).filter(group => group.results.length > 0);
    }

    // 渲染過濾後的結果
    for (const group of allSchoolResults) {
        // 學校分隔行
        const sep = document.createElement('tr');
        sep.innerHTML = `<td colspan="7" class="school-separator">${group.school}</td>`;
        tbody.appendChild(sep);

        // 每個 programme 行
        group.results.forEach(r => {
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

    // 若過濾後完全沒東西
    if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="7">No programmes in this category.</td></tr>';
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
