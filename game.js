/* ============================================================================
   MOTOR GRÁFICO 2.5D A 60 FPS: STEVE ARTICULADO, ANIMACIÓN DE BANDERA Y 7 BIOMAS
   ============================================================================ */

const state = {
  levelIdx: 0,
  step: 1,
  playerX: 0,
  targetX: 0,
  jumpY: 0,
  jumpVel: 0,
  walkCycle: 0,
  facing: 1,
  // Animación de plantar bandera (0 = inactivo, 45 -> 0 frames)
  plantAnim: 0,
  screenShake: 0,
  emeralds: 150,
  xp: 0,
  streak: 0,
  completedLevels: new Set(),
  flags: [], // { x, isCritical, anim }
  discoveredCrits: new Set(),
  biomeIdx: 0,
  biomeSecondsLeft: 300,
  soundOn: true,
  audioCtx: null,
  particles: [],
  shockwaves: [],
  floatingTexts: [],
  weather: [],
  clouds: [],
  stars: [],
  time: 0,
  keys: { left: false, right: false }
};

const blockTextures = {};

/* --- 1. TEXTURAS PIXEL-ART 16x16 POR BIOMA --- */
function buildBiomeTextures() {
  BIOMES.forEach((b) => {
    // Bloque superficial
    const topC = document.createElement("canvas");
    topC.width = 16;
    topC.height = 16;
    const tCtx = topC.getContext("2d");

    tCtx.fillStyle = b.midBlock;
    tCtx.fillRect(0, 0, 16, 16);
    for (let y = 4; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        if ((x * 7 + y * 13) % 5 === 0) {
          tCtx.fillStyle = "rgba(0,0,0,0.22)";
          tCtx.fillRect(x, y, 2, 2);
        } else if ((x * 3 + y * 11) % 7 === 0) {
          tCtx.fillStyle = "rgba(255,255,255,0.09)";
          tCtx.fillRect(x, y, 2, 2);
        }
      }
    }
    // Borde de pasto / micelio / sculk
    tCtx.fillStyle = b.topBlock;
    tCtx.fillRect(0, 0, 16, 5);
    tCtx.fillStyle = b.topLip;
    for (let x = 0; x < 16; x += 2) {
      const drop = 2 + ((x * 5) % 4);
      tCtx.fillRect(x, 4, 2, drop);
    }

    // Bloque de roca intermedia
    const deepC = document.createElement("canvas");
    deepC.width = 16;
    deepC.height = 16;
    const dCtx = deepC.getContext("2d");
    dCtx.fillStyle = b.deepBlock;
    dCtx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        if ((x * 11 + y * 5) % 4 === 0) {
          dCtx.fillStyle = "rgba(0,0,0,0.25)";
          dCtx.fillRect(x, y, 2, 2);
        } else if ((x + y) % 6 === 0) {
          dCtx.fillStyle = "rgba(255,255,255,0.07)";
          dCtx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Bloque de mineral brillante
    const oreC = document.createElement("canvas");
    oreC.width = 16;
    oreC.height = 16;
    const oCtx = oreC.getContext("2d");
    oCtx.drawImage(deepC, 0, 0);
    const spots = [[3, 3], [10, 4], [6, 8], [11, 11], [4, 12]];
    spots.forEach(([sx, sy]) => {
      oCtx.fillStyle = b.oreColor;
      oCtx.fillRect(sx, sy, 3, 3);
      oCtx.fillStyle = "#ffffff";
      oCtx.fillRect(sx, sy, 1, 1);
    });

    blockTextures[b.id] = { top: topC, deep: deepC, ore: oreC };
  });
}

/* --- 2. ATMÓSFERA Y PARTÍCULAS DE CLIMA --- */
function initAtmosphere() {
  state.clouds = Array.from({ length: 8 }, (_, i) => ({
    x: i * 125,
    y: 22 + (i % 3) * 24,
    w: 76 + (i % 2) * 38,
    h: 18,
    speed: 0.16 + (i % 3) * 0.07
  }));

  state.stars = Array.from({ length: 55 }, () => ({
    x: Math.random() * 860,
    y: Math.random() * 250,
    size: Math.random() > 0.6 ? 3 : 2,
    phase: Math.random() * Math.PI * 2
  }));

  state.weather = Array.from({ length: 44 }, () => ({
    x: Math.random() * 860,
    y: Math.random() * 450,
    vx: (Math.random() - 0.5) * 0.8,
    vy: 0.6 + Math.random() * 1.2,
    size: 3 + Math.floor(Math.random() * 3),
    phase: Math.random() * Math.PI * 2
  }));
}

/* --- 3. AUDIO SINTETIZADO --- */
function playSound(freq, type = "square", duration = 0.12) {
  if (!state.soundOn) return;
  try {
    if (!state.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) state.audioCtx = new AC();
    }
    if (!state.audioCtx) return;
    if (state.audioCtx.state === "suspended") state.audioCtx.resume();

    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + duration);
  } catch (e) {}
}

function spawnBurst(screenX, screenY, color = "#34d399", count = 26) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.6 + Math.random() * 4.8;
    state.particles.push({
      x: screenX,
      y: screenY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      color,
      size: 4 + Math.floor(Math.random() * 4),
      life: 1.0
    });
  }
}

function spawnShockwave(screenX, screenY, color = "#fde047") {
  state.shockwaves.push({
    x: screenX,
    y: screenY,
    radius: 6,
    maxRadius: 95,
    color,
    life: 1.0
  });
}

function addFloatingText(screenX, screenY, text, color = "#fde047") {
  state.floatingTexts.push({ x: screenX, y: screenY, text, color, life: 1.0 });
}

