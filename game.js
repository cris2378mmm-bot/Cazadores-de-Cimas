/* ============================================================================
   LOCAL SCRIPT: MOTOR 2D MINECRAFT, BARAJADO ALEATORIO Y TEMPORIZADOR DE BIOMA
   ============================================================================ */

const state = {
  levelIdx: 0,
  step: 1, // 1: f'(x), 2: f'(x)=0, 3: f''(x)
  playerX: 0,
  emeralds: 150,
  xp: 0,
  streak: 0,
  completedLevels: new Set(),
  flags: [],
  biomeIdx: 0,
  biomeSecondsLeft: 300, // 5 minutos = 300 segundos
  soundOn: true,
  audioCtx: null
};

/* --- 1. MOTOR DE SONIDO SINTETIZADO SEGURO --- */
function playSound(freq, type = "square", duration = 0.1) {
  if (!state.soundOn) return;
  try {
    if (!state.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) state.audioCtx = new AudioContextClass();
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
  } catch (e) {
    // Ignorar si el navegador bloquea el audio antes del primer clic
  }
}

/* --- 2. BARAJADO ALEATORIO (FISHER-YATES) PARA QUE LA RESPUESTA NUNCA SEA SIEMPRE 'A' --- */
function shuffleOptions(correctText, wrongArray) {
  const pool = [
    { text: correctText, isCorrect: true },
    ...wrongArray.map((w) => ({ text: w, isCorrect: false }))
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool;
}

/* --- 3. GESTIÓN DE BIOMAS (CADA 5 MINUTOS O MANUAL) --- */
function applyBiome(index) {
  state.biomeIdx = index % BIOMES.length;
  const biome = BIOMES[state.biomeIdx];

  document.getElementById("ui-biome-name").textContent = biome.name;
  if (biome.isLight) {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }
  drawWorld();
}

function nextBiome() {
  state.biomeSecondsLeft = 300;
  applyBiome(state.biomeIdx + 1);
  playSound(520, "triangle", 0.18);
}

function startBiomeTimer() {
  setInterval(() => {
    state.biomeSecondsLeft--;
    if (state.biomeSecondsLeft <= 0) {
      nextBiome();
    }
    const mins = String(Math.floor(state.biomeSecondsLeft / 60)).padStart(2, "0");
    const secs = String(state.biomeSecondsLeft % 60).padStart(2, "0");
    document.getElementById("ui-biome-timer").textContent = `${mins}:${secs}`;
  }, 1000);
}

/* --- 4. CARGA DE NIVELES Y PREGUNTAS --- */
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

  const lvl = LEVELS[idx];
  document.getElementById("level-select").value = idx;
  document.getElementById("ui-equation").textContent = lvl.eqText;
  document.getElementById("x-slider").value = 0;

  const bossBadge = document.getElementById("boss-badge");
  if (lvl.isBoss) {
    bossBadge.classList.remove("hidden");
  } else {
    bossBadge.classList.add("hidden");
  }

  updateProfessorBoard();
  renderCurrentQuestion();
  updateTelemetry();
  drawWorld();
}

