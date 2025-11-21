// raffle.js - FULL UPDATE

let canvas = document.getElementById('wheel');
let ctx = canvas.getContext('2d');
let centerX, centerY, radius;

let participants = []; // Store real guest data
let drawnWinners = []; // Store drawn guest objects
let rotation = 0;
let sponsorName = "";

// Gold-themed colors
const colors = [
  '#FFD700', '#D4AF37', '#FFEC8B', '#FADA5E', '#E6BE8A',
  '#FFC000', '#CFB53B', '#C5B358', '#B8860B', '#AA6C39'
];

const celebrationWords = ['🎉', '🏆', '✨', '🎊', '🤩', '👏', '🌟'];

// Sponsor logos
const sponsorLogos = [
  './assets/images/top-logo.png',
  './assets/images/super.png',
  './assets/images/top-logo.png'
];

let isSpawningEffects = false;

// Initialize sponsor logos (unchanged)
function initSponsorLogos() {
  const container = document.getElementById('sponsorLogosContainer');
  container.innerHTML = '';

  sponsorLogos.forEach(logoUrl => {
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'Sponsor Logo';
    img.className = 'sponsor-logo';
    img.onerror = function () {
      this.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'sponsor-logo';
      placeholder.style.cssText = `
        width: 120px;
        height: 50px;
        background: rgba(255,255,255,0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFD700;
        font-weight: bold;
      `;
      placeholder.textContent = 'LOGO';
      container.appendChild(placeholder);
    };
    container.appendChild(img);
  });
}

// Initialize canvas
function initCanvasSize(total) {
  const container = document.querySelector('.wheel-container');
  const containerWidth = container.clientWidth;
  let baseSize = Math.min(containerWidth, 600);
  if (total > 30) baseSize = Math.min(containerWidth, 700);
  if (total > 50) baseSize = Math.min(containerWidth, 800);
  if (total > 100) baseSize = Math.min(containerWidth, 900);
  canvas.width = baseSize;
  canvas.height = baseSize;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  radius = Math.min(centerX, centerY) - 20;
}