/* --- 4. BARAJADO ALEATORIO DE INCISOS --- */
function shuffleOptions(correctText, wrongArray) {
  const pool = [
    { text: correctText, isCorrect: true },
    ...wrongArray.map((w) => ({ text: w, isCorrect: false }))
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool;
}

/* --- 5. GESTIÓN DE LOS 7 BIOMAS --- */
function applyBiome(index) {
  state.biomeIdx = index % BIOMES.length;
  const biome = BIOMES[state.biomeIdx];
  const nameEl = document.getElementById("ui-biome-name");
  if (nameEl) nameEl.textContent = biome.name;
  document.body.setAttribute("data-biome", biome.id);
}

function nextBiome() {
  state.biomeSecondsLeft = 300;
  applyBiome(state.biomeIdx + 1);
  playSound(520, "triangle", 0.16);
  addFloatingText(430, 85, `🌍 Bioma: ${BIOMES[state.biomeIdx].name}`, "#38bdf8");
}

function startBiomeTimer() {
  setInterval(() => {
    state.biomeSecondsLeft--;
    if (state.biomeSecondsLeft <= 0) nextBiome();
    const mins = String(Math.floor(state.biomeSecondsLeft / 60)).padStart(2, "0");
    const secs = String(state.biomeSecondsLeft % 60).padStart(2, "0");
    const timerEl = document.getElementById("ui-biome-timer");
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

/* --- 6. NIVELES Y MISIONES --- */
function populateLevelSelect() {
  const select = document.getElementById("level-select");
  if (!select) return;
  select.innerHTML = "";
  LEVELS.forEach((lvl, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `Nivel ${lvl.num}: ${lvl.name}`;
    select.appendChild(opt);
  });
}

function loadLevel(idx) {
  state.levelIdx = idx;
  state.step = 1;
  state.flags = [];
  state.discoveredCrits = new Set();
  state.playerX = 0;
  state.targetX = 0;

  const lvl = LEVELS[idx];
  const select = document.getElementById("level-select");
  if (select) select.value = idx;
  const eqEl = document.getElementById("ui-equation");
  if (eqEl) eqEl.textContent = lvl.eqText;
  const slider = document.getElementById("x-slider");
  if (slider) slider.value = 0;

  const bossBadge = document.getElementById("boss-badge");
  if (bossBadge) {
    if (lvl.isBoss) bossBadge.classList.remove("hidden");
    else bossBadge.classList.add("hidden");
  }

  updateProfessorBoard();
  renderCurrentQuestion();
  updateTelemetry();
}

function updateProfessorBoard() {
  const lvl = LEVELS[state.levelIdx];
  const board = document.getElementById("professor-text");
  if (board) {
    const critsFound = state.discoveredCrits.size;
    const totalCrits = lvl.critX.length;
    board.innerHTML = `
      <p><strong>Montaña Nivel ${lvl.num}:</strong> <code>${lvl.eqText}</code> | 🚩 <strong>Cimas/Valles Escaneados con Steve:</strong> <code>${critsFound} / ${totalCrits}</code> (+50 💎 por cada bandera exacta)</p>
      <p>• <strong>Rol de Steve:</strong> Camina por la montaña hasta que el rayo láser se ponga <strong>dorado horizontal (f'(x) = 0)</strong> y presiona <strong>🚩 Plantar Bandera (o tecla F)</strong> para clavar tu estandarte y descubrir la coordenada crítica.</p>
      <p>• <strong>Criterio Matemático:</strong> Si <code>f''(x) &lt; 0</code> estás en una <strong>Cima (Máximo)</strong>; si <code>f''(x) &gt; 0</code> estás en un <strong>Valle (Mínimo)</strong>.</p>
    `;
  }
  const progEl = document.getElementById("ui-progress-count");
  if (progEl) {
    progEl.textContent = `Niveles: ${state.completedLevels.size} / ${LEVELS.length}`;
  }
}

function renderCurrentQuestion() {
  const lvl = LEVELS[state.levelIdx];
  const stepBadge = document.getElementById("mission-step-badge");
  const titleEl = document.getElementById("mission-title");
  const descEl = document.getElementById("mission-desc");
  const promptEl = document.getElementById("question-prompt");
  const optionsContainer = document.getElementById("options-container");
  const feedbackBox = document.getElementById("feedback-box");
  const nextBtn = document.getElementById("btn-next-level");

  if (feedbackBox) feedbackBox.classList.add("hidden");
  if (nextBtn) nextBtn.classList.add("hidden");
  if (!optionsContainer) return;
  optionsContainer.innerHTML = "";

  ["dot-1", "dot-2", "dot-3"].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", idx + 1 === state.step);
  });

  let qData = lvl.q1;
  if (state.step === 1) {
    if (stepBadge) stepBadge.textContent = "FASE 1 DE 3";
    if (titleEl) titleEl.textContent = "1. Primera Derivada f'(x)";
    if (descEl) descEl.textContent = "Obtén la función de la pendiente f'(x) aplicando la regla de la potencia.";
    qData = lvl.q1;
  } else if (state.step === 2) {
    if (stepBadge) stepBadge.textContent = "FASE 2 DE 3";
    if (titleEl) titleEl.textContent = "2. Puntos Críticos: f'(x) = 0";
    if (descEl) descEl.textContent = "¡Tip! Mueve a Steve hasta que su láser sea horizontal (f'(x)=0) y planta bandera para verificar tu álgebra.";
    qData = lvl.q2;
  } else {
    if (stepBadge) stepBadge.textContent = "FASE 3 DE 3";
    if (titleEl) titleEl.textContent = "3. Criterio de la Segunda Derivada f''(x)";
    if (descEl) descEl.textContent = "Evalúa el signo de f''(x) para demostrar si el punto crítico es Cima o Valle.";
    qData = lvl.q3;
  }

  if (promptEl) promptEl.textContent = qData.prompt;

  const letters = ["A", "B", "C", "D"];
  const shuffled = shuffleOptions(qData.correct, qData.wrong);

  shuffled.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span>${letters[index]}) ${item.text}</span> <small style="opacity:0.55">[${index + 1}]</small>`;
    btn.addEventListener("click", () => handleAnswer(btn, item.isCorrect, qData.explain));
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(clickedBtn, isCorrect, explanation) {
  const feedbackBox = document.getElementById("feedback-box");
  const allBtns = document.querySelectorAll(".option-btn");

  if (isCorrect) {
    allBtns.forEach((b) => (b.disabled = true));
    clickedBtn.classList.add("correct");
    playSound(680, "square", 0.14);
    setTimeout(() => playSound(920, "square", 0.18), 100);

    const bonus = SHOP_ITEMS[2].owned ? 36 : 30;
    state.emeralds += bonus;
    state.xp += 50;
    state.streak += 1;
    updateHUD();

    const sx = ((state.playerX + 6) / 12) * 860;
    const sy = 450 * 0.64 - LEVELS[state.levelIdx].fn(state.playerX) * 22;
    spawnBurst(sx, sy - 30, "#34d399", 28);
    addFloatingText(sx, sy - 60, `+${bonus} 💎 ¡CORRECTO!`, "#4ade80");

    if (feedbackBox) {
      feedbackBox.classList.remove("hidden");
      feedbackBox.innerHTML = `✅ <strong>¡Respuesta Correcta! (+${bonus} 💎)</strong><br>${explanation}`;
    }

    if (state.step < 3) {
      setTimeout(() => {
        state.step += 1;
        renderCurrentQuestion();
      }, 1500);
    } else {
      state.completedLevels.add(state.levelIdx);
      updateProfessorBoard();
      spawnBurst(430, 150, "#fde047", 50);
      addFloatingText(430, 120, `🏆 ¡NIVEL ${LEVELS[state.levelIdx].num} COMPLETADO!`, "#fde047");
      const nextBtn = document.getElementById("btn-next-level");
      if (nextBtn) nextBtn.classList.remove("hidden");
      if (feedbackBox) {
        feedbackBox.innerHTML += `<br><br>🎉 <strong>¡Cumbre dominada!</strong> Avanza al siguiente nivel.`;
      }
    }
  } else {
    clickedBtn.classList.add("wrong");
    clickedBtn.disabled = true;
    state.streak = 0;
    state.screenShake = 8;
    updateHUD();
    playSound(165, "sawtooth", 0.22);

    if (feedbackBox) {
      feedbackBox.classList.remove("hidden");
      feedbackBox.innerHTML = `❌ <strong>Revisa tu cálculo:</strong> ${explanation}`;
    }
  }
}

function updateHUD() {
  const emEl = document.getElementById("ui-emeralds");
  const xpEl = document.getElementById("ui-xp");
  const stEl = document.getElementById("ui-streak");
  if (emEl) emEl.textContent = state.emeralds;
  if (xpEl) xpEl.textContent = state.xp;
  if (stEl) stEl.textContent = state.streak;
}

/* --- 7. FÍSICAS DE STEVE Y ANIMACIÓN DE PLANTAR BANDERA --- */
function setTargetX(newX) {
  const clamped = Math.max(-6, Math.min(6, newX));
  if (clamped > state.targetX + 0.01) state.facing = 1;
  if (clamped < state.targetX - 0.01) state.facing = -1;
  state.targetX = clamped;
  const slider = document.getElementById("x-slider");
  if (slider) slider.value = clamped.toFixed(2);
}

function triggerJump() {
  if (state.jumpY === 0) {
    state.jumpVel = 6.5;
    playSound(390, "sine", 0.09);
  }
}

function triggerPlantFlag() {
  if (state.plantAnim > 0) return; // Ya está animando
  state.plantAnim = 46; // 46 frames de animación (~0.75 seg)
  state.jumpVel = 4.2; // Pequeño salto antes de clavar el estandarte

  const lvl = LEVELS[state.levelIdx];
  const px = state.playerX;

  // Verificar si está cerca de un punto crítico real del nivel
  let matchedCrit = null;
  lvl.critX.forEach((cx) => {
    if (Math.abs(px - cx) <= 0.26) matchedCrit = cx;
  });

  const flagX = matchedCrit !== null ? matchedCrit : px;
  const isCritical = matchedCrit !== null;

  // Al llegar al frame del golpe contra el suelo (en ~220ms) ejecutamos el impacto
  setTimeout(() => {
    state.flags.push({ x: flagX, isCritical, bannerWave: 0 });
    state.screenShake = isCritical ? 14 : 6;

    const canvas = document.getElementById("game-canvas");
    const W = canvas ? canvas.width : 860;
    const H = canvas ? canvas.height : 450;
    const sx = ((flagX + 6) / 12) * W;
    const sy = H * 0.64 - lvl.fn(flagX) * 22;

    if (isCritical && !state.discoveredCrits.has(matchedCrit)) {
      state.discoveredCrits.add(matchedCrit);
      state.emeralds += 50;
      state.xp += 100;
      updateHUD();
      updateProfessorBoard();
      spawnBurst(sx, sy - 15, "#fde047", 42);
      spawnShockwave(sx, sy, "#fde047");
      const kind = lvl.d2f(matchedCrit) < 0 ? "CIMA (MÁXIMO)" : lvl.d2f(matchedCrit) > 0 ? "VALLE (MÍNIMO)" : "INFLEXIÓN";
      addFloatingText(sx, sy - 65, `🚩 ¡${kind} EN x=${matchedCrit}! +50 💎`, "#fde047");
      playSound(587, "triangle", 0.12);
      setTimeout(() => playSound(880, "triangle", 0.25), 110);
    } else if (isCritical) {
      spawnShockwave(sx, sy, "#38bdf8");
      addFloatingText(sx, sy - 50, `🚩 Punto crítico x=${matchedCrit} ya registrado`, "#38bdf8");
      playSound(520, "triangle", 0.14);
    } else {
      spawnBurst(sx, sy - 10, "#94a3b8", 14);
      spawnShockwave(sx, sy, "#94a3b8");
      addFloatingText(
        sx,
        sy - 50,
        `🚩 Pendiente f'(${px.toFixed(1)}) = ${lvl.df(px).toFixed(2)} ≠ 0 (Sigue buscando)`,
        "#cbd5e1"
      );
      playSound(300, "sawtooth", 0.12);
    }
  }, 220);
}

