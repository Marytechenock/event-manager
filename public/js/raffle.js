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

    const celebrationWords = ["Congratulations!", "Winner!", "Amazing!", "You Rock!", "Bravo!", "Hooray!", "Gold Winner!"];

    let isSpawningEffects = false;

    // Initialize canvas size based on number of participants
    function initCanvasSize(total) {
      const container = document.querySelector('.wheel-container');
      const containerWidth = container.clientWidth;

      // Base size with scaling based on number of participants
      let baseSize = Math.min(containerWidth, 600); // Max 600px

      // Scale up for more participants
      if (total > 30) baseSize = Math.min(containerWidth, 700);
      if (total > 50) baseSize = Math.min(containerWidth, 800);
      if (total > 100) baseSize = Math.min(containerWidth, 900);

      canvas.width = baseSize;
      canvas.height = baseSize;

      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
      radius = Math.min(centerX, centerY) - 20; // Increased margin for better display
    }

    // Get URL parameters
    function getUrlParameter(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }

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

      // Initialize canvas with proper size
      initCanvasSize(total);

      document.getElementById('winnerList').innerHTML = '';
      document.getElementById('winnerDisplay').textContent = '-';
      drawWheel();
      return true;
    }

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

      // Dynamic font size based on number of participants and wheel size
      const baseFontSize = Math.max(10, Math.min(20, radius / 8));
      const fontSize = Math.max(8, baseFontSize * (30 / Math.max(total, 30)));
      const showLabels = total <= 200; // Show numbers up to 200 participants

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

    function spawnFloatingDot() {
      const modal = document.getElementById('winnerModal');
      const dot = document.createElement('div');
      dot.classList.add('floating-dot');

      const size = Math.random() * 12 + 4;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}vw`;
      dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 4 + 3;
      dot.style.animation = `floatUpDot ${duration}s ease-out`;

      modal.appendChild(dot);
    }

    function spawnCelebrationWord() {
      const modal = document.getElementById('winnerModal');
      const word = document.createElement('div');
      word.classList.add('celebration-word');
      word.textContent = celebrationWords[Math.floor(Math.random() * celebrationWords.length)];
      word.style.left = `${Math.random() * 100}vw`;
      word.style.color = colors[Math.floor(Math.random() * colors.length)];
      word.style.fontSize = `${Math.random() * 16 + 16}px`;
      const duration = Math.random() * 4 + 3;
      word.style.animation = `floatUpWord ${duration}s ease-out`;
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

    function closeWinnerModal() {
      document.getElementById('winnerModal').classList.remove('show');
    }

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
      const spinDegrees = 5 * 360;
      const finalRotation = -targetRotation - spinDegrees;

      const totalDuration = 3000;
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

    function resetRaffle() {
      initRaffle();
      document.getElementById('drawBtn').disabled = false;
    }

    // Handle window resize
    window.addEventListener('resize', function() {
      if (allNumbers.length > 0) {
        initCanvasSize(allNumbers.length);
        drawWheel();
      }
    });

    window.onload = function() {
      initRaffle();
    };




  // const canvas = document.getElementById('wheel');
    // const ctx = canvas.getContext('2d');
    // const centerX = canvas.width / 2;
    // const centerY = canvas.height / 2;
    // const radius = Math.min(centerX, centerY) - 10;

    // let allNumbers = [];
    // let drawnWinners = [];
    // let rotation = 0;
    // let sponsorName = "";

    // const colors = [
    //   '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    //   '#1abc9c', '#d35400', '#8e44ad', '#27ae60', '#f1c40f'
    // ];

    // const celebrationWords = ["Congratulations!", "Winner!", "Amazing!", "ANTONY HIGGINS!", "You Rock!", "Bravo!", "Hooray!","Gambler!"];

    // let isSpawningEffects = false;

    // // Get URL parameters
    // function getUrlParameter(name) {
    //   const urlParams = new URLSearchParams(window.location.search);
    //   return urlParams.get(name);
    // }

    // function initRaffle() {
    //   const totalStr = getUrlParameter('tickets');
    //   const company = getUrlParameter('company');
    //   const total = parseInt(totalStr, 10);

    //   if (isNaN(total) || total < 1) {
    //     alert("Invalid number of tickets. Redirecting to setup...");
    //     window.location.href = 'raffle-setup.html';
    //     return false;
    //   }

    //   if (!company) {
    //     alert("No company name provided. Redirecting to setup...");
    //     window.location.href = 'raffle-setup.html';
    //     return false;
    //   }

    //   sponsorName = decodeURIComponent(company);
    //   // Set sponsor name in modal (will be shown when modal opens)
    //   document.getElementById('modalSponsorName').textContent = sponsorName;

    //   allNumbers = Array.from({ length: total }, (_, i) => i + 1);
    //   drawnWinners = [];
    //   rotation = 0;
    //   document.getElementById('winnerList').innerHTML = '';
    //   document.getElementById('winnerDisplay').textContent = '-';
    //   drawWheel();
    //   return true;
    // }

    // function drawWheel() {
    //   ctx.clearRect(0, 0, canvas.width, canvas.height);
    //   const total = allNumbers.length;

    //   if (total === 0) {
    //     ctx.fillStyle = '#ddd';
    //     ctx.fillRect(0, 0, canvas.width, canvas.height);
    //     ctx.fillStyle = '#333';
    //     ctx.font = 'bold 20px Arial';
    //     ctx.textAlign = 'center';
    //     ctx.fillText('No Numbers', centerX, centerY);
    //     return;
    //   }

    //   ctx.save();
    //   const rotationRad = (rotation * Math.PI) / 180;
    //   ctx.translate(centerX, centerY);
    //   ctx.rotate(rotationRad - Math.PI / 2);
    //   ctx.translate(-centerX, -centerY);

    //   const angleStep = (2 * Math.PI) / total;
    //   const showLabels = total <= 500;

    //   for (let i = 0; i < total; i++) {
    //     const startAngle = i * angleStep;
    //     const endAngle = startAngle + angleStep;

    //     ctx.beginPath();
    //     ctx.moveTo(centerX, centerY);
    //     ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    //     ctx.closePath();
    //     ctx.fillStyle = colors[i % colors.length];
    //     ctx.fill();
    //     ctx.strokeStyle = '#fff';
    //     ctx.lineWidth = 1;
    //     ctx.stroke();

    //     if (showLabels) {
    //       const midAngle = startAngle + angleStep / 2;
    //       const textRadius = radius * 0.7;
    //       const textX = centerX + Math.cos(midAngle) * textRadius;
    //       const textY = centerY + Math.sin(midAngle) * textRadius;

    //       ctx.fillStyle = '#fff';
    //       ctx.font = 'bold 16px Arial';
    //       ctx.textAlign = 'center';
    //       ctx.textBaseline = 'middle';
    //       ctx.fillText(allNumbers[i].toString(), textX, textY);
    //     }
    //   }

    //   ctx.restore();
    // }

    // function spawnFloatingDot() {
    //   const modal = document.getElementById('winnerModal');
    //   const dot = document.createElement('div');
    //   dot.classList.add('floating-dot');

    //   const size = Math.random() * 12 + 4;
    //   dot.style.width = `${size}px`;
    //   dot.style.height = `${size}px`;
    //   dot.style.left = `${Math.random() * 100}vw`;
    //   dot.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    //   const duration = Math.random() * 4 + 3;
    //   dot.style.animation = `floatUpDot ${duration}s ease-out`;

    //   modal.appendChild(dot);
    // }

    // function spawnCelebrationWord() {
    //   const modal = document.getElementById('winnerModal');
    //   const word = document.createElement('div');
    //   word.classList.add('celebration-word');
    //   word.textContent = celebrationWords[Math.floor(Math.random() * celebrationWords.length)];
    //   word.style.left = `${Math.random() * 100}vw`;
    //   word.style.color = `hsl(${Math.random() * 360}, 100%, 90%)`;
    //   word.style.fontSize = `${Math.random() * 16 + 16}px`;
    //   const duration = Math.random() * 4 + 3;
    //   word.style.animation = `floatUpWord ${duration}s ease-out`;
    //   modal.appendChild(word);
    // }

    // function startContinuousEffects() {
    //   if (isSpawningEffects) return;
    //   isSpawningEffects = true;

    //   setInterval(() => {
    //     spawnFloatingDot();
    //     spawnCelebrationWord();
    //   }, 400);
    // }

    // function showWinnerModal(winner) {
    //   document.getElementById('winnerNumber').textContent = winner;
    //   document.getElementById('congratsText').textContent = "Congratulations!";
    //   // ✅ Sponsor name already set in initRaffle, but update just in case
    //   document.getElementById('modalSponsorName').textContent = sponsorName;

    //   const modal = document.getElementById('winnerModal');
    //   modal.classList.remove('show');
    //   void modal.offsetWidth;
    //   modal.classList.add('show');

    //   startContinuousEffects();
    // }

    // function closeWinnerModal() {
    //   document.getElementById('winnerModal').classList.remove('show');
    // }

    // function drawWinner() {
    //   if (drawnWinners.length >= allNumbers.length) {
    //     alert("All numbers have already won!");
    //     return;
    //   }

    //   if (drawnWinners.length === 0 && !initRaffle()) return;

    //   document.getElementById('drawBtn').disabled = true;

    //   const available = allNumbers.filter(num => !drawnWinners.includes(num));
    //   const winner = available[Math.floor(Math.random() * available.length)];
    //   const winnerIndex = allNumbers.indexOf(winner);
    //   const total = allNumbers.length;

    //   const sliceAngleDeg = 360 / total;
    //   const middleOfWinnerSlice = winnerIndex * sliceAngleDeg + sliceAngleDeg / 2;
    //   const targetRotation = middleOfWinnerSlice;
    //   const spinDegrees = 5 * 360;
    //   const finalRotation = -targetRotation - spinDegrees;

    //   const totalDuration = 3000;
    //   const startTime = Date.now();
    //   const startRotation = rotation;

    //   const animate = () => {
    //     const elapsed = Date.now() - startTime;
    //     const progress = Math.min(elapsed / totalDuration, 1);
    //     const easeOut = 1 - Math.pow(1 - progress, 3);
    //     rotation = startRotation + (finalRotation - startRotation) * easeOut;
    //     drawWheel();
    //     if (progress < 1) {
    //       requestAnimationFrame(animate);
    //     } else {
    //       rotation = -targetRotation;
    //       drawWheel();

    //       drawnWinners.push(winner);
    //       document.getElementById('winnerDisplay').textContent = `🏆 ${winner}`;

    //       const winnerList = document.getElementById('winnerList');
    //       const div = document.createElement('div');
    //       div.className = 'winner-item';
    //       div.textContent = `#${drawnWinners.length}: ${winner}`;
    //       winnerList.appendChild(div);
    //       winnerList.scrollTop = winnerList.scrollHeight;

    //       document.getElementById('drawBtn').disabled = false;

    //       showWinnerModal(winner);
    //     }
    //   };

    //   animate();
    // }

    // function resetRaffle() {
    //   initRaffle();
    //   document.getElementById('drawBtn').disabled = false;
    // }

    // window.onload = function() {
    //   initRaffle();
    // };
