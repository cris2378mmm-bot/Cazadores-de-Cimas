/* ============================================================================
   MOTOR GRÁFICO 60 FPS CON SHADERS 2D, TEXTURAS PIXEL-ART Y PARTÍCULAS
   ============================================================================ */

const state = {
  levelIdx: 0,
  step: 1,
  playerX: 0,
  targetX: 0,
  jumpY: 0,
  jumpVel: 0,
  walkFrame: 0,
  facing: 1,
  emeralds: 150,
  xp: 0,
  streak: 0,
  completedLevels: new Set(),
  flags: [],
  biomeIdx: 0,
  biomeSecondsLeft: 300,
  soundOn: true,
  audioCtx: null,
  particles: [],
  floatingTexts: [],
  weather: [],
  clouds: [],
  stars: [],
  time: 0,
  keys: { left: false, right: false }
};

const blockTextures = {};

/* --- 1. GENERADOR PROCEDURAL DE TEXTURAS PIXEL-ART 16x16 --- */
function buildBiomeTextures() {
  BIOMES.forEach((b) => {
    // Textura de Bloque Superficial (Pasto / Nieve / Nylium con borde detallado)
    const topCanvas = document.createElement("canvas");
    topCanvas.width = 16;
    topCanvas.height = 16;
    const tCtx = topCanvas.getContext("2d");

    tCtx.fillStyle = b.midBlock;
    tCtx.fillRect(0, 0, 16, 16);

    // Píxeles de ruido en la tierra
    for (let y = 4; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        if ((x * 7 + y * 13) % 5 === 0) {
          tCtx.fillStyle = "rgba(0,0,0,0.18)";
          tCtx.fillRect(x, y, 2, 2);
        } else if ((x * 3 + y * 11) % 7 === 0) {
          tCtx.fillStyle = "rgba(255,255,255,0.08)";
          tCtx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Franja superior de pasto/nieve con flecos pixelados
    tCtx.fillStyle = b.topBlock;
    tCtx.fillRect(0, 0, 16, 5);
    for (let x = 0; x < 16; x += 2) {
      const drop = (x * 5) % 4;
      tCtx.fillRect(x, 5, 2, drop);
    }
    tCtx.fillStyle = "rgba(255,255,255,0.22)";
    tCtx.fillRect(0, 0, 16, 2);

    // Textura de Piedra Profunda
    const deepCanvas = document.createElement("canvas");
    deepCanvas.width = 16;
    deepCanvas.height = 16;
    const dCtx = deepCanvas.getContext("2d");
    dCtx.fillStyle = b.deepBlock;
    dCtx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        if ((x * 11 + y * 5) % 4 === 0) {
          dCtx.fillStyle = "rgba(0,0,0,0.22)";
          dCtx.fillRect(x, y, 2, 2);
        } else if ((x + y) % 6 === 0) {
          dCtx.fillStyle = "rgba(255,255,255,0.07)";
          dCtx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Textura de Mineral Brillante (Ore)
    const oreCanvas = document.createElement("canvas");
    oreCanvas.width = 16;
    oreCanvas.height = 16;
    const oCtx = oreCanvas.getContext("2d");
    oCtx.drawImage(deepCanvas, 0, 0);
    oCtx.fillStyle = b.oreColor;
    const spots = [[3, 3], [10, 4], [6, 8], [11, 11], [4, 12]];
    spots.forEach(([sx, sy]) => {
      oCtx.fillRect(sx, sy, 3, 3);
      oCtx.fillStyle = "#ffffff";
      oCtx.fillRect(sx, sy, 1, 1);
      oCtx.fillStyle = b.oreColor;
    });

    blockTextures[b.id] = { top: topCanvas, deep: deepCanvas, ore: oreCanvas };
  });
}

/* --- 2. INICIALIZACIÓN DE CLIMA, NUBES Y ESTRELLAS --- */
function initAtmosphere() {
  state.clouds = Array.from({ length: 7 }, (_, i) => ({
    x: i * 135,
    y: 28 + (i % 3) * 24,
    w: 74 + (i % 2) * 36,
    h: 20,
    speed: 0.18 + (i % 3) * 0.08
  }));

  state.stars = Array.from({ length: 45 }, () => ({
    x: Math.random() * 860,
    y: Math.random() * 230,
    size: Math.random() > 0.5 ? 3 : 2,
    phase: Math.random() * Math.PI * 2
  }));

  state.weather = Array.from({ length: 38 }, () => ({
    x: Math.random() * 860,
    y: Math.random() * 450,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.6 + Math.random() * 1.1,
    size: 3 + Math.floor(Math.random() * 3)
  }));
}

/* --- 3. MOTOR DE AUDIO SINTETIZADO --- */
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

/* --- 4. EFECTOS DE PARTÍCULAS Y TEXTO FLOTANTE --- */
function spawnBurst(screenX, screenY, color = "#34d399", count = 22) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.2;
    state.particles.push({
      x: screenX,
      y: screenY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color,
      size: 4 + Math.floor(Math.random() * 4),
      life: 1.0
    });
  }
}

function addFloatingText(screenX, screenY, text, color = "#fde047") {
  state.floatingTexts.push({
    x: screenX,
    y: screenY,
    text,
    color,
    life: 1.0
  });
}

/* --- 5. BARAJADO ALEATORIO FISHER-YATES --- */
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

/* --- 6. CAMBIO DE BIOMA --- */
function applyBiome(index) {
  state.biomeIdx = index % BIOMES.length;
  const biome = BIOMES[state.biomeIdx];
  document.getElementById("ui-biome-name").textContent = biome.name;
  document.body.setAttribute("data-biome", biome.id);
}

function nextBiome() {
  state.biomeSecondsLeft = 300;
  applyBiome(state.biomeIdx + 1);
  playSound(540, "triangle", 0.18);
  addFloatingText(430, 90, `🌍 Bioma: ${BIOMES[state.biomeIdx].name}`, "#38bdf8");
}

function startBiomeTimer() {
  setInterval(() => {
    state.biomeSecondsLeft--;
    if (state.biomeSecondsLeft <= 0) nextBiome();
    const mins = String(Math.floor(state.biomeSecondsLeft / 60)).padStart(2, "0");
    const secs = String(state.biomeSecondsLeft % 60).padStart(2, "0");
    document.getElementById("ui-biome-timer").textContent = `${mins}:${secs}`;
  }, 1000);
}

/* --- 7. GESTIÓN DE NIVELES Y PREGUNTAS --- */
function populateLevelSelect() {
  const select = document.getElementById("level-select");
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
  state.playerX = 0;
  state.targetX = 0;

  const lvl = LEVELS[idx];
  document.getElementById("level-select").value = idx;
  document.getElementById("ui-equation").textContent = lvl.eqText;
  document.getElementById("x-slider").value = 0;

  const bossBadge = document.getElementById("boss-badge");
  if (lvl.isBoss) bossBadge.classList.remove("hidden");
  else bossBadge.classList.add("hidden");

  updateProfessorBoard();
  renderCurrentQuestion();
  updateTelemetry();
}

function updateProfessorBoard() {
  const lvl = LEVELS[state.levelIdx];
  const board = document.getElementById("professor-text");
  board.innerHTML = `
    <p><strong>Montaña Actual (Nivel ${lvl.num}):</strong> <code>${lvl.eqText}</code></p>
    <p>• <strong>Paso 1:</strong> Derivamos para hallar la pendiente instantánea <code>f'(x)</code>.</p>
    <p>• <strong>Paso 2:</strong> Igualamos <code>f'(x) = 0</code> para localizar los puntos críticos donde el terreno es horizontal.</p>
    <p>• <strong>Paso 3:</strong> Evaluamos <code>f''(x)</code>: negativa (<code>&lt; 0</code>) confirma una <strong>Cima (Máximo)</strong>; positiva (<code>&gt; 0</code>) confirma un <strong>Valle (Mínimo)</strong>.</p>
  `;
  document.getElementById("ui-progress-count").textContent =
    `Niveles: ${state.completedLevels.size} / ${LEVELS.length}`;
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

  feedbackBox.classList.add("hidden");
  nextBtn.classList.add("hidden");
  optionsContainer.innerHTML = "";

  ["dot-1", "dot-2", "dot-3"].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", idx + 1 === state.step);
  });

  let qData = lvl.q1;
  if (state.step === 1) {
    stepBadge.textContent = "FASE 1 DE 3";
    titleEl.textContent = "1. Primera Derivada f'(x)";
    descEl.textContent = "Aplica la regla de la potencia para encontrar la pendiente f'(x).";
    qData = lvl.q1;
  } else if (state.step === 2) {
    stepBadge.textContent = "FASE 2 DE 3";
    titleEl.textContent = "2. Puntos Críticos: f'(x) = 0";
    descEl.textContent = "Descubre en qué coordenadas X la pendiente se hace cero (horizontal).";
    qData = lvl.q2;
  } else {
    stepBadge.textContent = "FASE 3 DE 3";
    titleEl.textContent = "3. Criterio de la Segunda Derivada f''(x)";
    descEl.textContent = "Clasifica los puntos críticos evaluando el signo de la concavidad f''(x).";
    qData = lvl.q3;
  }

  promptEl.textContent = qData.prompt;

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
    setTimeout(() => playSound(880, "square", 0.18), 110);

    const bonus = SHOP_ITEMS[2].owned ? 36 : 30;
    state.emeralds += bonus;
    state.xp += 50;
    state.streak += 1;
    updateHUD();

    // Explosión de partículas sobre Steve
    const sx = ((state.playerX + 6) / 12) * 860;
    const sy = 450 * 0.64 - LEVELS[state.levelIdx].fn(state.playerX) * 22;
    spawnBurst(sx, sy - 30, "#34d399", 28);
    addFloatingText(sx, sy - 55, `+${bonus} 💎 ¡CORRECTO!`, "#4ade80");

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `✅ <strong>¡Excelente! (+${bonus} 💎)</strong><br>${explanation}`;

    if (state.step < 3) {
      setTimeout(() => {
        state.step += 1;
        renderCurrentQuestion();
      }, 1600);
    } else {
      state.completedLevels.add(state.levelIdx);
      updateProfessorBoard();
      spawnBurst(430, 160, "#fde047", 45);
      addFloatingText(430, 130, `🏆 ¡NIVEL ${LEVELS[state.levelIdx].num} SUPERADO!`, "#fde047");
      document.getElementById("btn-next-level").classList.remove("hidden");
      feedbackBox.innerHTML += `<br><br>🎉 <strong>¡Montaña conquistada!</strong> Avanza al siguiente nivel.`;
    }
  } else {
    clickedBtn.classList.add("wrong");
    clickedBtn.disabled = true;
    state.streak = 0;
    updateHUD();
    playSound(170, "sawtooth", 0.22);

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `❌ <strong>Cuidado:</strong> ${explanation}`;
  }
}

