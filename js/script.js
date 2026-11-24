// ⚠️ นำ Web App URL ของคุณมาวางในช่องนี้ ⚠️
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw9-7JRV_dL0PlyVVlJcXXDhtf3BMIHMjXjlypx68z2ih32-4a3bMonjZIMH4FYio2hZA/exec';
let opened = false;

function openInvitation() {
  if (opened) return;
  opened = true;

  const scene = document.getElementById('envelopeScene');
  const button = document.getElementById('openButton');
  const hint = document.getElementById('hint');
  const invitation = document.getElementById('invitation');

  // 1. เปิดฝาสามเหลี่ยมขึ้น + การ์ดลอยขึ้น
  scene.classList.add('open');
  button.disabled = true;
  button.textContent = 'กำลังเปิดการ์ด…';

  // 2. เผยการ์ดเชิญด้านล่าง
  setTimeout(() => {
    invitation.style.display = 'block';
    requestAnimationFrame(() => {
      invitation.classList.add('show');
    });

    button.style.display = 'none';
    hint.style.display = 'none';

    // 3. เลื่อนลงล่างไปหาคำเชิญหลัก
    setTimeout(() => {
      invitation.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 400);

  }, 1200);
}

function submitRSVP(e) {
  e.preventDefault();
  let btn = document.getElementById('submitBtn');
  let alertBox = document.getElementById('rsvpAlert');
  
  let name = document.getElementById('guestName').value;
  let attendance = document.getElementById('attendance').value;
  let guests = document.getElementById('guestCount').value;
  let wishes = document.getElementById('wishes').value;

  if(String(name || '').trim() == '') {
    return;
  } else if(String(guests || '').trim() == '' || guests <= 0) {
    return;
  }

  btn.disabled = true;
  btn.textContent = 'กำลังบันทึกข้อมูล...';
  alertBox.style.display = 'none';

  let formData = {
    name: String(name || ''),
    attendance: attendance,
    guests: guests,
    wishes: String(wishes || '')
  };

  fetch(GAS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(formData)
  })
  .then(() => {
    btn.disabled = false;
    btn.textContent = 'ส่งแบบตอบรับสำเร็จ ♡';
    alertBox.className = 'alert-success';
    alertBox.textContent = 'ขอบคุณสำหรับการตอบรับการมาร่วมงานครับ!';
    alertBox.style.display = 'block';
    document.getElementById('rsvpForm').reset();
  })
  .catch((err) => {
    btn.disabled = false;
    btn.textContent = 'ลองใหม่อีกครั้ง';
    alertBox.className = 'alert-error';
    alertBox.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    alertBox.style.display = 'block';
  });
}

let lastWishesSnapshot = '';