// Get URL parameter
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// ✅ NEW: Fetch real participants with lucky numbers
async function fetchParticipants() {
  try {
    const response = await fetch('/api/raffle/participants', {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load participants');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load raffle participants. Please try again.');
    window.location.href = 'raffle-setup.html';
    return [];
  }
}

// ✅ NEW: Initialize with real data
async function initRaffle() {
  const company = getUrlParameter('company');
  if (!company) {
    alert("No sponsor company provided!");
    window.location.href = 'raffle-setup.html';
    return;
  }

  sponsorName = decodeURIComponent(company);
  document.getElementById('modalSponsorName').textContent = sponsorName;

  // Fetch real participants
  participants = await fetchParticipants();
  
  if (participants.length === 0) {
    document.getElementById('winnerDisplay').textContent = '❌ No eligible participants';
    document.getElementById('drawBtn').disabled = true;
    return;
  }

  drawnWinners = [];
  rotation = 0;
  initCanvasSize(participants.length);
  document.getElementById('winnerList').innerHTML = '';
  document.getElementById('winnerDisplay').textContent = '-';
  drawWheel();
}

// ✅ UPDATED: Draw real lucky numbers on wheel
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const total = participants.length;

  if (total === 0) {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Participants', centerX, centerY);
    return;
  }

  ctx.save();
  const rotationRad = (rotation * Math.PI) / 180;
  ctx.translate(centerX, centerY);
  ctx.rotate(rotationRad - Math.PI / 2);
  ctx.translate(-centerX, -centerY);

  const angleStep = (2 * Math.PI) / total;
  const baseFontSize = Math.max(10, Math.min(20, radius / 8));
  const fontSize = Math.max(8, baseFontSize * (30 / Math.max(total, 30)));
  const showLabels = total <= 200;

  for (let i = 0; i < total; i++) {
    const startAngle = i * angleStep;
    const endAngle = startAngle + angleStep;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (showLabels) {
      const midAngle = startAngle + angleStep / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + Math.cos(midAngle) * textRadius;
      const textY = centerY + Math.sin(midAngle) * textRadius;

      // ✅ Display lucky number as #142
      const luckyText = `#${participants[i].lucky_number}`;
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(luckyText, textX, textY);
    }
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

// ✅ NEW: Show winner details in modal
function showWinnerModal(winner) {
  // Update modal content
  document.getElementById('winnerNumber').textContent = `#${winner.lucky_number}`;
  document.getElementById('congratsText').textContent = 
    `${winner.name} ${winner.surname}`;
  document.getElementById('modalSponsorName').textContent = sponsorName;

  // ✅ Add winner details below
  const detailsDiv = document.getElementById('winnerDetails');
  if (detailsDiv) detailsDiv.remove(); // Remove previous if exists

  const details = document.createElement('div');
  details.id = 'winnerDetails';
  details.innerHTML = `
    <div style="margin-top: 15px; color: white; font-size: 18px;">
      <p><strong>Company:</strong> ${winner.company_name || 'N/A'}</p>
      <p><strong>Table:</strong> ${winner.table_number || 'N/A'}</p>
    </div>
  `;
  document.getElementById('modalContent').appendChild(details);

  // Show modal
  const modal = document.getElementById('winnerModal');
  modal.classList.remove('show');
  void modal.offsetWidth;
  modal.classList.add('show');

  startContinuousEffects();
}

// Floating effects (unchanged)
function spawnFloatingDot() {
  const modal = document.getElementById('winnerModal');
  const dot = document.createElement('div');
  dot.classList.add('floating-dot');
  const size = Math.random() * 12 + 4;
  dot.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${Math.random() * 100}vw;
    background-color: ${colors[Math.floor(Math.random() * colors.length)]};
    animation: floatUpDot ${Math.random() * 4 + 3}s ease-out;
  `;
  modal.appendChild(dot);
}

function spawnCelebrationWord() {
  const modal = document.getElementById('winnerModal');
  const word = document.createElement('div');
  word.classList.add('celebration-word');
  word.textContent = celebrationWords[Math.floor(Math.random() * celebrationWords.length)];
  word.style.cssText = `
    left: ${Math.random() * 100}vw;
    color: ${colors[Math.floor(Math.random() * colors.length)]};
    font-size: ${Math.random() * 16 + 16}px;
    animation: floatUpWord ${Math.random() * 4 + 3}s ease-out;
  `;
  modal.appendChild(word);
}

function startContinuousEffects() {
  if (isSpawningEffects) return;
  isSpawningEffects = true;
  setInterval(() => {
    spawnFloatingDot();
    spawnCelebrationWord();
  }, 400);
}

function closeWinnerModal() {
  document.getElementById('winnerModal').classList.remove('show');
}

// ✅ UPDATED: Draw real winner
function drawWinner() {
  if (drawnWinners.length >= participants.length) {
    alert("All participants have won!");
    return;
  }

  // Get available participants
  const available = participants.filter(p => 
    !drawnWinners.some(w => w.lucky_number === p.lucky_number)
  );

  const winner = available[Math.floor(Math.random() * available.length)];
  const winnerIndex = participants.findIndex(p => p.lucky_number === winner.lucky_number);
  const total = participants.length;

  const sliceAngleDeg = 360 / total;
  const middleOfWinnerSlice = winnerIndex * sliceAngleDeg + sliceAngleDeg / 2;
  const targetRotation = middleOfWinnerSlice;
  const spinDegrees = 10 * 360;
  const finalRotation = -targetRotation - spinDegrees;

  const totalDuration = 10000;
  const startTime = Date.now();
  const startRotation = rotation;

  document.getElementById('drawBtn').disabled = true;

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    rotation = startRotation + (finalRotation - startRotation) * easeOut;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      rotation = -targetRotation;
      drawWheel();

      drawnWinners.push(winner);
      document.getElementById('winnerDisplay').textContent = `🏆 #${winner.lucky_number}`;

      const winnerList = document.getElementById('winnerList');
      const div = document.createElement('div');
      div.className = 'winner-item';
      div.textContent = `#${drawnWinners.length}: #${winner.lucky_number}`;
      winnerList.appendChild(div);
      winnerList.scrollTop = winnerList.scrollHeight;

      document.getElementById('drawBtn').disabled = false;
      showWinnerModal(winner);
    }
  };

  animate();
}

function resetRaffle() {
  initRaffle();
  document.getElementById('drawBtn').disabled = false;
}

window.addEventListener('resize', function () {
  if (participants.length > 0) {
    initCanvasSize(participants.length);
    drawWheel();
  }
});

window.onload = function () {
  initRaffle();
  initSponsorLogos();
};