function updateTelemetry() {
  const lvl = LEVELS[state.levelIdx];
  const x = state.playerX;
  const y = lvl.fn(x);
  const dy = lvl.df(x);
  const d2y = lvl.d2f(x);

  const tx = document.getElementById("tel-x");
  const ty = document.getElementById("tel-y");
  const tdy = document.getElementById("tel-dy");
  const td2y = document.getElementById("tel-d2y");
  if (tx) tx.textContent = x.toFixed(2);
  if (ty) ty.textContent = y.toFixed(2);
  if (tdy) tdy.textContent = dy.toFixed(2);
  if (td2y) td2y.textContent = d2y.toFixed(2);

  const stateTag = document.getElementById("tel-state");
  if (!stateTag) return;
  if (Math.abs(dy) < 0.09) {
    stateTag.textContent = "⭐ ¡PUNTO CRÍTICO! PLANTA BANDERA [F]";
    stateTag.style.background = "#eab308";
    stateTag.style.color = "#090d16";
  } else if (dy > 0) {
    stateTag.textContent = "Subiendo ↗ (f'(x) > 0)";
    stateTag.style.background = "#16a34a";
    stateTag.style.color = "#ffffff";
  } else {
    stateTag.textContent = "Bajando ↘ (f'(x) < 0)";
    stateTag.style.background = "#dc2626";
    stateTag.style.color = "#ffffff";
  }
}