function updateProfessorBoard() {
  const lvl = LEVELS[state.levelIdx];
  const board = document.getElementById("professor-text");
  board.innerHTML = `
    <p><strong>Función del Nivel ${lvl.num}:</strong> <code>${lvl.eqText}</code></p>
    <p>• <strong>Fase 1 (Derivada):</strong> Calculamos la pendiente instantánea <code>f'(x)</code> usando la regla de la potencia.</p>
    <p>• <strong>Fase 2 (Puntos Críticos):</strong> Igualamos <code>f'(x) = 0</code> porque en la cima de una montaña o el fondo de un valle la recta tangente es horizontal (pendiente cero).</p>
    <p>• <strong>Fase 3 (2da Derivada):</strong> Evaluamos <code>f''(x)</code>: si es negativa (<code>&lt; 0</code>) es una <strong>Cima (Máximo)</strong>; si es positiva (<code>&gt; 0</code>) es un <strong>Valle (Mínimo)</strong>.</p>
  `;
  document.getElementById("ui-progress-count").textContent =
    `Niveles superados: ${state.completedLevels.size} / ${LEVELS.length}`;
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

  let qData = lvl.q1;
  if (state.step === 1) {
    stepBadge.textContent = "FASE 1 DE 3";
    titleEl.textContent = "1. Primera Derivada f'(x)";
    descEl.textContent = "Deriva la función f(x) para obtener la fórmula de la pendiente en cualquier punto.";
    qData = lvl.q1;
  } else if (state.step === 2) {
    stepBadge.textContent = "FASE 2 DE 3";
    titleEl.textContent = "2. Puntos Críticos: f'(x) = 0";
    descEl.textContent = "Iguala la derivada a cero para descubrir en qué coordenadas X la pendiente se vuelve horizontal.";
    qData = lvl.q2;
  } else {
    stepBadge.textContent = "FASE 3 DE 3";
    titleEl.textContent = "3. Criterio de la Segunda Derivada f''(x)";
    descEl.textContent = "Evalúa el signo de la segunda derivada f''(x) para clasificar cada punto crítico en Cima o Valle.";
    qData = lvl.q3;
  }

  promptEl.textContent = qData.prompt;

  // Barajamos las opciones para que el inciso correcto cambie entre A, B, C y D
  const letters = ["A", "B", "C", "D"];
  const shuffled = shuffleOptions(qData.correct, qData.wrong);

  shuffled.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${letters[index]}) ${item.text}`;
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
    playSound(660, "square", 0.15);

    const bonus = SHOP_ITEMS[2].owned ? 36 : 30;
    state.emeralds += bonus;
    state.xp += 50;
    state.streak += 1;
    updateHUD();

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `✅ <strong>¡Correcto! (+${bonus} 💎)</strong><br>${explanation}`;

    if (state.step < 3) {
      setTimeout(() => {
        state.step += 1;
        renderCurrentQuestion();
      }, 1700);
    } else {
      state.completedLevels.add(state.levelIdx);
      updateProfessorBoard();
      const nextBtn = document.getElementById("btn-next-level");
      nextBtn.classList.remove("hidden");
      feedbackBox.innerHTML += `<br><br>🎉 <strong>¡Nivel ${LEVELS[state.levelIdx].num} completado!</strong> Presiona "Siguiente Nivel".`;
    }
  } else {
    clickedBtn.classList.add("wrong");
    clickedBtn.disabled = true;
    state.streak = 0;
    updateHUD();
    playSound(180, "sawtooth", 0.2);

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `❌ <strong>Respuesta incorrecta.</strong> Revisa tus cálculos: ${explanation}`;
  }
}

function updateHUD() {
  document.getElementById("ui-emeralds").textContent = state.emeralds;
  document.getElementById("ui-xp").textContent = state.xp;
  document.getElementById("ui-streak").textContent = state.streak;
}

/* --- 5. TELEMETRÍA Y MOVIMIENTO DEL ALPINISTA STEVE --- */
function setPlayerX(newX) {
  state.playerX = Math.max(-6, Math.min(6, Math.round(newX * 10) / 10));
  document.getElementById("x-slider").value = state.playerX;
  updateTelemetry();
  drawWorld();
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
  if (Math.abs(dy) < 0.08) {
    stateTag.textContent = "⭐ ¡PUNTO CRÍTICO f'(x)=0!";
    stateTag.style.background = "#eab308";
    stateTag.style.color = "#000";
  } else if (dy > 0) {
    stateTag.textContent = "Subiendo ↗ (f'(x) > 0)";
    stateTag.style.background = "#16a34a";
    stateTag.style.color = "#fff";
  } else {
    stateTag.textContent = "Bajando ↘ (f'(x) < 0)";
    stateTag.style.background = "#dc2626";
    stateTag.style.color = "#fff";
  }
}

/* --- 6. RENDERIZADO 2D ESTILO MINECRAFT --- */
function drawWorld() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const biome = BIOMES[state.biomeIdx];
  const lvl = LEVELS[state.levelIdx];

  // 1. Cielo con gradiente del bioma
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, biome.skyTop);
  skyGrad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Sol / Luna cuadrada estilo Minecraft
  ctx.fillStyle = biome.sunColor;
  ctx.fillRect(W - 95, 32, 46, 46);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(W - 95, 32, 46, 46);

  // 3. Nubes cuadradas estilo Minecraft
  ctx.fillStyle = biome.isLight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.18)";
  ctx.fillRect(90, 42, 85, 22);
  ctx.fillRect(115, 28, 45, 16);
  ctx.fillRect(360, 58, 110, 20);
  ctx.fillRect(580, 36, 75, 20);

  // Conversión de coordenadas matemáticas [-6, 6] x [-8, 10] a píxeles
  const toScreenX = (x) => ((x + 6) / 12) * W;
  const toScreenY = (y) => H * 0.62 - y * 22;

  // 4. Cuadrícula cartesiana suave
  ctx.strokeStyle = biome.isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let gx = -6; gx <= 6; gx++) {
    const sx = toScreenX(gx);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H);
    ctx.stroke();
  }
  for (let gy = -8; gy <= 10; gy += 2) {
    const sy = toScreenY(gy);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(W, sy);
    ctx.stroke();
  }

  // Ejes X = 0 y Y = 0
  ctx.strokeStyle = biome.isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toScreenX(0), 0);
  ctx.lineTo(toScreenX(0), H);
  ctx.moveTo(0, toScreenY(0));
  ctx.lineTo(W, toScreenY(0));
  ctx.stroke();

  // 5. Terreno de Bloques de Minecraft (Columnas de 12px)
  const blockSize = 12;
  for (let px = 0; px < W; px += blockSize) {
    const mathX = (px / W) * 12 - 6;
    const mathY = lvl.fn(mathX);
    const topY = Math.floor(toScreenY(mathY) / blockSize) * blockSize;

    // Bloque superficial (pasto / nieve / nylium)
    ctx.fillStyle = biome.topBlock;
    ctx.fillRect(px, topY, blockSize, blockSize);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.strokeRect(px, topY, blockSize, blockSize);

    // Capas de tierra (3 bloques hacia abajo)
    ctx.fillStyle = biome.midBlock;
    ctx.fillRect(px, topY + blockSize, blockSize, blockSize * 3);

    // Piedra profunda y minerales hasta el fondo del canvas
    for (let by = topY + blockSize * 4; by < H; by += blockSize) {
      const isOre = ((px * 13 + by * 7) % 29) === 0;
      ctx.fillStyle = isOre ? biome.oreColor : biome.deepBlock;
      ctx.fillRect(px, by, blockSize, blockSize);
    }
  }

  // 6. Curva suave continua de f(x) encima de los bloques
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let px = 0; px <= W; px += 4) {
    const mathX = (px / W) * 12 - 6;
    const sy = toScreenY(lvl.fn(mathX));
    if (px === 0) ctx.moveTo(px, sy);
    else ctx.lineTo(px, sy);
  }
  ctx.stroke();

  // 7. Banderas plantadas por el jugador
  state.flags.forEach((fx) => {
    const sx = toScreenX(fx);
    const sy = toScreenY(lvl.fn(fx));
    ctx.fillStyle = "#facc15";
    ctx.fillRect(sx - 2, sy - 28, 3, 28);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(sx + 1, sy - 28, 16, 11);
  });

  // 8. Recta Tangente f'(x) bajo los pies de Steve
  const px = state.playerX;
  const py = lvl.fn(px);
  const slope = lvl.df(px);
  const span = SHOP_ITEMS[0].owned ? 2.4 : 1.3;

  const x1 = px - span;
  const y1 = py - slope * span;
  const x2 = px + span;
  const y2 = py + slope * span;

  ctx.strokeStyle =
    Math.abs(slope) < 0.08 ? "#facc15" : slope > 0 ? "#22c55e" : "#ef4444";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(toScreenX(x1), toScreenY(y1));
  ctx.lineTo(toScreenX(x2), toScreenY(y2));
  ctx.stroke();

  // 9. Dibujar a Steve Alpinista (bloques estilo Minecraft)
  const steveX = toScreenX(px);
  const steveY = toScreenY(py);
  const hasGoldArmor = SHOP_ITEMS[2].owned;

  // Piernas
  ctx.fillStyle = hasGoldArmor ? "#38bdf8" : "#1d4ed8";
  ctx.fillRect(steveX - 6, steveY - 12, 12, 12);
  // Torso
  ctx.fillStyle = hasGoldArmor ? "#facc15" : "#06b6d4";
  ctx.fillRect(steveX - 7, steveY - 26, 14, 14);
  // Cabeza
  ctx.fillStyle = "#d97706";
  ctx.fillRect(steveX - 7, steveY - 40, 14, 14);
  // Cabello y ojos
  ctx.fillStyle = "#451a03";
  ctx.fillRect(steveX - 7, steveY - 40, 14, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(steveX - 4, steveY - 33, 3, 3);
  ctx.fillRect(steveX + 2, steveY - 33, 3, 3);

  // Etiqueta sobre Steve
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(steveX - 42, steveY - 62, 84, 18);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`x=${px.toFixed(1)}`, steveX, steveY - 49);
}

/* --- 7. TIENDA Y PISTAS --- */
function renderShop() {
  const container = document.getElementById("shop-items-container");
  container.innerHTML = "";
  SHOP_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "shop-item";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <p style="font-size:0.82rem; opacity:0.85;">${item.desc}</p>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "mc-btn mc-btn-gold";
    btn.textContent = item.owned ? "Comprado ✅" : `Comprar (${item.cost} 💎)`;
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
        drawWorld();
        playSound(740, "square", 0.15);
      } else {
        alert("No tienes suficientes esmeraldas 💎.");
      }
    });
    row.appendChild(btn);
    container.appendChild(row);
  });
}

/* --- 8. INICIALIZACIÓN Y EVENTOS --- */
window.addEventListener("DOMContentLoaded", () => {
  populateLevelSelect();
  applyBiome(0);
  loadLevel(0);
  startBiomeTimer();

  // Selector de nivel
  document.getElementById("level-select").addEventListener("change", (e) => {
    loadLevel( parseInt(e.target.value, 10) );
  });

  // Botones de Jefes N10 y N20
  document.getElementById("btn-boss-10").addEventListener("click", () => loadLevel(9));
  document.getElementById("btn-boss-20").addEventListener("click", () => loadLevel(19));

  // Cambio de bioma manual
  document.getElementById("btn-change-biome").addEventListener("click", nextBiome);

  // Sonido
  document.getElementById("btn-sound").addEventListener("click", (e) => {
    state.soundOn = !state.soundOn;
    e.target.textContent = state.soundOn ? "🔊" : "🔇";
  });

  // Movimiento de Steve
  document.getElementById("x-slider").addEventListener("input", (e) => {
    setPlayerX(parseFloat(e.target.value));
  });
  document.getElementById("btn-step-left").addEventListener("click", () => {
    setPlayerX(state.playerX - 0.5);
  });
  document.getElementById("btn-step-right").addEventListener("click", () => {
    setPlayerX(state.playerX + 0.5);
  });

  // Teclado A / D o Flechas
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      setPlayerX(state.playerX - 0.2);
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      setPlayerX(state.playerX + 0.2);
    }
  });

  // Plantar bandera
  document.getElementById("btn-plant-flag").addEventListener("click", () => {
    state.flags.push(state.playerX);
    playSound(440, "triangle", 0.12);
    drawWorld();
  });

  // Pista del Profesor
  document.getElementById("btn-use-hint").addEventListener("click", () => {
    if (state.emeralds < 25) {
      alert("Necesitas al menos 25 esmeraldas 💎 para pedir una pista.");
      return;
    }
    state.emeralds -= 25;
    updateHUD();
    const lvl = LEVELS[state.levelIdx];
    const explain =
      state.step === 1 ? lvl.q1.explain : state.step === 2 ? lvl.q2.explain : lvl.q3.explain;
    const feedbackBox = document.getElementById("feedback-box");
    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `💡 <strong>Pista de Cálculo Diferencial:</strong> ${explain}`;
  });

  // Siguiente nivel
  document.getElementById("btn-next-level").addEventListener("click", () => {
    const nextIdx = (state.levelIdx + 1) % LEVELS.length;
    loadLevel(nextIdx);
  });

  // Modales de Teoría y Tienda
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
