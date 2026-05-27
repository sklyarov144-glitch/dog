(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const $ = (id) => document.getElementById(id);
  const ui = {
    score: $('score'), coins: $('coins'), best: $('best'), menu: $('menu'), gameOver: $('gameOver'),
    finalScore: $('finalScore'), finalCoins: $('finalCoins'), shop: $('shop'), bankCoins: $('bankCoins'), skins: $('skins'), toast: $('toast')
  };

  const SAVE_KEY = 'surfDogRushSave_v1';
  const lanes = [-250, 0, 250];
  const skins = [
    { id: 'classic', name: 'Классический щенок', emoji: '🐶', price: 0 },
    { id: 'shades', name: 'Щенок в очках', emoji: '😎', price: 250 },
    { id: 'crown', name: 'Королевский пёс', emoji: '👑', price: 600 },
    { id: 'alien', name: 'Космо-дог', emoji: '👽', price: 900 }
  ];

  let ysdk = null;
  let playerData = null;
  let adCounter = 0;
  let lastTime = 0;
  let state = 'menu';

  let save = loadSave();
  let game = makeGame();

  function makeGame() {
    return {
      t: 0, speed: 760, score: 0, runCoins: 0, lane: 1, x: 0, y: H - 300, targetX: 0,
      vy: 0, jumping: false, sliding: false, slideTimer: 0, invuln: 0,
      obstacles: [], coins: [], particles: [], spawnTimer: 0, coinTimer: 0, waveOffset: 0,
      revived: false, doubleUsed: false
    };
  }

  function loadSave() {
    try {
      return Object.assign({ best: 0, coins: 0, owned: ['classic'], skin: 'classic' }, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    } catch (_) {
      return { best: 0, coins: 0, owned: ['classic'], skin: 'classic' };
    }
  }
  function saveGame() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }

  async function initYandex() {
    if (!window.YaGames) return;
    try {
      ysdk = await YaGames.init();
      ysdk.features.LoadingAPI?.ready();
      try { playerData = await ysdk.getPlayer({ scopes: false }); } catch (_) {}
    } catch (e) { console.warn('Yandex SDK unavailable', e); }
  }

  function showToast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.add('hidden'), 2100);
  }

  function setOverlay(name) {
    ui.menu.classList.toggle('hidden', name !== 'menu');
    ui.gameOver.classList.toggle('hidden', name !== 'gameOver');
    ui.shop.classList.toggle('hidden', name !== 'shop');
  }

  function startGame() {
    game = makeGame();
    state = 'play';
    setOverlay('none');
    updateHud();
  }

  function endGame() {
    state = 'over';
    save.coins += game.runCoins;
    save.best = Math.max(save.best, Math.floor(game.score));
    saveGame();
    ui.finalScore.textContent = Math.floor(game.score);
    ui.finalCoins.textContent = game.runCoins;
    ui.best.textContent = save.best;
    ui.coins.textContent = save.coins;
    setOverlay('gameOver');
    submitLeaderboard();
    adCounter++;
    if (adCounter % 2 === 0) showInterstitial();
  }

  function updateHud() {
    ui.score.textContent = Math.floor(game.score);
    ui.coins.textContent = save.coins + game.runCoins;
    ui.best.textContent = save.best;
  }

  function laneLeft() { if (state === 'play') game.lane = Math.max(0, game.lane - 1); }
  function laneRight() { if (state === 'play') game.lane = Math.min(2, game.lane + 1); }
  function jump() {
    if (state === 'play' && !game.jumping) { game.vy = -980; game.jumping = true; pop(game.x, game.y + 105, 8); }
  }
  function slide() {
    if (state === 'play' && !game.jumping) { game.sliding = true; game.slideTimer = .55; }
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const r = Math.random();
    game.obstacles.push({
      lane, z: -120, type: r < .46 ? 'crab' : r < .78 ? 'buoy' : 'bird', passed: false
    });
  }
  function spawnCoins() {
    const lane = Math.floor(Math.random() * 3);
    for (let i = 0; i < 6; i++) game.coins.push({ lane, z: -160 - i * 90, taken: false });
  }

  function perspective(z) {
    const p = Math.max(0.12, Math.min(1.55, (z + 900) / 1500));
    return { p, y: 300 + p * 940, xScale: p };
  }

  function update(dt) {
    if (state !== 'play') return;
    game.t += dt;
    game.waveOffset += dt * 3;
    game.speed += dt * 11;
    game.score += dt * game.speed * 0.045;
    game.targetX = lanes[game.lane];
    game.x += (game.targetX - game.x) * Math.min(1, dt * 12);

    if (game.jumping) {
      game.y += game.vy * dt;
      game.vy += 2200 * dt;
      if (game.y >= H - 300) { game.y = H - 300; game.jumping = false; game.vy = 0; pop(game.x, game.y + 100, 7); }
    }
    if (game.sliding) { game.slideTimer -= dt; if (game.slideTimer <= 0) game.sliding = false; }
    if (game.invuln > 0) game.invuln -= dt;

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) { spawnObstacle(); game.spawnTimer = Math.max(.48, 1.1 - game.t * .006) + Math.random() * .45; }
    game.coinTimer -= dt;
    if (game.coinTimer <= 0) { spawnCoins(); game.coinTimer = 1.0 + Math.random() * 1.1; }

    const dz = game.speed * dt;
    game.obstacles.forEach(o => o.z += dz);
    game.coins.forEach(c => c.z += dz);
    game.obstacles = game.obstacles.filter(o => o.z < 1150);
    game.coins = game.coins.filter(c => c.z < 1150 && !c.taken);

    checkCollisions();
    updateParticles(dt);
    updateHud();
  }

  function hitBoxForPlayer() {
    const h = game.sliding ? 90 : 145;
    return { x: game.x, y: game.y + (game.sliding ? 50 : 0), w: 112, h };
  }

  function checkCollisions() {
    const pb = hitBoxForPlayer();
    for (const c of game.coins) {
      if (c.taken) continue;
      const pos = perspective(c.z);
      const x = lanes[c.lane] * pos.xScale;
      const y = pos.y;
      if (Math.abs(x - pb.x) < 105 && Math.abs(y - pb.y - 45) < 105) {
        c.taken = true; game.runCoins += 1; game.score += 25; pop(x, y, 5);
      }
    }
    if (game.invuln > 0) return;
    for (const o of game.obstacles) {
      const pos = perspective(o.z);
      if (pos.p < .95 || pos.p > 1.38) continue;
      const x = lanes[o.lane] * pos.xScale;
      const y = pos.y;
      const sameLane = Math.abs(x - pb.x) < 95;
      const yClose = Math.abs(y - pb.y - 50) < 115;
      const dodgedBird = o.type === 'bird' && game.sliding;
      if (sameLane && yClose && !dodgedBird) { shake(14); endGame(); return; }
    }
  }

  let shakePower = 0;
  function shake(v) { shakePower = Math.max(shakePower, v); }
  function pop(x, y, n) {
    for (let i = 0; i < n; i++) game.particles.push({ x, y, vx: (Math.random() - .5) * 420, vy: (Math.random() - .7) * 360, life: .55 + Math.random() * .35 });
  }
  function updateParticles(dt) {
    game.particles.forEach(p => { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; });
    game.particles = game.particles.filter(p => p.life > 0);
  }

  function draw() {
    ctx.save();
    if (shakePower > 0) { ctx.translate((Math.random() - .5) * shakePower, (Math.random() - .5) * shakePower); shakePower *= .88; if (shakePower < .2) shakePower = 0; }
    drawScene();
    drawObjects();
    drawPlayer();
    drawParticles();
    ctx.restore();
  }

  function drawScene() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5f74d8'); sky.addColorStop(.26, '#ff8b61'); sky.addColorStop(.48, '#ffd25c'); sky.addColorStop(.49, '#157fc7'); sky.addColorStop(1, '#073e65');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,240,150,.95)'; ctx.beginPath(); ctx.arc(W * .75, 520, 120, 0, Math.PI * 2); ctx.fill();
    // palm island silhouettes
    ctx.fillStyle = 'rgba(20,65,43,.7)';
    ctx.beginPath(); ctx.ellipse(W * .82, 735, 180, 40, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 7; i++) drawPalm(W * (.69 + i * .045), 700 + Math.sin(i) * 20, .7 + i * .03);
    // wave lanes
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const baseX = W / 2 + lanes[i] * .3;
      ctx.moveTo(baseX, 590);
      ctx.bezierCurveTo(W / 2 + lanes[i] * .6, 900, W / 2 + lanes[i], 1180, W / 2 + lanes[i], H + 100);
      ctx.stroke();
    }
    // foam
    for (let i = 0; i < 22; i++) {
      const y = 650 + i * 45 + Math.sin(game.waveOffset + i) * 10;
      ctx.strokeStyle = `rgba(255,255,255,${.12 + (i % 3) * .03})`;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.quadraticCurveTo(W * .5, y + Math.sin(i + game.waveOffset) * 35, W, y - 20); ctx.stroke();
    }
  }

  function drawPalm(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.18);
    ctx.fillStyle = 'rgba(66,38,20,.75)'; ctx.fillRect(-5, -110, 10, 115);
    ctx.fillStyle = 'rgba(13,70,34,.9)';
    for (let a = -1.2; a <= 1.2; a += .4) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -120, 14, 60, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }

  function drawObjects() {
    const objs = [
      ...game.coins.map(c => ({ ...c, kind: 'coin' })),
      ...game.obstacles.map(o => ({ ...o, kind: 'obs' }))
    ].sort((a, b) => a.z - b.z);
    for (const obj of objs) {
      const pos = perspective(obj.z);
      if (pos.p <= .13 || pos.p > 1.55) continue;
      const x = W / 2 + lanes[obj.lane] * pos.xScale;
      const y = pos.y;
      ctx.save(); ctx.translate(x, y); ctx.scale(pos.p, pos.p);
      if (obj.kind === 'coin') drawCoin(); else drawObstacle(obj.type);
      ctx.restore();
    }
  }
  function drawCoin() {
    ctx.fillStyle = '#ffd445'; ctx.strokeStyle = '#a56d00'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4a8'; ctx.font = 'bold 34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🦴', 0, 2);
  }
  function drawObstacle(type) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = type === 'bird' ? '88px Arial' : '82px Arial';
    ctx.fillText(type === 'crab' ? '🦀' : type === 'buoy' ? '🛟' : '🪿', 0, 0);
  }

  function drawPlayer() {
    const x = W / 2 + game.x, y = game.y;
    ctx.save(); ctx.translate(x, y); if (game.invuln > 0 && Math.floor(game.t * 14) % 2 === 0) ctx.globalAlpha = .35;
    // board shadow
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, 145, 165, 36, 0, 0, Math.PI * 2); ctx.fill();
    // surf board
    const grad = ctx.createLinearGradient(-150, 80, 150, 155); grad.addColorStop(0, '#50e4df'); grad.addColorStop(.45, '#ffb23d'); grad.addColorStop(1, '#ff557d');
    ctx.fillStyle = grad; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(0, 120, 168, 38, -.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // body
    const squish = game.sliding ? .72 : 1;
    ctx.save(); ctx.translate(0, game.sliding ? 45 : 0); ctx.scale(1, squish);
    ctx.fillStyle = '#fff2dc'; ctx.strokeStyle = '#f3d2a6'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, 36, 78, 92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-47, -25, 32, 58, -.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(47, -25, 32, 58, .38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9da1'; ctx.beginPath(); ctx.ellipse(-48, -24, 15, 37, -.38, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(48, -24, 15, 37, .38, 0, Math.PI * 2); ctx.fill();
    // paws
    ctx.fillStyle = '#fff2dc'; ['-80','80'].forEach((sx, i) => { ctx.beginPath(); ctx.ellipse(Number(sx), 38, 36, 17, i ? .2 : -.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.beginPath(); ctx.ellipse(-42, 113, 29, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(42, 113, 29, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // face
    ctx.fillStyle = '#161820'; ctx.beginPath(); ctx.arc(-30, 3, 13, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(30, 3, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-25, -2, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(35, -2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1b1d'; ctx.beginPath(); ctx.ellipse(0, 24, 17, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2529'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 33, 31, .15, Math.PI - .15); ctx.stroke();
    ctx.fillStyle = '#ff5c7f'; ctx.beginPath(); ctx.ellipse(18, 52, 13, 18, -.25, 0, Math.PI * 2); ctx.fill();
    // selected skin icon
    const skin = skins.find(s => s.id === save.skin) || skins[0];
    if (skin.id !== 'classic') { ctx.font = '44px Arial'; ctx.textAlign = 'center'; ctx.fillText(skin.emoji, 0, -82); }
    ctx.restore();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of game.particles) { ctx.globalAlpha = Math.max(0, p.life); ctx.font = '26px Arial'; ctx.fillText('✨', W / 2 + p.x, p.y); }
    ctx.restore();
  }

  function loop(ts) {
    const dt = Math.min(.033, (ts - lastTime) / 1000 || 0); lastTime = ts;
    update(dt); draw(); requestAnimationFrame(loop);
  }

  function renderShop() {
    ui.bankCoins.textContent = save.coins;
    ui.skins.innerHTML = '';
    for (const s of skins) {
      const owned = save.owned.includes(s.id);
      const row = document.createElement('div'); row.className = 'skin';
      row.innerHTML = `<span><b>${s.emoji} ${s.name}</b><br><small>${owned ? 'Куплено' : s.price + ' монет'}</small></span>`;
      const btn = document.createElement('button');
      btn.textContent = save.skin === s.id ? 'Выбран' : owned ? 'Выбрать' : 'Купить';
      btn.onclick = () => {
        if (!owned) {
          if (save.coins < s.price) return showToast('Не хватает монет');
          save.coins -= s.price; save.owned.push(s.id);
        }
        save.skin = s.id; saveGame(); renderShop(); updateHud(); showToast('Скин выбран');
      };
      row.appendChild(btn); ui.skins.appendChild(row);
    }
  }

  function showInterstitial() {
    if (!ysdk?.adv) return;
    ysdk.adv.showFullscreenAdv({ callbacks: { onClose: () => {} } });
  }
  function showRewarded(onReward) {
    if (!ysdk?.adv) { showToast('SDK не найден: награда выдана в dev-режиме'); onReward(); return; }
    ysdk.adv.showRewardedVideo({ callbacks: { onRewarded: onReward, onError: () => showToast('Реклама недоступна') } });
  }
  function submitLeaderboard() {
    try { ysdk?.leaderboards?.setLeaderboardScore('surfDogRushScore', Math.floor(game.score)); } catch (_) {}
  }

  $('playBtn').onclick = startGame;
  $('restartBtn').onclick = startGame;
  $('homeBtn').onclick = () => { state = 'menu'; setOverlay('menu'); };
  $('shopBtn').onclick = () => { renderShop(); setOverlay('shop'); };
  $('backFromShop').onclick = () => setOverlay('menu');
  $('leaderBtn').onclick = () => showToast('Лидерборд подключается в консоли Yandex Games: surfDogRushScore');
  $('reviveBtn').onclick = () => {
    if (game.revived) return showToast('Продолжить можно один раз за забег');
    showRewarded(() => { game.revived = true; game.invuln = 2.5; game.obstacles = []; state = 'play'; setOverlay('none'); });
  };
  $('doubleBtn').onclick = () => {
    if (game.doubleUsed) return showToast('Удвоение уже использовано');
    showRewarded(() => { game.doubleUsed = true; save.coins += game.runCoins; saveGame(); updateHud(); ui.finalCoins.textContent = game.runCoins * 2; showToast('Монеты удвоены'); });
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') laneLeft();
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') laneRight();
    if (e.key === 'ArrowUp' || e.key === ' ') jump();
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') slide();
  });
  let sx = 0, sy = 0;
  canvas.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointerup', e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return jump();
    if (Math.abs(dx) > Math.abs(dy)) dx < 0 ? laneLeft() : laneRight(); else dy < 0 ? jump() : slide();
  });

  initYandex();
  updateHud();
  requestAnimationFrame(loop);
})();
