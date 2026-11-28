const GAS_URL = 'https://script.google.com/macros/s/AKfycbw9-7JRV_dL0PlyVVlJcXXDhtf3BMIHMjXjlypx68z2ih32-4a3bMonjZIMH4FYio2hZA/exec';

let allTables = [];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTables(tables) {
  const grid = document.getElementById('tablesGrid');
  const countEl = document.getElementById('tableCount');
  if (!grid) return;

  const normalizedTables = (tables || []).map(item => {
    // รายชื่อทั้งหมดในโต๊ะ (สูงสุด 10 ที่นั่ง) แสดงครบโดยไม่ filter
    const allGuests = (item.guests || [])
      .map(name => String(name || '').trim())
      .filter(name => name !== '')
      .slice(0, 10);

    // นับเฉพาะแขกจริงที่ไม่ใช่คำว่า "ว่าง"
    const actualGuestsCount = allGuests.filter(name => name !== 'ว่าง').length;

    return {
      ...item,
      allGuests,
      actualGuestsCount
    };
  });

  const totalGuests = normalizedTables.reduce((sum, t) => sum + t.actualGuestsCount, 0);

  if (countEl) {
    countEl.textContent = `${normalizedTables.length} โต๊ะ · ${totalGuests} ท่าน`;
  }

  if (normalizedTables.length === 0) {
    grid.innerHTML = '<div class="loading-box">ไม่พบข้อมูลโต๊ะหรือรายชื่อที่ค้นหา</div>';
    return;
  }

  grid.innerHTML = normalizedTables.map(item => {
    let isFull = item.actualGuestsCount === 10;
    let zoneDotClass = getZoneClass(item.tableNo);

    let guestsHtml = item.allGuests
      .map((name, i) => {
        let isVacant = name === 'ว่าง';
        return `
          <li class="${isVacant ? 'is-vacant' : ''}" title="${escapeHtml(name)}">
            <span class="idx">${i + 1}.</span>${escapeHtml(name)}
          </li>
        `;
      })
      .join('');

    return `
      <article class="table-box">
        <div class="table-header">
          <span class="table-no">
            ${zoneDotClass ? `<span class="zone-dot ${zoneDotClass}"></span>` : ''}
            โต๊ะ ${escapeHtml(item.tableNo)}
          </span>
          <span class="table-badge ${isFull ? 'is-full' : ''}">${item.actualGuestsCount}/10 ท่าน</span>
        </div>
        <ul class="guest-list">
          ${guestsHtml || '<li style="grid-column:1/-1;color:#856A5D;">ไม่มีรายชื่อ</li>'}
        </ul>
      </article>
    `;
  }).join('');
}

function getZoneClass(tableNo) {
  let num = parseInt(String(tableNo).replace(/[^0-9]/g, ''), 10);
  if (num === 1 || num === 8) return 'zone-dot-a';
  if (num >= 2 && num <= 7) return 'zone-dot-b';
  if (num >= 9 && num <= 14) return 'zone-dot-c';
  if (num >= 15 && num <= 21) return 'zone-dot-d';
  if (num >= 22 && num <= 28) return 'zone-dot-e';
  return '';
}

function filterTables() {
  let q = (document.getElementById('guestSearch')?.value || '').trim().toLowerCase();
  if (!q) {
    renderTables(allTables);
    updateLayoutFullMarkers(allTables);
    return;
  }

  let filtered = allTables.filter(t => {
    let matchTable = String(t.tableNo || '').toLowerCase().includes(q);
    let matchGuest = (t.guests || []).some(g => String(g).toLowerCase().includes(q));
    return matchTable || matchGuest;
  });

  renderTables(filtered);
  updateLayoutFullMarkers(filtered);
}

async function loadTablesData() {
  let grid = document.getElementById('tablesGrid');
  try {
    let res = await fetch(GAS_URL);
    let result = await res.json();
    if (result.status === 'success' && Array.isArray(result.tables)) {
      allTables = result.tables;
      renderTables(allTables);
      updateLayoutFullMarkers(allTables);
    } else if (grid) {
      grid.innerHTML = '<div class="loading-box">ยังไม่มีข้อมูลในชีต Table</div>';
    }
  } catch (err) {
    console.error('โหลดผังโต๊ะไม่สำเร็จ:', err);
    if (grid) {
      grid.innerHTML = '<div class="loading-box">ไม่สามารถโหลดข้อมูลผังโต๊ะได้ในขณะนี้</div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTableFullMarkers();
  loadTablesData();
});

let FULL_ICON_SRC = '../img/full.png';

// พิกัดมุมขวาล่างของแต่ละวงกลมหมายเลขโต๊ะ (หน่วย % เทียบกับขนาดรูปผัง)
let TABLE_FULL_POSITIONS = (() => {
  let positions = {};
  let leftColX = [16.8, 34.6];
  let rightColX = [23.5, 5.7];
  let rowStartY = 26;
  let rowStepY = 8.6;

  for (let r = 0; r < 7; r++) {
    let y = +(rowStartY + r * rowStepY).toFixed(2);
    positions[r + 1] = { left: leftColX[0], top: y };
    positions[r + 8] = { left: leftColX[1], top: y };
    positions[r + 15] = { right: rightColX[0], top: y };
    positions[r + 22] = { right: rightColX[1], top: y };
  }

  return positions;
})();

function initTableFullMarkers() {
  let container = document.getElementById('tableFullMarkers');
  if (!container) return;

  let html = '';
  for (let tNo = 1; tNo <= 28; tNo++) {
    let pos = TABLE_FULL_POSITIONS[tNo];
    if (!pos) continue;

    let horizStyle = pos.right !== undefined
      ? `right: ${pos.right}%;`
      : `left: ${pos.left}%;`;

    html += `
      <span class="full-stamp" data-table="${tNo}" style="${horizStyle} top: ${pos.top}%;">
        <img src="${FULL_ICON_SRC}" alt="โต๊ะ ${tNo} เต็ม">
      </span>
    `;
  }
  container.innerHTML = html;
}

function updateLayoutFullMarkers(tables) {
  let fullSet = new Set();

  (tables || []).forEach(item => {
    let num = parseInt(String(item.tableNo || '').replace(/[^0-9]/g, ''), 10);
    let guests = (item.guests || [])
      .map(name => String(name || '').trim())
      .filter(name => name !== '' && name !== 'ว่าง')
      .slice(0, 10);

    if (num >= 1 && num <= 28 && guests.length === 10) {
      fullSet.add(num);
    }
  });

  document.querySelectorAll('#tableFullMarkers .full-stamp').forEach(el => {
    let tNo = parseInt(el.getAttribute('data-table'), 10);
    el.classList.toggle('is-visible', fullSet.has(tNo));
  });
}