/* --- 8. BUCLE PRINCIPAL DE ANIMACIÓN (60 FPS) --- */
function gameLoop() {
  state.time += 0.035;

  if (state.keys.left) setTargetX(state.targetX - 0.065);
  if (state.keys.right) setTargetX(state.targetX + 0.065);

  const diff = state.targetX - state.playerX;
  if (Math.abs(diff) > 0.002) {
    state.playerX += diff * 0.24;
    state.walkCycle += Math.abs(diff) * 3.8;
    updateTelemetry();
  } else {
    state.playerX = state.targetX;
  }

  if (state.jumpY > 0 || state.jumpVel > 0) {
    state.jumpY += state.jumpVel;
    state.jumpVel -= 0.48;
    if (state.jumpY <= 0) {
      state.jumpY = 0;
      state.jumpVel = 0;
    }
  }

  if (state.plantAnim > 0) state.plantAnim--;
  if (state.screenShake > 0) state.screenShake *= 0.82;
  if (state.screenShake < 0.3) state.screenShake = 0;

  drawWorld();
  requestAnimationFrame(gameLoop);
}

/* --- 9. RENDERIZADO MULTICAPA 2.5D --- */
function drawWorld() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width;
  const H = canvas.height;

  const biome = BIOMES[state.biomeIdx];
  const lvl = LEVELS[state.levelIdx];
  const textures = blockTextures[biome.id] || blockTextures.overworld;

  ctx.save();
  if (state.screenShake > 0) {
    const dx = (Math.random() - 0.5) * state.screenShake;
    const dy = (Math.random() - 0.5) * state.screenShake;
    ctx.translate(dx, dy);
  }

  // CAPA 1: CIELO MULTIPASO
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, biome.skyTop);
  skyGrad.addColorStop(0.55, biome.skyMid);
  skyGrad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // CAPA 2: ELEMENTOS CELESTES, GOD RAYS Y AMBIENTE ESPECÍFICO DE CADA BIOMA
  drawBiomeSkyProps(ctx, W, H, biome);

  // CAPA 3: CORDILLERAS PARALLAX LEJANAS Y MEDIAS CON NIEBLA ATMOSFÉRICA
  const pOffset = state.playerX * 14;
  ctx.fillStyle = biome.farMtn;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 24) {
    const mh = 155 + Math.sin((x + pOffset * 0.35) * 0.011) * 58 + Math.cos(x * 0.025) * 28;
    ctx.lineTo(x, H - mh);
  }
  ctx.lineTo(W, H);
  ctx.fill();

  // Niebla intermedia para dar profundidad real
  ctx.fillStyle = biome.fogColor;
  ctx.fillRect(0, H - 220, W, 110);

  // Colinas medias + estructuras de bioma
  ctx.fillStyle = biome.midMtn;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 18) {
    const mh2 = 95 + Math.cos((x + pOffset * 0.75) * 0.018) * 38 + Math.sin(x * 0.04) * 16;
    ctx.lineTo(x, H - mh2);
  }
  ctx.lineTo(W, H);
  ctx.fill();

  // Estructuras icónicas en el horizonte según el bioma
  drawBiomeHorizonStructures(ctx, W, H, biome, pOffset);

  // Conversiones cartesianas
  const toScreenX = (x) => ((x + 6) / 12) * W;
  const toScreenY = (y) => H * 0.64 - y * 22;

  // CAPA 4: CUADRÍCULA MATEMÁTICA SUTIL
  ctx.strokeStyle = biome.isLight ? "rgba(15,23,42,0.09)" : "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillStyle = biome.isLight ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";

  for (let gx = -6; gx <= 6; gx++) {
    const sx = toScreenX(gx);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H);
    ctx.stroke();
    if (gx !== 0) ctx.fillText(gx, sx, toScreenY(0) + 14);
  }
  for (let gy = -8; gy <= 10; gy += 2) {
    const sy = toScreenY(gy);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(W, sy);
    ctx.stroke();
  }

  // Ejes X=0, Y=0
  ctx.strokeStyle = biome.isLight ? "rgba(15,23,42,0.32)" : "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toScreenX(0), 0);
  ctx.lineTo(toScreenX(0), H);
  ctx.moveTo(0, toScreenY(0));
  ctx.lineTo(W, toScreenY(0));
  ctx.stroke();

  // CAPA 5: TERRENO DE BLOQUES 2.5D CON CARA SUPERIOR EXTRUIDA Y VEGETACIÓN
  const blockSize = 16;
  const depthY = 6; // Grosor 3D de la cara superior del bloque

  for (let px = 0; px < W; px += blockSize) {
    const mathX = (px / W) * 12 - 6;
    const mathY = lvl.fn(mathX);
    const topY = Math.floor(toScreenY(mathY) / 4) * 4; // Escalones más suaves (4px)

    // Árboles y decoración superficial por bioma
    if (px % 112 === 32 && topY > 85 && topY < H - 45) {
      drawSurfaceProp(ctx, px, topY, biome);
    }

    // Cara superior 3D del bloque (perspectiva 2.5D)
    ctx.fillStyle = biome.topBlock;
    ctx.fillRect(px, topY - depthY, blockSize, depthY);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(px, topY - depthY, blockSize, 2);

    // Bloque superficial texturizado
    ctx.drawImage(textures.top, px, topY);

    // Sombra bajo el labio de pasto
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(px, topY + 6, blockSize, 2);

    // Bloques subterráneos con oscurecimiento por profundidad
    for (let by = topY + blockSize; by < H; by += blockSize) {
      const isOre = ((px * 19 + by * 13) % 39) === 0;
      ctx.drawImage(isOre ? textures.ore : textures.deep, px, by);

      const depthDarkness = Math.min(0.78, (by - topY) / 260);
      ctx.fillStyle = `rgba(2, 6, 23, ${depthDarkness})`;
      ctx.fillRect(px, by, blockSize, blockSize);
    }
  }

  // Lava ardiente en el fondo si estamos en el Nether
  if (biome.id === "nether") {
    const lavaGrad = ctx.createLinearGradient(0, H - 28, 0, H);
    lavaGrad.addColorStop(0, "rgba(251, 146, 60, 0.85)");
    lavaGrad.addColorStop(1, "rgba(220, 38, 38, 0.95)");
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, H - 24, W, 24);
  }

  // CAPA 6: FAROS DE LUZ (BEACONS) EN PUNTOS CRÍTICOS DESCUBIERTOS
  state.discoveredCrits.forEach((cx) => {
    const sx = toScreenX(cx);
    const sy = toScreenY(lvl.fn(cx));
    const beamGrad = ctx.createLinearGradient(sx, 0, sx, sy);
    beamGrad.addColorStop(0, "rgba(250, 204, 21, 0)");
    beamGrad.addColorStop(1, "rgba(250, 204, 21, 0.38)");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(sx - 10, 0, 20, sy);
  });

  // Indicadores sutiles en Fase 2 y 3
  if (state.step >= 2) {
    lvl.critX.forEach((cx) => {
      const sx = toScreenX(cx);
      const sy = toScreenY(lvl.fn(cx));
      const pulse = 6 + Math.sin(state.time * 3.5) * 3;
      ctx.strokeStyle = "rgba(250, 204, 21, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // CAPA 7: CURVA CONTINUA f(x) CON SHADER NEÓN
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.shadowColor = biome.oreColor;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let px = 0; px <= W; px += 3) {
    const mathX = (px / W) * 12 - 6;
    const sy = toScreenY(lvl.fn(mathX));
    if (px === 0) ctx.moveTo(px, sy);
    else ctx.lineTo(px, sy);
  }
  ctx.stroke();
  ctx.restore();

  // CAPA 8: BANDERAS ANIMADAS PLANTADAS EN LA MONTAÑA
  state.flags.forEach((flag) => {
    const sx = toScreenX(flag.x);
    const sy = toScreenY(lvl.fn(flag.x));
    flag.bannerWave += 0.12;

    // Base de piedra del estandarte
    ctx.fillStyle = "#475569";
    ctx.fillRect(sx - 6, sy - 6, 12, 6);
    // Mástil dorado
    ctx.fillStyle = "#fde047";
    ctx.fillRect(sx - 2, sy - 42, 4, 40);
    // Tela ondeando por segmentos
    const flagColor = flag.isCritical ? "#10b981" : "#ef4444";
    for (let seg = 0; seg < 4; seg++) {
      const waveY = Math.sin(state.time * 4 + seg * 0.8) * 2.5;
      ctx.fillStyle = flagColor;
      ctx.fillRect(sx + 2 + seg * 6, sy - 40 + waveY, 6, 14);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(sx + 2 + seg * 6, sy - 40 + waveY, 6, 2);
    }
  });

  // CAPA 9: LÁSER TANGENTE f'(x) BAJO LOS PIES DE STEVE
  const px = state.playerX;
  const py = lvl.fn(px);
  const slope = lvl.df(px);
  const span = SHOP_ITEMS[0].owned ? 2.6 : 1.45;

  const laserColor =
    Math.abs(slope) < 0.09 ? "#fde047" : slope > 0 ? "#4ade80" : "#f87171";

  ctx.save();
  ctx.strokeStyle = laserColor;
  ctx.lineWidth = 4;
  ctx.shadowColor = laserColor;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(toScreenX(px - span), toScreenY(py - slope * span));
  ctx.lineTo(toScreenX(px + span), toScreenY(py + slope * span));
  ctx.stroke();
  ctx.restore();

  // CAPA 10: STEVE ARTICULADO CON BRAZOS, PICO Y ANIMACIÓN DE PLANTAR BANDERA
  drawArticulatedSteve(ctx, toScreenX(px), toScreenY(py) - state.jumpY, px, slope, laserColor);

  // CAPA 11: JEFES ANIMADOS (NIVEL 10 WITHER / NIVEL 20 ENDER DRAGON)
  if (lvl.isBoss) {
    drawBoss(ctx, W, lvl.num === 20);
  }

  // CAPA 12: ONDAS EXPANSIVAS, PARTÍCULAS Y CLIMA
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.radius += (sw.maxRadius - sw.radius) * 0.16;
    sw.life -= 0.04;
    if (sw.life <= 0) {
      state.shockwaves.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = sw.life;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawWeatherParticles(ctx, W, H, biome);

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.16;
    p.life -= 0.024;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1.0;
  }

  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.y -= 0.85;
    ft.life -= 0.017;
    if (ft.life <= 0) {
      state.floatingTexts.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = ft.life;
    ctx.font = "bold 14px 'Chakra Petch', sans-serif";
    ctx.fillStyle = ft.color;
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

/* --- ELEMENTOS DEL CIELO Y ESTRUCTURAS POR BIOMA --- */
function drawBiomeSkyProps(ctx, W, H, biome) {
  if (!biome.isLight) {
    state.stars.forEach((st) => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(state.time * 1.5 + st.phase));
      ctx.fillStyle = biome.id === "the_shift" ? `rgba(34,211,238,${alpha})` : `rgba(255,255,255,${alpha})`;
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });
  } else {
    // Rayos de sol diagonales (God Rays)
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      const rx = W - 180 - r * 140;
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 65, 0);
      ctx.lineTo(rx - 120, H);
      ctx.lineTo(rx - 195, H);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sol / Luna / Portal The Shift
  const sunX = W - 115;
  const sunY = 34 + Math.sin(state.time * 0.6) * 4;
  if (biome.id === "the_shift") {
    // Portal dimensional corrupto
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 4;
    ctx.strokeRect(sunX - 8, sunY - 8, 64, 64);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(sunX + 4, sunY + 4, 40, 40);
  } else {
    ctx.fillStyle = biome.sunColor;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(sunX - 12, sunY - 12, 72, 72);
    ctx.globalAlpha = 1.0;
    ctx.fillRect(sunX, sunY, 48, 48);
  }

  // Lianas colgantes del techo en la Jungla o Estalactitas en el Nether
  if (biome.id === "jungla") {
    ctx.fillStyle = "#065f46";
    for (let vx = 40; vx < W; vx += 95) {
      const vLen = 55 + ((vx * 7) % 65);
      const sway = Math.sin(state.time * 2 + vx) * 4;
      ctx.fillRect(vx + sway, 0, 6, vLen);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(vx + sway - 2, vLen - 12, 10, 8);
      ctx.fillStyle = "#065f46";
    }
  } else if (biome.id === "nether") {
    // Estalactitas de Netherrack y columnas de lava lejanas
    for (let nx = 70; nx < W; nx += 160) {
      ctx.fillStyle = "rgba(249, 115, 22, 0.28)";
      ctx.fillRect(nx, 0, 14, H);
    }
    ctx.fillStyle = "#450a0a";
    for (let sx = 0; sx < W; sx += 32) {
      const sh = 18 + ((sx * 13) % 34);
      ctx.fillRect(sx, 0, 28, sh);
    }
  }

  // Nubes para biomas abiertos
  if (biome.id !== "nether" && biome.id !== "end") {
    state.clouds.forEach((cl) => {
      cl.x += cl.speed;
      if (cl.x > W + 40) cl.x = -cl.w - 20;
      ctx.fillStyle = biome.isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.12)";
      ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
      ctx.fillRect(cl.x + 14, cl.y - 10, cl.w * 0.55, 10);
    });
  }
}