function scrollWishes(direction) {
  const carousel = document.getElementById('wishesCarousel');
  if (!carousel) return;
  carousel.scrollBy({ left: direction * 262, behavior: 'smooth' });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadWishesCarousel() {
  const carousel = document.getElementById('wishesCarousel');
  const countBox = document.getElementById('wishCount');
  if (!carousel) return;

  try {
    const response = await fetch(GAS_URL);
    const result = await response.json();
    if (result.status !== 'success') return;

    const wishes = result.data || [];
    const currentSnapshot = JSON.stringify(wishes);
    if (currentSnapshot === lastWishesSnapshot) return;

    const isFirstLoad = !lastWishesSnapshot;
    lastWishesSnapshot = currentSnapshot;

    if (countBox) countBox.textContent = `${wishes.length} ข้อความอวยพร`;

    if (wishes.length === 0) {
      carousel.innerHTML = '<div class="wish-placeholder">ร่วมเป็นคนแรกที่ส่งคำอวยพรให้คู่บ่าวสาว 🤍</div>';
      return;
    }

    // สุ่มลำดับเมื่อเปิดหน้าเว็บครั้งแรก ส่วนอัปเดตใหม่ภายหลังจะแสดงข้อความล่าสุดไว้ใบแรก
    const displayWishes = isFirstLoad ? shuffleArray(wishes) : wishes;

    carousel.innerHTML = displayWishes.map(item => {
      const initial = item.name.charAt(0).toUpperCase();
      const dateObj = new Date(item.timestamp);
      const dateStr = isNaN(dateObj)
        ? ''
        : dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

      return `
        <article class="wish-card">
          <div>
            <div class="wish-card-top">
              <div class="wish-avatar">${escapeHtml(initial)}</div>
              <div class="wish-sender">${escapeHtml(item.name)}</div>
            </div>
            <p class="wish-text">${escapeHtml(item.wishes)}</p>
          </div>
          <div class="wish-footer">
            <span>${dateStr}</span>
            <span class="wish-heart">♡</span>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    if (!lastWishesSnapshot) {
      carousel.innerHTML = '<div class="wish-placeholder">ไม่สามารถโหลดคำอวยพรได้ในขณะนี้</div>';
    }
  }
}

// เรียกโหลดทันทีและอัปเดตอัตโนมัติทุก 15 วินาที
document.addEventListener('DOMContentLoaded', () => {
  loadWishesCarousel();
  setInterval(loadWishesCarousel, 15000);
});

function copyAccountNumber() {
  const accEl = document.getElementById('accountNumber');
  const btn = document.getElementById('copyAccBtn');
  if (!accEl || !btn) return;

  // ตัดขีดออกให้เหลือเฉพาะตัวเลขเพื่อให้วางในแอปธนาคารได้ทันที
  const cleanNumber = accEl.textContent.replace(/[^0-9]/g, '');

  const onSuccess = () => {
    btn.textContent = 'คัดลอกเลขบัญชีแล้ว ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'คัดลอกเลขที่บัญชี';
      btn.classList.remove('copied');
    }, 2500);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(cleanNumber).then(onSuccess).catch(() => fallbackCopy(cleanNumber, onSuccess));
  } else {
    fallbackCopy(cleanNumber, onSuccess);
  }
}

function fallbackCopy(text, callback) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, 99999);
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  callback();
}

function renderHotelList(hotels) {
  const hotelListEl = document.getElementById('hotelList');
  if (!hotelListEl) return;

  if (!hotels || hotels.length === 0) {
    hotelListEl.innerHTML = '<div class="hotel-placeholder">ยังไม่มีข้อมูลที่พักแนะนำในขณะนี้</div>';
    return;
  }

  hotelListEl.innerHTML = hotels.map(hotel => {
    const rawLoc = String(hotel.location || '').trim();
    const mapHref = rawLoc
      ? (/^https?:\/\//i.test(rawLoc)
          ? rawLoc
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawLoc)}`)
      : '';

    return `
      <div class="hotel-item">
        <div class="hotel-info">
          <div class="hotel-name">${escapeHtml(hotel.name)}</div>
          ${hotel.address ? `<div class="hotel-meta">${escapeHtml(hotel.address)}</div>` : ''}
        </div>
        ${mapHref ? `<a href="${escapeHtml(mapHref)}" target="_blank" rel="noopener noreferrer" class="hotel-link">แผนที่</a>` : ''}
      </div>
    `;
  }).join('');
}

async function loadWishesCarousel() {
  const carousel = document.getElementById('wishesCarousel');
  const countBox = document.getElementById('wishCount');

  try {
    const response = await fetch(GAS_URL);
    const result = await response.json();
    if (result.status !== 'success') return;

    // อัปเดตรายชื่อที่พักจากแท็บ Hotel
    if (Array.isArray(result.hotels)) {
      renderHotelList(result.hotels);
    }

    if (!carousel) return;

    const wishes = result.data || [];
    const currentSnapshot = JSON.stringify(wishes);
    if (currentSnapshot === lastWishesSnapshot) return;

    const isFirstLoad = !lastWishesSnapshot;
    lastWishesSnapshot = currentSnapshot;

    if (countBox) countBox.textContent = `${wishes.length} ข้อความอวยพร`;

    if (wishes.length === 0) {
      carousel.innerHTML = '<div class="wish-placeholder">ร่วมเป็นคนแรกที่ส่งคำอวยพรให้คู่บ่าวสาว 🤍</div>';
      return;
    }

    const displayWishes = isFirstLoad ? shuffleArray(wishes) : wishes;

    carousel.innerHTML = displayWishes.map(item => {
      const initial = item.name.charAt(0).toUpperCase();
      const dateObj = new Date(item.timestamp);
      const dateStr = isNaN(dateObj)
        ? ''
        : dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

      return `
        <article class="wish-card">
          <div>
            <div class="wish-card-top">
              <div class="wish-avatar">${escapeHtml(initial)}</div>
              <div class="wish-sender">${escapeHtml(item.name)}</div>
            </div>
            <p class="wish-text">${escapeHtml(item.wishes)}</p>
          </div>
          <div class="wish-footer">
            <span>${dateStr}</span>
            <span class="wish-heart">♡</span>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    console.error('โหลดข้อมูลไม่สำเร็จ:', err);
    if (carousel && !lastWishesSnapshot) {
      carousel.innerHTML = '<div class="wish-placeholder">ไม่สามารถโหลดคำอวยพรได้ในขณะนี้</div>';
    }
    const hotelListEl = document.getElementById('hotelList');
    if (hotelListEl && hotelListEl.querySelector('.hotel-placeholder')) {
      hotelListEl.innerHTML = '<div class="hotel-placeholder">ไม่สามารถโหลดรายชื่อที่พักได้ในขณะนี้</div>';
    }
  }
}