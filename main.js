import { inputToScore, inputToMedScore, getChance } from './common.js';
import { computeAllCUHK } from './CUHK/CUHK.js';
import { computeAllHKU } from './HKU/HKU.js';
import { computeAllHKUST } from './HKUST/HKUST.js';
import { computeAllPolyU } from './PolyU/PolyU.js';

let allData = {};

let categoryMap = {};

function getFavorites() {
    return JSON.parse(localStorage.getItem('jupas_fav') || '[]');
}

function saveFavorites(arr) {
    localStorage.setItem('jupas_fav', JSON.stringify(arr));
}


// 讀取 JSON 數據
async function loadData() {
    const [cuhk, hku, hkust, polyu, catMap] = await Promise.all([
        fetch('./CUHK/CUHK.json').then(r => r.json()),
        fetch('./HKU/HKU.json').then(r => r.json()),
        fetch('./HKUST/HKUST.json').then(r => r.json()),
        fetch('./PolyU/PolyU.json').then(r => r.json()),
        fetch('./cat.json').then(r => r.json())
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
        tbody.innerHTML = '<tr><td colspan="9" class="error-msg">No data loaded.</td></tr>';
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
        sep.classList.add('school-separator');
        sep.innerHTML = `<td colspan="9" class="school-separator">${group.school}</td>`;
        tbody.appendChild(sep);

        // 每個 programme 行
        group.results.forEach(r => {
            const cls = r.chance === "Ezzzzzzz" ? "Ezzzzzzz" :
                        r.chance === "Easy" ? "Easy" :
                        r.chance === "Yes" ? "Yes" :
                        r.chance === "Can try" ? "Can-try" :
                        r.chance === "Gambling" ? "Gambling" : "N-A";
            
            const favs = getFavorites();
            const isFav = favs.includes(r.jupas_code);            

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="star-cell" data-code="${r.jupas_code}" style="cursor:pointer; font-size:18px; text-align:center;">${isFav ? '⭐' : '☆'}</td>
                <td class="data-cell">${r.jupas_code||''}</td>
                <td class="data-cell">${r.programme_name||''}</td>
                <td class="data-cell">${r.finalScore.toFixed(2)}</td>
                <td class="data-cell">${r.uq != null ? r.uq : 'N/A'}</td>
                <td class="data-cell">${r.median != null ? r.median : 'N/A'}</td>
                <td class="data-cell">${r.lq != null ? r.lq : 'N/A'}</td>
                <td class="${cls}">${r.chance}</td>
                <td class="data-cell">${renderScoreBar(r.finalScore, r.uq, r.median, r.lq)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 若過濾後完全沒東西
    if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="9">No programmes in this category.</td></tr>';
    }
    applyAllFilters();
}

// 綁定事件
function bindEvents() {
    const subjectIds = ['chi', 'eng', 'math', 'm2', 'phy', 'chem', 'bio'];

    // ✅ 讀取上次儲存的成績，並設定 select 的值
    subjectIds.forEach(id => {
        const saved = localStorage.getItem(`jupas_${id}`);
        if (saved !== null) {
            document.getElementById(id).value = saved;
        }
    });

    // 監聽所有 select（含分類選單），變更時重新 render + 儲存成績
    document.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', () => {
            if (subjectIds.includes(s.id)) {
                localStorage.setItem(`jupas_${s.id}`, s.value);
            }
            renderTable();
        });
    });

    document.getElementById('resultBody').addEventListener('click', function(e) {
        if (e.target.classList.contains('star-cell')) {
            const code = e.target.dataset.code;
            const favs = getFavorites();
            if (favs.includes(code)) {
                saveFavorites(favs.filter(c => c !== code));
                e.target.textContent = '☆';
            } else {
                favs.push(code);
                saveFavorites(favs);
                e.target.textContent = '⭐';
            }
            applyAllFilters();
        }
    });
    
    document.getElementById('searchInput').addEventListener('input', applyAllFilters);
    document.getElementById('favOnly').addEventListener('change', applyAllFilters);
    document.getElementById('printBtn').addEventListener('click', () => window.print());
}

function applyAllFilters() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const favOnly = document.getElementById('favOnly').checked;
    const favs = getFavorites();
    const allRows = [...document.querySelectorAll('#resultBody tr')];

    let visibleAfter = false;
    for (let i = allRows.length - 1; i >= 0; i--) {
        const row = allRows[i];
        if (row.classList.contains('school-separator')) {
            row.style.display = visibleAfter ? '' : 'none';
            visibleAfter = false;
        } else {
            let show = true;
            if (keyword !== '') {
                show = row.textContent.toLowerCase().includes(keyword);
            }
            if (show && favOnly) {
                const starCell = row.querySelector('.star-cell');
                if (starCell) {
                    const code = starCell.dataset.code;
                    show = favs.includes(code);
                } else {
                    show = false;
                }
            }
            row.style.display = show ? '' : 'none';
            if (show) visibleAfter = true;
        }
    }
}

function renderScoreBar(yourScore, uq, median, lq) {
    // 若無 median 或 lq 就無法畫，直接回傳 N/A
    if (median == null || lq == null) return 'N/A';

    // 決定右端點：UQ 存在就用 UQ，否則用 median
    const rightEnd = (uq != null) ? uq : median;

    // 計算整條的範圍
    const minVal = Math.min(lq, yourScore);
    const maxVal = Math.max(rightEnd, yourScore);

    // 避免除以零（若所有值相等）
    const range = maxVal - minVal || 0.1;

    // 計算某個數值在條上的百分比位置
    const pos = val => ((val - minVal) / range) * 100;

    // 準備每個刻度點 { label, value, pos }
    const points = [
        { label: 'L', value: lq,color: '#dc3545' },
        { label: 'M', value: median  ,color: '#ffc107' },
        { label: 'You', value: yourScore, color: '#000000'  }
    ];
    if (uq != null) {
        points.push({ label: 'U', value: uq, color: '#28a745'  });
    }

    // 產生每個刻度點的 HTML（絕對定位的豎線 + 下方文字）
    const marksHTML = points.map(p => {
        const left = pos(p.value);
        const isYou = p.label === 'You';
        return `
            <div style="position:absolute; left:${left}%; top:0; bottom:0; width:2px; background:${p.color};"></div>
            <div style="position:absolute; left:${left}%; ${isYou ? 'bottom:100%; margin-bottom:2px;' : 'top:100%; margin-top:2px;'} transform:translateX(-50%); font-size:10px; white-space:nowrap; color:#000000;">${p.label}</div>
        `;
    }).join('');

    // 外層容器
    return `
        <div style="position:relative; width:90%; height:12px; background:#e0e0e0; border-radius:6px; margin:12px auto 12px auto;">
            ${marksHTML}
        </div>
    `;
}




// 啟動
(async () => {
    try {
        await loadData();
        bindEvents();
        renderTable();
    } catch (err) {
        document.getElementById("resultBody").innerHTML =
            `<tr><td colspan="9" class="error-msg">❌ Failed to load data. Check JSON files.<br>${err.message}</td></tr>`;
    }
})();