function drawBiomeHorizonStructures(ctx, W, H, biome, pOffset) {
  if (biome.id === "end") {
    // Pilares de Obsidiana con Cristales del End
    [160, 390, 660].forEach((baseX, idx) => {
      const px = baseX - pOffset * 0.4;
      const ph = 180 + (idx % 2) * 45;
      ctx.fillStyle = "#090414";
      ctx.fillRect(px, H - ph, 34, ph);
      // Cristal flotando arriba del pilar
      const cy = H - ph - 18 + Math.sin(state.time * 3 + idx) * 5;
      ctx.fillStyle = "#e879f9";
      ctx.fillRect(px + 9, cy, 16, 16);
      ctx.strokeStyle = "#fde047";
      ctx.strokeRect(px + 9, cy, 16, 16);
    });
  } else if (biome.id === "the_shift") {
    // Monolitos flotantes corruptos con pulso cian
    [140, 340, 560, 740].forEach((baseX, idx) => {
      const mx = baseX - pOffset * 0.5;
      const my = 95 + Math.sin(state.time * 2 + idx) * 18;
      ctx.fillStyle = "#090d16";
      ctx.fillRect(mx, my, 26, 68);
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, 26, 68);
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(mx + 8, my + 24, 10, 20);
    });
  }
}

function drawSurfaceProp(ctx, px, topY, biome) {
  if (biome.id === "llanuras") {
    // Girasoles de Minecraft
    ctx.fillStyle = "#15803d";
    ctx.fillRect(px + 6, topY - 22, 4, 22);
    ctx.fillStyle = "#fde047";
    ctx.fillRect(px + 1, topY - 32, 14, 14);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(px + 5, topY - 28, 6, 6);
  } else if (biome.id === "jungla") {
    // Árbol gigante de jungla con lianas
    ctx.fillStyle = "#5c3a21";
    ctx.fillRect(px + 2, topY - 56, 12, 56);
    ctx.fillStyle = "#059669";
    ctx.fillRect(px - 18, topY - 78, 52, 26);
    ctx.fillRect(px - 10, topY - 92, 36, 18);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(px - 14, topY - 52, 4, 26);
    ctx.fillRect(px + 26, topY - 52, 4, 30);
  } else if (biome.id === "the_shift") {
    // Sensores Sculk bioluminiscentes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(px + 2, topY - 14, 12, 14);
    const wave = Math.sin(state.time * 5 + px) * 3;
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(px, topY - 24 + wave, 4, 12);
    ctx.fillRect(px + 12, topY - 24 - wave, 4, 12);
  } else if (biome.id === "overworld" || biome.id === "cerezal") {
    // Roble o Cerezo frondoso
    ctx.fillStyle = "#5c3a21";
    ctx.fillRect(px + 4, topY - 34, 8, 34);
    ctx.fillStyle = biome.topBlock;
    ctx.fillRect(px - 12, topY - 58, 40, 26);
    ctx.fillRect(px - 4, topY - 70, 24, 14);
  }
}