function updateHUD() {
  document.getElementById("ui-emeralds").textContent = state.emeralds;
  document.getElementById("ui-xp").textContent = state.xp;
  document.getElementById("ui-streak").textContent = state.streak;
}

/* --- 8. MOVIMIENTO SUAVE Y FÍSICAS DE STEVE --- */
function setTargetX(newX) {
  const clamped = Math.max(-6, Math.min(6, newX));
  if (clamped > state.targetX) state.facing = 1;
  if (clamped < state.targetX) state.facing = -1;
  state.targetX = clamped;
  document.getElementById("x-slider").value = clamped.toFixed(2);
}

function triggerJump() {
  if (state.jumpY === 0) {
    state.jumpVel = 6.2;
    playSound(380, "sine", 0.09);
  }
}

function updateTelemetry() {
  const lvl = LEVELS[state.levelIdx];
  const x = state.playerX;
  const y = lvl.fn(x);
  const dy = lvl.df(x);
  const d2y = lvl.d2f(x);

  document.getElementById("tel-x").textContent = x.toFixed(2);
  document.getElementById("tel-y").textContent = y.toFixed(2);
  document.getElementById("tel-dy").textContent = dy.toFixed(2);
  document.getElementById("tel-d2y").textContent = d2y.toFixed(2);

  const stateTag = document.getElementById("tel-state");
  if (Math.abs(dy) < 0.09) {
    stateTag.textContent = "⭐ ¡PUNTO CRÍTICO f'(x)≈0!";
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

/* --- 9. BUCLE PRINCIPAL DE RENDERIZADO A 60 FPS --- */
function gameLoop() {
  state.time += 0.035;

  // Movimiento continuo por teclado
  if (state.keys.left) setTargetX(state.targetX - 0.06);
  if (state.keys.right) setTargetX(state.targetX + 0.06);

  // Interpolación suave (Lerp) de Steve
  const diff = state.targetX - state.playerX;
  if (Math.abs(diff) > 0.002) {
    state.playerX += diff * 0.22;
    state.walkFrame += Math.abs(diff) * 3.2;
    updateTelemetry();
  } else {
    state.playerX = state.targetX;
  }

  // Física de salto
  if (state.jumpY > 0 || state.jumpVel > 0) {
    state.jumpY += state.jumpVel;
    state.jumpVel -= 0.45;
    if (state.jumpY <= 0) {
      state.jumpY = 0;
      state.jumpVel = 0;
    }
  }

  drawWorld();
  requestAnimationFrame(gameLoop);
}

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

  // 1. CIELO CON SHADER GRADIENTE
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, biome.skyTop);
  skyGrad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. ESTRELLAS PARPADEANTES EN BIOMAS OSCUROS
  if (!biome.isLight) {
    state.stars.forEach((st) => {
      const alpha = 0.35 + 0.65 * Math.abs(Math.sin(state.time + st.phase));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });
  }

  // 3. SOL / LUNA CON HALO LUMINOSO (BLOOM)
  const sunX = W - 115;
  const sunY = 36 + Math.sin(state.time * 0.5) * 4;
  ctx.fillStyle = biome.sunColor;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(sunX - 12, sunY - 12, 72, 72);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(sunX - 6, sunY - 6, 60, 60);
  ctx.globalAlpha = 1.0;
  ctx.fillRect(sunX, sunY, 48, 48);

  // 4. MONTAÑAS PARALLAX DE FONDO (2 CAPAS PIXELADAS)
  const parallaxOffset = state.playerX * 8;
  ctx.fillStyle = biome.isLight ? "rgba(30, 58, 95, 0.22)" : "rgba(0, 0, 0, 0.35)";
  for (let px = 0; px < W; px += 20) {
    const h1 = 120 + Math.sin((px + parallaxOffset * 0.5) * 0.012) * 55 + Math.cos(px * 0.03) * 25;
    ctx.fillRect(px, H - h1, 20, h1);
  }
  ctx.fillStyle = biome.isLight ? "rgba(15, 23, 42, 0.28)" : "rgba(0, 0, 0, 0.52)";
  for (let px = 0; px < W; px += 16) {
    const h2 = 75 + Math.cos((px + parallaxOffset) * 0.02) * 35;
    ctx.fillRect(px, H - h2, 16, h2);
  }

  // 5. NUBES VOLUMÉTRICAS EN MOVIMIENTO
  state.clouds.forEach((cl) => {
    cl.x += cl.speed;
    if (cl.x > W + 40) cl.x = -cl.w - 20;
    ctx.fillStyle = biome.isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.14)";
    ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
    ctx.fillRect(cl.x + 14, cl.y - 10, cl.w * 0.55, 10);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(cl.x, cl.y + cl.h - 4, cl.w, 4);
  });

  // Conversión de coordenadas matemáticas [-6, 6] a pantalla
  const toScreenX = (x) => ((x + 6) / 12) * W;
  const toScreenY = (y) => H * 0.64 - y * 22;

  // 6. CUADRÍCULA CARTESIANA CON COORDENADAS NUMERADAS
  ctx.strokeStyle = biome.isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillStyle = biome.isLight ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.45)";
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

  // Ejes principales X e Y
  ctx.strokeStyle = biome.isLight ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toScreenX(0), 0);
  ctx.lineTo(toScreenX(0), H);
  ctx.moveTo(0, toScreenY(0));
  ctx.lineTo(W, toScreenY(0));
  ctx.stroke();

  // 7. TERRENO DE BLOQUES PIXEL-ART DE 16x16 + ÁRBOLES DECORATIVOS
  const blockSize = 16;
  for (let px = 0; px < W; px += blockSize) {
    const mathX = (px / W) * 12 - 6;
    const mathY = lvl.fn(mathX);
    const topY = Math.floor(toScreenY(mathY) / blockSize) * blockSize;

    // Árboles / Cristales en columnas específicas lejos de los puntos críticos
    if (px % 128 === 32 && topY > 90 && topY < H - 40) {
      // Tronco
      ctx.fillStyle = "#5c3a21";
      ctx.fillRect(px + 4, topY - 28, 8, 28);
      // Copa del árbol del color del bioma
      ctx.fillStyle = biome.topBlock;
      ctx.fillRect(px - 8, topY - 48, 32, 22);
      ctx.fillRect(px - 2, topY - 58, 20, 12);
    }

    // Bloque superficial texturizado
    ctx.drawImage(textures.top, px, topY);

    // Bloques subterráneos y minerales
    for (let by = topY + blockSize; by < H; by += blockSize) {
      const isOre = ((px * 17 + by * 13) % 37) === 0;
      ctx.drawImage(isOre ? textures.ore : textures.deep, px, by);
    }
  }

  // 8. BALIZAS EN PUNTOS CRÍTICOS (CUANDO ESTÁS EN FASE 2 O 3)
  if (state.step >= 2) {
    lvl.critX.forEach((cx) => {
      const sx = toScreenX(cx);
      const sy = toScreenY(lvl.fn(cx));
      const pulse = 6 + Math.sin(state.time * 3) * 3;
      ctx.fillStyle = "rgba(250, 204, 21, 0.25)";
      ctx.beginPath();
      ctx.arc(sx, sy, pulse + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fde047";
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
    });
  }

  // 9. CURVA CONTINUA f(x) CON RESPLANDOR NEÓN (SHADER BLOOM)
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

  // 10. BANDERAS PLANTADAS POR EL JUGADOR
  state.flags.forEach((fx) => {
    const sx = toScreenX(fx);
    const sy = toScreenY(lvl.fn(fx));
    ctx.fillStyle = "#fde047";
    ctx.fillRect(sx - 2, sy - 34, 3, 34);
    ctx.fillStyle = "#ef4444";
    const wave = Math.sin(state.time * 3 + fx) * 2;
    ctx.fillRect(sx + 1, sy - 34 + wave, 18, 12);
  });

  // 11. LÁSER DE RECTA TANGENTE f'(x)
  const px = state.playerX;
  const py = lvl.fn(px);
  const slope = lvl.df(px);
  const span = SHOP_ITEMS[0].owned ? 2.6 : 1.4;

  const x1 = px - span;
  const y1 = py - slope * span;
  const x2 = px + span;
  const y2 = py + slope * span;

  const laserColor =
    Math.abs(slope) < 0.09 ? "#fde047" : slope > 0 ? "#4ade80" : "#f87171";

  ctx.save();
  ctx.strokeStyle = laserColor;
  ctx.lineWidth = 4;
  ctx.shadowColor = laserColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(toScreenX(x1), toScreenY(y1));
  ctx.lineTo(toScreenX(x2), toScreenY(y2));
  ctx.stroke();
  ctx.restore();

  // 12. DIBUJAR A STEVE ANIMADO CON PICO ENCANTADO
  const steveX = toScreenX(px);
  const steveY = toScreenY(py) - state.jumpY;
  const hasArmor = SHOP_ITEMS[2].owned;
  const legSwing = Math.sin(state.walkFrame) * 4;

  ctx.save();
  ctx.translate(steveX, steveY);

  // Sombra bajo los pies
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(-9, -3 + state.jumpY, 18, 4);

  // Piernas con animación de caminata
  ctx.fillStyle = hasArmor ? "#38bdf8" : "#1d4ed8";
  ctx.fillRect(-6 + legSwing * 0.5, -12, 5, 12);
  ctx.fillRect(1 - legSwing * 0.5, -12, 5, 12);

  // Capa roja ondeando
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-state.facing * 9, -26, 4, 16);

  // Torso
  ctx.fillStyle = hasArmor ? "#facc15" : "#06b6d4";
  ctx.fillRect(-7, -27, 14, 15);

  // Cabeza pixel-art
  ctx.fillStyle = "#d97706";
  ctx.fillRect(-7, -41, 14, 14);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(-7, -41, 14, 4);
  ctx.fillStyle = "#ffffff";
  const eyeOffset = state.facing > 0 ? 1 : -3;
  ctx.fillRect(-3 + eyeOffset, -34, 3, 3);
  ctx.fillRect(2 + eyeOffset, -34, 3, 3);

  // Pico de Diamante en la mano
  ctx.fillStyle = "#78350f";
  ctx.fillRect(state.facing * 8, -26, 3, 12);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(state.facing * 5, -29, 9, 3);

  // Etiqueta flotante sobre Steve
  ctx.fillStyle = "rgba(9, 13, 22, 0.85)";
  ctx.fillRect(-48, -64, 96, 18);
  ctx.strokeStyle = laserColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-48, -64, 96, 18);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`x=${px.toFixed(1)} | m=${slope.toFixed(1)}`, 0, -51);
  ctx.restore();

  // 13. JEFE ANIMADO EN NIVELES 10 (WITHER) Y 20 (ENDER DRAGON)
  if (lvl.isBoss) {
    drawBoss(ctx, W, lvl.num === 20);
  }

  // 14. CLIMA AMBIENTAL DEL BIOMA (NIEVE, PÉTALOS, CENIZAS)
  state.weather.forEach((wp) => {
    wp.x += wp.vx;
    wp.y += biome.id === "nether" || biome.id === "end" ? -wp.vy : wp.vy;
    if (wp.y > H) wp.y = -5;
    if (wp.y < 0) wp.y = H + 5;
    if (wp.x > W) wp.x = 0;
    if (wp.x < 0) wp.x = W;

    ctx.fillStyle = biome.oreColor;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(wp.x, wp.y, wp.size, wp.size);
    ctx.globalAlpha = 1.0;
  });

  // 15. PARTÍCULAS DE EXPLOSIÓN Y TEXTOS FLOTANTES
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 0.025;
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
    ft.y -= 0.8;
    ft.life -= 0.018;
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
}

