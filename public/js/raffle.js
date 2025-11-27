// raffle.js - FINAL VERSION WITH DATABASE INTEGRATION

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

// Celebration words
const celebrationWords = [
  '🎉', '🏆', '✨', '🔥', '💫',
  'Bravo!', 'Amazing!', 'Congratulations!',
  'You Won!', 'Jackpot!', 'Anthony Higgins!'
];

// Sponsor logos
const sponsorLogos = [
  './assets/images/top-logo.png',
  './assets/images/super.png',
  './assets/images/top-logo.png'
];

let isSpawningEffects = false;

// Inject keyframe animations
(function injectAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUpDot {
      to { transform: translateY(-100vh) scale(1.5); opacity: 0; }
    }
    @keyframes floatUpWord {
      to { transform: translateY(-100vh) rotate(15deg); opacity: 0; }
    }
    @keyframes numberGlow {
      0%, 100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
      50% { text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.6); }
    }
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.6); }
      70% { transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
})();

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

// Initialize canvas size
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

// Fetch real participants from your API
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

// Initialize raffle with real data
async function initRaffle() {
  const company = getUrlParameter('company');
  if (!company) {
    alert("No sponsor company provided!");
    window.location.href = 'raffle-setup.html';
    return;
  }

  sponsorName = decodeURIComponent(company);
  document.getElementById('modalSponsorName').textContent = sponsorName;

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

// Draw wheel with lucky numbers
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

      const luckyText = `${participants[i].lucky_number}`;
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(luckyText, textX, textY);
    }
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

// Floating effects
function spawnFloatingDot() {
  const modal = document.getElementById('winnerModal');
  if (!modal || !modal.classList.contains('show')) return;

  const dot = document.createElement('div');
  dot.classList.add('floating-dot');
  const size = Math.random() * 12 + 4;
  dot.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${Math.random() * 100}vw;
    top: 100vh;
    background-color: ${colors[Math.floor(Math.random() * colors.length)]};
    border-radius: 50%;
    opacity: 0.8;
    pointer-events: none;
    z-index: 5;
    animation: floatUpDot ${Math.random() * 4 + 3}s ease-out forwards;
  `;
  modal.appendChild(dot);

  setTimeout(() => {
    if (dot.parentNode === modal) modal.removeChild(dot);
  }, 6000);
}

function spawnCelebrationWord() {
  const modal = document.getElementById('winnerModal');
  if (!modal || !modal.classList.contains('show')) return;

  const word = document.createElement('div');
  word.classList.add('celebration-word');
  word.textContent = celebrationWords[Math.floor(Math.random() * celebrationWords.length)];
  word.style.cssText = `
    position: absolute;
    left: ${Math.random() * 100}vw;
    top: 100vh;
    color: ${colors[Math.floor(Math.random() * colors.length)]};
    font-size: ${Math.random() * 16 + 16}px;
    font-weight: bold;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    opacity: 0.9;
    pointer-events: none;
    z-index: 5;
    animation: floatUpWord ${Math.random() * 4 + 3}s ease-out forwards;
  `;
  modal.appendChild(word);

  setTimeout(() => {
    if (word.parentNode === modal) modal.removeChild(word);
  }, 6000);
}

function startContinuousEffects() {
  if (isSpawningEffects) return;
  isSpawningEffects = true;

  const interval = setInterval(() => {
    const modal = document.getElementById('winnerModal');
    if (!modal || !modal.classList.contains('show')) {
      clearInterval(interval);
      isSpawningEffects = false;
      return;
    }
    spawnFloatingDot();
    spawnCelebrationWord();
  }, 500);
}

// SHOW WINNER MODAL — WITH GOLD NAME & FULL GLOWING COMPANY LINE
function showWinnerModal(winner) {
  // Update number and name
  document.getElementById('winnerNumber').textContent = `${winner.lucky_number}`;
  const nameEl = document.getElementById('congratsText');
  nameEl.textContent = `${winner.name} ${winner.surname}`;
  nameEl.style.color = '#FFD700';
  nameEl.style.textShadow = '0 2px 8px rgba(255, 215, 0, 0.5)';
  nameEl.style.fontWeight = 'bold';

  // Update sponsor
  document.getElementById('modalSponsorName').textContent = sponsorName;

  // Inject company & table with FULL gold glow effect
  const detailsDiv = document.getElementById('winnerDetails');
  if (detailsDiv) detailsDiv.remove();

  const details = document.createElement('div');
  details.id = 'winnerDetails';
  details.innerHTML = `
    <div style="margin-top: 15px; text-align: center; font-size: 18px;">
      <p style="color: #FFD700; text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5); font-weight: bold; letter-spacing: 0.5px;">
        Company: ${winner.company_name || 'N/A'}
      </p>
      <p style="color: white; text-shadow: 0 1px 4px rgba(0,0,0,0.6); margin-top: 8px;">
        Table: ${winner.table_number || 'N/A'}
      </p>
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

function closeWinnerModal() {
  document.getElementById('winnerModal').classList.remove('show');
  isSpawningEffects = false;
  document.querySelectorAll('.floating-dot, .celebration-word').forEach(el => el.remove());
}

// ✅ DRAW WINNER AND SAVE TO DATABASE
async function drawAndSaveWinner() {
  // Get sponsor from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sponsorCompany = urlParams.get('company') || 'Anonymous Sponsor';
  
  // Disable button during draw
  const btn = document.getElementById('drawBtn');
  btn.disabled = true;
  btn.textContent = 'Drawing...';

  try {
    // Validate participants
    if (drawnWinners.length >= participants.length) {
      alert("All participants have won!");
      btn.disabled = false;
      btn.textContent = 'Draw Winner';
      return;
    }

    // Get available participants (non-winners)
    const available = participants.filter(p => 
      !drawnWinners.some(w => w.lucky_number === p.lucky_number)
    );

    if (available.length === 0) {
      alert("No eligible participants left!");
      btn.disabled = false;
      btn.textContent = 'Draw Winner';
      return;
    }

    // Call new API endpoint to draw AND save winner
    const response = await fetch('/api/raffle/draw-and-save', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorCompany })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to draw winner');
    }

    const { winner } = await response.json();
    
    // Find winner index for wheel animation
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

    // Animate wheel
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

        // Update UI with saved winner
        drawnWinners.push(winner);
        document.getElementById('winnerDisplay').textContent = `🏆 ${winner.lucky_number}`;

        const winnerList = document.getElementById('winnerList');
        const div = document.createElement('div');
        div.className = 'winner-item';
        div.textContent = `#${drawnWinners.length}: ${winner.lucky_number}`;
        winnerList.appendChild(div);
        winnerList.scrollTop = winnerList.scrollHeight;

        // Show modal
        showWinnerModal(winner);
      }
    };

    animate();
  } catch (error) {
    console.error('Draw and save error:', error);
    alert('Failed to draw winner: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Draw Winner';
  }
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