/* --- DIBUJO DE STEVE ARTICULADO CON BRAZOS Y ANIMACIÓN DE PLANTAR BANDERA --- */
function drawArticulatedSteve(ctx, sx, sy, mathX, slope, laserColor) {
  const hasArmor = SHOP_ITEMS[2].owned;
  const swing = Math.sin(state.walkCycle) * 0.55;
  const isPlanting = state.plantAnim > 0;

  // Ángulo del brazo derecho según si camina o si está clavando la bandera
  let frontArmAngle = -swing * 0.9;
  let backArmAngle = swing * 0.9;
  let bodyLean = 0;

  if (isPlanting) {
    if (state.plantAnim > 30) {
      // Fase 1: Levanta ambos brazos con el mástil dorado
      frontArmAngle = -2.5;
      backArmAngle = -2.2;
      bodyLean = -0.12 * state.facing;
    } else if (state.plantAnim > 16) {
      // Fase 2: Clava el estandarte con fuerza contra el suelo
      frontArmAngle = 1.15;
      backArmAngle = 0.8;
      bodyLean = 0.22 * state.facing;
    } else {
      // Fase 3: Puño en alto celebrando
      frontArmAngle = -2.7;
      backArmAngle = 0.3;
    }
  }

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(bodyLean);

  // Sombra elíptica en el suelo
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(-10, -3 + state.jumpY, 20, 4);

  // 1. BRAZO TRASERO (Articulado en el hombro)
  ctx.save();
  ctx.translate(0, -26);
  ctx.rotate(backArmAngle * state.facing);
  ctx.fillStyle = hasArmor ? "#eab308" : "#0891b2";
  ctx.fillRect(-3, 0, 6, 6);
  ctx.fillStyle = "#b45309"; // Piel brazo trasero
  ctx.fillRect(-2, 6, 5, 8);
  ctx.restore();

  // 2. PIERNA TRASERA
  ctx.save();
  ctx.translate(0, -13);
  ctx.rotate(-swing * 0.65);
  ctx.fillStyle = hasArmor ? "#0284c7" : "#1e3a8a";
  ctx.fillRect(-3, 0, 6, 13);
  ctx.restore();

  // 3. CAPA ONDEANDO CON VIENTO
  ctx.save();
  ctx.translate(-state.facing * 6, -27);
  ctx.rotate(state.facing * (0.25 + Math.sin(state.time * 4) * 0.12));
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-2, 0, 4, 18);
  ctx.restore();

  // 4. TORSO
  ctx.fillStyle = hasArmor ? "#facc15" : "#06b6d4";
  ctx.fillRect(-7, -28, 14, 15);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(-7, -16, 14, 3);

  // 5. PIERNA DELANTERA
  ctx.save();
  ctx.translate(0, -13);
  ctx.rotate(swing * 0.65);
  ctx.fillStyle = hasArmor ? "#38bdf8" : "#2563eb";
  ctx.fillRect(-3, 0, 6, 13);
  ctx.restore();

  // 6. CABEZA PIXEL-ART
  ctx.fillStyle = "#d97706";
  ctx.fillRect(-7, -42, 14, 14);
  ctx.fillStyle = "#451a03"; // Cabello
  ctx.fillRect(-7, -42, 14, 4);
  ctx.fillRect(state.facing < 0 ? 3 : -7, -38, 4, 4);
  // Ojos mirando hacia donde camina
  const eyeX = state.facing > 0 ? 1 : -5;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(eyeX, -35, 4, 3);
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(eyeX + (state.facing > 0 ? 2 : 0), -35, 2, 3);

  // 7. BRAZO DELANTERO ARTICULADO + HERRAMIENTA (PICO O BANDERA EN ANIMACIÓN)
  ctx.save();
  ctx.translate(0, -25);
  ctx.scale(state.facing, 1);
  ctx.rotate(frontArmAngle);

  // Hombro
  ctx.fillStyle = hasArmor ? "#fde047" : "#06b6d4";
  ctx.fillRect(-3, -2, 6, 7);
  // Antebrazo y mano
  ctx.fillStyle = "#d97706";
  ctx.fillRect(-2, 5, 5, 9);

  if (isPlanting) {
    // Mástil y bandera en la mano durante la animación de clavado
    ctx.fillStyle = "#fde047";
    ctx.fillRect(1, -18, 3, 36);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(4, -18, 16, 11);
  } else {
    // Pico de Diamante encantado en la mano
    ctx.fillStyle = "#78350f";
    ctx.fillRect(1, 4, 3, 13);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-3, 14, 11, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, 14, 2, 2);
  }
  ctx.restore();

  // 8. ETIQUETA HOLOGRÁFICA SOBRE STEVE
  ctx.fillStyle = "rgba(9, 13, 22, 0.88)";
  ctx.fillRect(-52, -66, 104, 19);
  ctx.strokeStyle = laserColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-52, -66, 104, 19);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`x=${mathX.toFixed(1)} | f'=${slope.toFixed(1)}`, 0, -53);

  ctx.restore();
}

