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
    const guestsHtml = item.allGuests
      .map((name, i) => `
        <li title="${escapeHtml(name)}">
          <span class="idx">${i + 1}.</span>${escapeHtml(name)}
        </li>
      `)
      .join('');

    return `
      <article class="table-box">
        <div class="table-header">
          <span class="table-no">โต๊ะที่ ${escapeHtml(item.tableNo)}</span>
          <span class="table-badge">${item.actualGuestsCount}/10 ท่าน</span>
        </div>
        <ul class="guest-list">
          ${guestsHtml || '<li style="grid-column:1/-1;color:#856A5D;">ไม่มีรายชื่อ</li>'}
        </ul>
      </article>
    `;
  }).join('');
}

function filterTables() {
  const q = (document.getElementById('guestSearch')?.value || '').trim().toLowerCase();
  if (!q) {
    renderTables(allTables);
    return;
  }

  const filtered = allTables.filter(t => {
    const matchTable = String(t.tableNo || '').toLowerCase().includes(q);
    const matchGuest = (t.guests || []).some(g => String(g).toLowerCase().includes(q));
    return matchTable || matchGuest;
  });

  renderTables(filtered);
}

async function loadTablesData() {
  const grid = document.getElementById('tablesGrid');
  try {
    const res = await fetch(GAS_URL);
    const result = await res.json();
    if (result.status === 'success' && Array.isArray(result.tables)) {
      allTables = result.tables;
      renderTables(allTables);
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

document.addEventListener('DOMContentLoaded', loadTablesData);