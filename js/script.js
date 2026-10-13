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
  const btn = document.getElementById('submitBtn');
  const alertBox = document.getElementById('rsvpAlert');

  btn.disabled = true;
  btn.textContent = 'กำลังบันทึกข้อมูล...';
  alertBox.style.display = 'none';

  const formData = {
    name: document.getElementById('guestName').value,
    attendance: document.getElementById('attendance').value,
    guests: document.getElementById('guestCount').value,
    wishes: document.getElementById('wishes').value
  };

  // ⚠️ นำ Web App URL ของคุณมาวางในช่องนี้ ⚠️
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbz1P1T3BP3ML_GlJekD8E2QCnqDZ15f5yC2a_FjUzCD0T-ipgAm-CbeXE04N5GhoHjYug/exec';

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