function drawWeatherParticles(ctx, W, H, biome) {
  state.weather.forEach((wp) => {
    if (biome.weatherType === "embers" || biome.weatherType === "ender") {
      wp.y -= wp.vy;
      wp.x += Math.sin(state.time * 2 + wp.phase) * 0.6;
    } else if (biome.weatherType === "petals") {
      wp.y += wp.vy * 0.85;
      wp.x -= 0.9 + Math.sin(state.time + wp.phase) * 0.4;
    } else if (biome.weatherType === "glitch") {
      wp.y += (Math.random() - 0.5) * 3;
      wp.x += (Math.random() - 0.5) * 3;
    } else {
      wp.y += Math.sin(state.time + wp.phase) * 0.4;
      wp.x += wp.vx;
    }

    if (wp.y > H) wp.y = -5;
    if (wp.y < 0) wp.y = H + 5;
    if (wp.x > W) wp.x = 0;
    if (wp.x < 0) wp.x = W;

    ctx.fillStyle = biome.oreColor;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(wp.x, wp.y, wp.size, wp.size);
    ctx.globalAlpha = 1.0;
  });
}

function drawBoss(ctx, W, isDragon) {
  const bx = W * 0.5 + Math.sin(state.time * 1.4) * 105;
  const by = 68 + Math.cos(state.time * 2.2) * 15;
  const hpFraction = Math.max(0.1, (4 - state.step) / 3);

  ctx.fillStyle = "rgba(9, 13, 22, 0.88)";
  ctx.fillRect(W * 0.5 - 150, 12, 300, 22);
  ctx.fillStyle = isDragon ? "#a855f7" : "#ef4444";
  ctx.fillRect(W * 0.5 - 146, 16, 292 * hpFraction, 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(isDragon ? "🐉 ENDER DRAGON" : "💀 EL WITHER", W * 0.5, 27);

  ctx.save();
  ctx.translate(bx, by);
  const wingOffset = Math.sin(state.time * 6) * 11;
  ctx.fillStyle = isDragon ? "#1e1b4b" : "#27272a";
  ctx.fillRect(-30, -8 + wingOffset, 22, 9);
  ctx.fillRect(8, -8 + wingOffset, 22, 9);
  ctx.fillRect(-13, -13, 26, 26);
  ctx.fillStyle = isDragon ? "#e879f9" : "#fde047";
  ctx.fillRect(-8, -5, 5, 4);
  ctx.fillRect(3, -5, 5, 4);
  ctx.restore();
}

/* --- 10. TIENDA Y EVENTOS --- */
function renderShop() {
  const container = document.getElementById("shop-items-container");
  if (!container) return;
  container.innerHTML = "";
  SHOP_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "shop-item";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <p style="font-size:0.84rem; color:#94a3b8;">${item.desc}</p>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "mc-btn mc-btn-gold";
    btn.textContent = item.owned ? "Equipado ✅" : `Forjar (${item.cost} 💎)`;
    btn.disabled = item.owned;
    btn.addEventListener("click", () => {
      if (state.emeralds >= item.cost && !item.owned) {
        state.emeralds -= item.cost;
        item.owned = true;
        if (item.id === "concavity") {
          const concEl = document.getElementById("tel-concavity");
          if (concEl) concEl.classList.remove("hidden");
        }
        updateHUD();
        renderShop();
        playSound(760, "square", 0.16);
      } else {
        alert("No tienes suficientes esmeraldas 💎.");
      }
    });
    row.appendChild(btn);
    container.appendChild(row);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  buildBiomeTextures();
  initAtmosphere();
  populateLevelSelect();
  applyBiome(0);
  loadLevel(0);
  startBiomeTimer();
  requestAnimationFrame(gameLoop);

  document.getElementById("level-select")?.addEventListener("change", (e) => {
    loadLevel(parseInt(e.target.value, 10));
  });

  document.getElementById("btn-boss-10")?.addEventListener("click", () => loadLevel(9));
  document.getElementById("btn-boss-20")?.addEventListener("click", () => loadLevel(19));
  document.getElementById("btn-change-biome")?.addEventListener("click", nextBiome);

  document.getElementById("btn-sound")?.addEventListener("click", (e) => {
    state.soundOn = !state.soundOn;
    e.target.textContent = state.soundOn ? "🔊" : "🔇";
  });

  document.getElementById("x-slider")?.addEventListener("input", (e) => {
    setTargetX(parseFloat(e.target.value));
  });
  document.getElementById("btn-step-left")?.addEventListener("click", () => {
    setTargetX(Math.round((state.targetX - 0.5) * 2) / 2);
  });
  document.getElementById("btn-step-right")?.addEventListener("click", () => {
    setTargetX(Math.round((state.targetX + 0.5) * 2) / 2);
  });

  const canvas = document.getElementById("game-canvas");
  canvas?.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const mathX = Math.round((relX * 12 - 6) * 10) / 10;
    setTargetX(mathX);
    triggerJump();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = true;
    if (e.key === "f" || e.key === "F") triggerPlantFlag();
    if (e.key === " " || e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      if (document.activeElement?.tagName !== "BUTTON") e.preventDefault();
      triggerJump();
    }
    if (["1", "2", "3", "4"].includes(e.key)) {
      const btns = document.querySelectorAll(".option-btn");
      const idx = parseInt(e.key, 10) - 1;
      if (btns[idx] && !btns[idx].disabled) btns[idx].click();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = false;
  });

  document.getElementById("btn-plant-flag")?.addEventListener("click", triggerPlantFlag);

  document.getElementById("btn-use-hint")?.addEventListener("click", () => {
    if (state.emeralds < 25) {
      alert("Necesitas 25 esmeraldas 💎 para pedir una pista.");
      return;
    }
    state.emeralds -= 25;
    updateHUD();
    const lvl = LEVELS[state.levelIdx];
    const explain =
      state.step === 1 ? lvl.q1.explain : state.step === 2 ? lvl.q2.explain : lvl.q3.explain;
    const feedbackBox = document.getElementById("feedback-box");
    if (feedbackBox) {
      feedbackBox.classList.remove("hidden");
      feedbackBox.innerHTML = `💡 <strong>Pista del Profesor:</strong> ${explain}`;
    }
  });

  document.getElementById("btn-next-level")?.addEventListener("click", () => {
    loadLevel((state.levelIdx + 1) % LEVELS.length);
  });

  document.getElementById("btn-open-theory")?.addEventListener("click", () => {
    document.getElementById("modal-theory")?.classList.remove("hidden");
  });
  document.getElementById("btn-close-theory")?.addEventListener("click", () => {
    document.getElementById("modal-theory")?.classList.add("hidden");
  });

  document.getElementById("btn-open-shop")?.addEventListener("click", () => {
    renderShop();
    document.getElementById("modal-shop")?.classList.remove("hidden");
  });
  document.getElementById("btn-close-shop")?.addEventListener("click", () => {
    document.getElementById("modal-shop")?.classList.add("hidden");
  });
});
