let canvas = document.getElementById('wheel');
let ctx = canvas.getContext('2d');
let centerX, centerY, radius;

let allNumbers = [];
let drawnWinners = [];
let rotation = 0;
let sponsorName = "";

// Gold-themed colors
const colors = [
  '#FFD700', '#D4AF37', '#FFEC8B', '#FADA5E', '#E6BE8A',
  '#FFC000', '#CFB53B', '#C5B358', '#B8860B', '#AA6C39'
];

const celebrationWords = [];

// Sponsor logos — update paths as needed
const sponsorLogos = [
  './assets/images/top-logo.png',
  './assets/images/super.png',
  './assets/images/top-logo.png'
];

let isSpawningEffects = false;

// Initialize sponsor logos
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

// Initialize canvas size based on number of participants
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

// Get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Initialize raffle
function initRaffle() {
  const totalStr = getUrlParameter('tickets');
  const company = getUrlParameter('company');
  const total = parseInt(totalStr, 10);

  if (isNaN(total) || total < 1) {
    alert("Invalid number of tickets. Redirecting to setup...");
    window.location.href = 'raffle-setup.html';
    return false;
  }

  if (!company) {
    alert("No company name provided. Redirecting to setup...");
    window.location.href = 'raffle-setup.html';
    return false;
  }

  sponsorName = decodeURIComponent(company);
  document.getElementById('modalSponsorName').textContent = sponsorName;

  allNumbers = Array.from({ length: total }, (_, i) => i + 1);
  drawnWinners = [];
  rotation = 0;

  initCanvasSize(total);
  document.getElementById('winnerList').innerHTML = '';
  document.getElementById('winnerDisplay').textContent = '-';
  drawWheel();
  return true;
}

// Draw the wheel
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const total = allNumbers.length;

  if (total === 0) {
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No Numbers', centerX, centerY);
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

      ctx.fillStyle = '#1a1a1a';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(allNumbers[i].toString(), textX, textY);
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

// Floating gold dot
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

// Celebration word
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

// Start continuous effects
function startContinuousEffects() {
  if (isSpawningEffects) return;
  isSpawningEffects = true;
  setInterval(() => {
    spawnFloatingDot();
    spawnCelebrationWord();
  }, 400);
}

// Show winner modal
function showWinnerModal(winner) {
  document.getElementById('winnerNumber').textContent = winner;
  document.getElementById('congratsText').textContent = "Congratulations!";
  document.getElementById('modalSponsorName').textContent = sponsorName;

  const modal = document.getElementById('winnerModal');
  modal.classList.remove('show');
  void modal.offsetWidth;
  modal.classList.add('show');

  startContinuousEffects();
}

// Close winner modal
function closeWinnerModal() {
  document.getElementById('winnerModal').classList.remove('show');
}

// Draw winner with spin animation
function drawWinner() {
  if (drawnWinners.length >= allNumbers.length) {
    alert("All numbers have already won!");
    return;
  }

  if (drawnWinners.length === 0 && !initRaffle()) return;

  document.getElementById('drawBtn').disabled = true;

  const available = allNumbers.filter(num => !drawnWinners.includes(num));
  const winner = available[Math.floor(Math.random() * available.length)];
  const winnerIndex = allNumbers.indexOf(winner);
  const total = allNumbers.length;

  const sliceAngleDeg = 360 / total;
  const middleOfWinnerSlice = winnerIndex * sliceAngleDeg + sliceAngleDeg / 2;
  const targetRotation = middleOfWinnerSlice;
  const spinDegrees = 10 * 360;
  const finalRotation = -targetRotation - spinDegrees;

  const totalDuration = 10000;
  const startTime = Date.now();
  const startRotation = rotation;

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
      document.getElementById('winnerDisplay').textContent = `🏆 ${winner}`;

      const winnerList = document.getElementById('winnerList');
      const div = document.createElement('div');
      div.className = 'winner-item';
      div.textContent = `#${drawnWinners.length}: ${winner}`;
      winnerList.appendChild(div);
      winnerList.scrollTop = winnerList.scrollHeight;

      document.getElementById('drawBtn').disabled = false;
      showWinnerModal(winner);
    }
  };

  animate();
}

// Reset raffle
function resetRaffle() {
  initRaffle();
  document.getElementById('drawBtn').disabled = false;
}

// Handle window resize
window.addEventListener('resize', function () {
  if (allNumbers.length > 0) {
    initCanvasSize(allNumbers.length);
    drawWheel();
  }
});

// On page load
window.onload = function () {
  initRaffle();
  initSponsorLogos();
};