/* --- DIBUJO DE JEFES (WITHER Y ENDER DRAGON) CON BARRA DE VIDA --- */
function drawBoss(ctx, W, isDragon) {
  const bx = W * 0.5 + Math.sin(state.time * 1.4) * 95;
  const by = 68 + Math.cos(state.time * 2.2) * 14;
  const hpFraction = (4 - state.step) / 3;

  // Barra de vida del Jefe arriba al centro
  ctx.fillStyle = "rgba(9, 13, 22, 0.88)";
  ctx.fillRect(W * 0.5 - 150, 12, 300, 22);
  ctx.fillStyle = isDragon ? "#a855f7" : "#ef4444";
  ctx.fillRect(W * 0.5 - 146, 16, 292 * hpFraction, 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(isDragon ? "🐉 ENDER DRAGON" : "💀 EL WITHER", W * 0.5, 27);

  // Sprite Pixel-Art del Jefe flotando
  ctx.save();
  ctx.translate(bx, by);
  const wingOffset = Math.sin(state.time * 6) * 10;
  ctx.fillStyle = isDragon ? "#1e1b4b" : "#27272a";
  ctx.fillRect(-26, -8 + wingOffset, 20, 8);
  ctx.fillRect(6, -8 + wingOffset, 20, 8);
  ctx.fillRect(-12, -12, 24, 24);
  ctx.fillStyle = isDragon ? "#c084fc" : "#fde047";
  ctx.fillRect(-8, -5, 5, 4);
  ctx.fillRect(3, -5, 5, 4);
  ctx.restore();
}

/* --- 10. TIENDA Y EVENTOS --- */
function renderShop() {
  const container = document.getElementById("shop-items-container");
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
          document.getElementById("tel-concavity").classList.remove("hidden");
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

  document.getElementById("level-select").addEventListener("change", (e) => {
    loadLevel(parseInt(e.target.value, 10));
  });

  document.getElementById("btn-boss-10").addEventListener("click", () => loadLevel(9));
  document.getElementById("btn-boss-20").addEventListener("click", () => loadLevel(19));
  document.getElementById("btn-change-biome").addEventListener("click", nextBiome);

  document.getElementById("btn-sound").addEventListener("click", (e) => {
    state.soundOn = !state.soundOn;
    e.target.textContent = state.soundOn ? "🔊" : "🔇";
  });

  document.getElementById("x-slider").addEventListener("input", (e) => {
    setTargetX(parseFloat(e.target.value));
  });
  document.getElementById("btn-step-left").addEventListener("click", () => {
    setTargetX(Math.round((state.targetX - 0.5) * 2) / 2);
  });
  document.getElementById("btn-step-right").addEventListener("click", () => {
    setTargetX(Math.round((state.targetX + 0.5) * 2) / 2);
  });

  // Clic directo sobre el lienzo para caminar hacia ese punto X
  const canvas = document.getElementById("game-canvas");
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const mathX = Math.round((relX * 12 - 6) * 10) / 10;
    setTargetX(mathX);
    triggerJump();
  });

  // Controles de Teclado (WASD / Flechas / Espacio / 1-4 para responder)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.right = true;
    if (e.key === " " || e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      if (document.activeElement.tagName !== "BUTTON") e.preventDefault();
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

  // Plantar bandera con detección de punto crítico
  document.getElementById("btn-plant-flag").addEventListener("click", () => {
    state.flags.push(state.playerX);
    const sx = ((state.playerX + 6) / 12) * 860;
    const sy = 450 * 0.64 - LEVELS[state.levelIdx].fn(state.playerX) * 22;
    const slope = Math.abs(LEVELS[state.levelIdx].df(state.playerX));

    if (slope < 0.09) {
      spawnBurst(sx, sy - 20, "#fde047", 25);
      addFloatingText(sx, sy - 45, "🚩 ¡CUMBRE/VALLE EXACTO! +15 💎", "#fde047");
      state.emeralds += 15;
      updateHUD();
      playSound(720, "triangle", 0.2);
    } else {
      addFloatingText(sx, sy - 40, `🚩 Bandera en x=${state.playerX.toFixed(1)}`, "#f8fafc");
      playSound(440, "triangle", 0.12);
    }
  });

  document.getElementById("btn-use-hint").addEventListener("click", () => {
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
    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `💡 <strong>Pista del Profesor:</strong> ${explain}`;
  });

  document.getElementById("btn-next-level").addEventListener("click", () => {
    loadLevel((state.levelIdx + 1) % LEVELS.length);
  });

  document.getElementById("btn-open-theory").addEventListener("click", () => {
    document.getElementById("modal-theory").classList.remove("hidden");
  });
  document.getElementById("btn-close-theory").addEventListener("click", () => {
    document.getElementById("modal-theory").classList.add("hidden");
  });

  document.getElementById("btn-open-shop").addEventListener("click", () => {
    renderShop();
    document.getElementById("modal-shop").classList.remove("hidden");
  });
  document.getElementById("btn-close-shop").addEventListener("click", () => {
    document.getElementById("modal-shop").classList.add("hidden");
  });
});
