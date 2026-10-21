/* ============================================================================
   MODULE SCRIPT: LOS 7 BIOMAS DETALLADOS Y 20 NIVELES DE CÁLCULO DIFERENCIAL
   ============================================================================ */

const BIOMES = [
  {
    id: "overworld",
    name: "Overworld (Bosque Real)",
    isLight: true,
    skyTop: "#2563eb",
    skyMid: "#60a5fa",
    skyBottom: "#dbeafe",
    fogColor: "rgba(191, 219, 254, 0.35)",
    farMtn: "#3b82f6",
    midMtn: "#1d4ed8",
    topBlock: "#22c55e",
    topLip: "#16a34a",
    midBlock: "#854d0e",
    deepBlock: "#475569",
    abyssBlock: "#1e293b",
    oreColor: "#38bdf8",
    sunColor: "#fde047",
    weatherType: "pollen"
  },
  {
    id: "llanuras",
    name: "Llanuras (Pradera Dorada)",
    isLight: true,
    skyTop: "#0284c7",
    skyMid: "#7dd3fc",
    skyBottom: "#fef9c3",
    fogColor: "rgba(254, 240, 138, 0.3)",
    farMtn: "#64748b",
    midMtn: "#475569",
    topBlock: "#84cc16",
    topLip: "#65a30d",
    midBlock: "#92400e",
    deepBlock: "#57534e",
    abyssBlock: "#292524",
    oreColor: "#facc15",
    sunColor: "#fef08a",
    weatherType: "pollen"
  },
  {
    id: "jungla",
    name: "Jungla Tropical",
    isLight: false,
    skyTop: "#064e3b",
    skyMid: "#047857",
    skyBottom: "#a7f3d0",
    fogColor: "rgba(16, 185, 129, 0.28)",
    farMtn: "#065f46",
    midMtn: "#022c22",
    topBlock: "#10b981",
    topLip: "#059669",
    midBlock: "#713f12",
    deepBlock: "#3f6212",
    abyssBlock: "#14532d",
    oreColor: "#4ade80",
    sunColor: "#fde047",
    weatherType: "fireflies"
  },
  {
    id: "cerezal",
    name: "Cerezal (Cherry Grove)",
    isLight: true,
    skyTop: "#db2777",
    skyMid: "#f472b6",
    skyBottom: "#fce7f3",
    fogColor: "rgba(251, 207, 232, 0.4)",
    farMtn: "#9d174d",
    midMtn: "#831843",
    topBlock: "#f472b6",
    topLip: "#db2777",
    midBlock: "#78350f",
    deepBlock: "#57534e",
    abyssBlock: "#27272a",
    oreColor: "#fb7185",
    sunColor: "#fff1f2",
    weatherType: "petals"
  },
  {
    id: "nether",
    name: "El Nether (Inframundo)",
    isLight: false,
    skyTop: "#2a0404",
    skyMid: "#6b0f0f",
    skyBottom: "#ea580c",
    fogColor: "rgba(234, 88, 12, 0.28)",
    farMtn: "#450a0a",
    midMtn: "#270505",
    topBlock: "#dc2626",
    topLip: "#991b1b",
    midBlock: "#7f1d1d",
    deepBlock: "#3f1d1d",
    abyssBlock: "#180909",
    oreColor: "#fbbf24",
    sunColor: "#f97316",
    weatherType: "embers"
  },
  {
    id: "end",
    name: "El End (Vacío Cósmico)",
    isLight: false,
    skyTop: "#05020a",
    skyMid: "#1e1035",
    skyBottom: "#3b0764",
    fogColor: "rgba(147, 51, 234, 0.22)",
    farMtn: "#2e1065",
    midMtn: "#170736",
    topBlock: "#fef08a",
    topLip: "#eab308",
    midBlock: "#ca8a04",
    deepBlock: "#a16207",
    abyssBlock: "#1e1b4b",
    oreColor: "#c084fc",
    sunColor: "#e879f9",
    weatherType: "ender"
  },
  {
    id: "the_shift",
    name: "The Shift (Dimensión Corrupta)",
    isLight: false,
    skyTop: "#020617",
    skyMid: "#0f172a",
    skyBottom: "#083344",
    fogColor: "rgba(6, 182, 212, 0.25)",
    farMtn: "#0e7490",
    midMtn: "#164e63",
    topBlock: "#06b6d4",
    topLip: "#0891b2",
    midBlock: "#0f172a",
    deepBlock: "#090d16",
    abyssBlock: "#020409",
    oreColor: "#f43f5e",
    sunColor: "#22d3ee",
    weatherType: "glitch"
  }
];

const SHOP_ITEMS = [
  {
    id: "laser",
    name: "🔦 Láser de Recta Tangente Extendida",
    desc: "Amplía el alcance del rayo láser f'(x) bajo los pies de Steve.",
    cost: 100,
    owned: false
  },
  {
    id: "concavity",
    name: "🔍 Escáner de Segunda Derivada f''(x)",
    desc: "Muestra la concavidad f''(x) en tiempo real dentro del HUD.",
    cost: 150,
    owned: false
  },
  {
    id: "gold_suit",
    name: "👑 Armadura de Netherita Encantada",
    desc: "Equipa a Steve con armadura brillante y otorga +20% esmeraldas.",
    cost: 200,
    owned: false
  }
];

const LEVELS = [
  {
    num: 1,
    name: "Colina del Tutorial",
    isBoss: false,
    eqText: "f(x) = -x² + 4x + 1",
    fn: (x) => -x * x + 4 * x + 1,
    df: (x) => -2 * x + 4,
    d2f: (x) => -2,
    critX: [2],
    q1: {
      prompt: "Paso 1: Calcula la primera derivada f'(x) aplicando la regla de la potencia.",
      correct: "f'(x) = -2x + 4",
      wrong: ["f'(x) = -x + 4", "f'(x) = 2x - 4", "f'(x) = -2x² + 4"],
      explain: "Derivamos término a término: la derivada de -x² es -2x, la de 4x es 4 y la de 1 es 0."
    },
    q2: {
      prompt: "Paso 2: Iguala f'(x) = 0 (-2x + 4 = 0) o lleva a Steve a la cima. ¿En qué x está el punto crítico?",
      correct: "x = 2",
      wrong: ["x = -2", "x = 4", "x = 0"],
      explain: "Despejamos: -2x + 4 = 0 ➔ -2x = -4 ➔ x = 2. ¡Camina con Steve a x = 2 y planta tu bandera!"
    },
    q3: {
      prompt: "Paso 3: Calcula f''(x). Como f''(x) = -2 (negativa), ¿qué tipo de punto es x = 2?",
      correct: "Máximo Local (Cima), porque f''(2) = -2 < 0",
      wrong: [
        "Mínimo Local (Valle), porque f''(2) < 0",
        "Punto de inflexión sin extremo",
        "Mínimo Local, porque x = 2 es positivo"
      ],
      explain: "Por el criterio de la segunda derivada: si f''(x) < 0 la curva se abre hacia abajo (∩), formando una Cima."
    }
  },
  {
    num: 2,
    name: "Valle de Cuarzo",
    isBoss: false,
    eqText: "f(x) = x² - 6x + 5",
    fn: (x) => x * x - 6 * x + 5,
    df: (x) => 2 * x - 6,
    d2f: (x) => 2,
    critX: [3],
    q1: {
      prompt: "Paso 1: Encuentra la primera derivada de f(x) = x² - 6x + 5.",
      correct: "f'(x) = 2x - 6",
      wrong: ["f'(x) = x - 6", "f'(x) = 2x + 5", "f'(x) = 2x² - 6"],
      explain: "La derivada de x² es 2x, la derivada de -6x es -6 y la de 5 es 0."
    },
    q2: {
      prompt: "Paso 2: Si igualamos 2x - 6 = 0, ¿cuál es el punto crítico?",
      correct: "x = 3",
      wrong: ["x = -3", "x = 6", "x = 2"],
      explain: "2x - 6 = 0 ➔ 2x = 6 ➔ x = 3."
    },
    q3: {
      prompt: "Paso 3: La segunda derivada es f''(x) = 2 (> 0). ¿Qué encontramos en x = 3?",
      correct: "Mínimo Local (Valle), porque f''(3) = 2 > 0",
      wrong: [
        "Máximo Local (Cima), porque f''(3) > 0",
        "Máximo Local, porque f(3) es positivo",
        "No existe extremo local"
      ],
      explain: "Cuando f''(x) > 0 la gráfica es cóncava hacia arriba (∪), garantizando un Valle."
    }
  },
  {
    num: 3,
    name: "Pico Simétrico",
    isBoss: false,
    eqText: "f(x) = -2x² + 8",
    fn: (x) => -2 * x * x + 8,
    df: (x) => -4 * x,
    d2f: (x) => -4,
    critX: [0],
    q1: {
      prompt: "Paso 1: ¿Cuál es la derivada de f(x) = -2x² + 8?",
      correct: "f'(x) = -4x",
      wrong: ["f'(x) = -2x + 8", "f'(x) = -4x + 8", "f'(x) = 4x"],
      explain: "Multiplicamos exponente por coeficiente: 2·(-2)x = -4x. La derivada de 8 es 0."
    },
    q2: {
      prompt: "Paso 2: Resuelve f'(x) = 0 (-4x = 0). ¿Dónde está el punto crítico?",
      correct: "x = 0",
      wrong: ["x = 4", "x = -4", "x = 2"],
      explain: "Cualquier número multiplicado por x que da 0 implica que x = 0."
    },
    q3: {
      prompt: "Paso 3: Con f''(x) = -4, clasifica el extremo en x = 0:",
      correct: "Máximo Local (Cima) con altura f(0) = 8",
      wrong: [
        "Mínimo Local (Valle) con altura f(0) = 8",
        "Mínimo Local porque x = 0",
        "Pendiente infinita"
      ],
      explain: "Como f''(0) = -4 < 0, es un Máximo Local situado en (0, 8)."
    }
  },
  {
    num: 4,
    name: "Fosa de Obsidiana",
    isBoss: false,
    eqText: "f(x) = 0.5x² + 2x - 1",
    fn: (x) => 0.5 * x * x + 2 * x - 1,
    df: (x) => x + 2,
    d2f: (x) => 1,
    critX: [-2],
    q1: {
      prompt: "Paso 1: Deriva la función f(x) = 0.5x² + 2x - 1.",
      correct: "f'(x) = x + 2",
      wrong: ["f'(x) = 0.5x + 2", "f'(x) = 2x + 2", "f'(x) = x - 1"],
      explain: "2 por 0.5 es 1, quedando x + 2."
    },
    q2: {
      prompt: "Paso 2: Iguala x + 2 = 0. ¿Cuál es la coordenada x crítica?",
      correct: "x = -2",
      wrong: ["x = 2", "x = 0.5", "x = -1"],
      explain: "Pasamos el +2 restando al otro lado: x = -2."
    },
    q3: {
      prompt: "Paso 3: Evalúa f''(x) = 1. ¿Qué representa x = -2?",
      correct: "Mínimo Local (Valle), ya que f''(-2) = 1 > 0",
      wrong: [
        "Máximo Local (Cima), ya que x es negativo",
        "Máximo Local, porque f''(-2) > 0",
        "No tiene concavidad"
      ],
      explain: "El signo positivo de f''(x) = 1 confirma concavidad hacia arriba (Valle)."
    }
  },
  {
    num: 5,
    name: "Domo de Esmeralda",
    isBoss: false,
    eqText: "f(x) = -x² - 4x + 2",
    fn: (x) => -x * x - 4 * x + 2,
    df: (x) => -2 * x - 4,
    d2f: (x) => -2,
    critX: [-2],
    q1: {
      prompt: "Paso 1: Obtén la primera derivada f'(x) de f(x) = -x² - 4x + 2.",
      correct: "f'(x) = -2x - 4",
      wrong: ["f'(x) = -2x + 4", "f'(x) = 2x - 4", "f'(x) = -x - 4"],
      explain: "Derivada de -x² es -2x; derivada de -4x es -4."
    },
    q2: {
      prompt: "Paso 2: Resuelve -2x - 4 = 0 para hallar el punto crítico.",
      correct: "x = -2",
      wrong: ["x = 2", "x = -4", "x = 4"],
      explain: "-2x = 4 ➔ x = 4 / (-2) = -2."
    },
    q3: {
      prompt: "Paso 3: Si f''(x) = -2, el punto x = -2 es un:",
      correct: "Máximo Local (Cima), pues f''(-2) < 0",
      wrong: [
        "Mínimo Local (Valle), pues x = -2 < 0",
        "Mínimo Local, pues f''(-2) = -2",
        "Punto plano sin curvatura"
      ],
      explain: "El signo de f''(x) es negativo (-2), por lo tanto es una Cima."
    }
  },
  {
    num: 6,
    name: "Cordillera Cúbica I",
    isBoss: false,
    eqText: "f(x) = (1/3)x³ - x",
    fn: (x) => (1 / 3) * Math.pow(x, 3) - x,
    df: (x) => x * x - 1,
    d2f: (x) => 2 * x,
    critX: [-1, 1],
    q1: {
      prompt: "Paso 1: Deriva la función cúbica f(x) = (1/3)x³ - x.",
      correct: "f'(x) = x² - 1",
      wrong: ["f'(x) = 3x² - 1", "f'(x) = (1/3)x² - 1", "f'(x) = x²"],
      explain: "Al bajar el exponente 3: 3·(1/3)x² = x², y la derivada de -x es -1."
    },
    q2: {
      prompt: "Paso 2: Iguala x² - 1 = 0. ¿Cuáles son los DOS puntos críticos?",
      correct: "x = -1 y x = 1",
      wrong: ["x = 0 y x = 1", "Solo x = 1", "x = -2 y x = 2"],
      explain: "x² = 1 tiene dos soluciones reales: x = -1 y x = 1."
    },
    q3: {
      prompt: "Paso 3: Con f''(x) = 2x, ¿cuál es la Cima y cuál es el Valle?",
      correct: "Cima en x = -1 (f''(-1) = -2 < 0) y Valle en x = 1 (f''(1) = 2 > 0)",
      wrong: [
        "Cima en x = 1 y Valle en x = -1",
        "Ambos son Máximos Locales",
        "Ambos son Mínimos Locales"
      ],
      explain: "Sustituimos en f''(x)=2x: en x=-1 da -2 (Máximo) y en x=1 da +2 (Mínimo)."
    }
  },
  {
    num: 7,
    name: "Cordillera Cúbica II",
    isBoss: false,
    eqText: "f(x) = -(1/3)x³ + 4x",
    fn: (x) => -(1 / 3) * Math.pow(x, 3) + 4 * x,
    df: (x) => -x * x + 4,
    d2f: (x) => -2 * x,
    critX: [-2, 2],
    q1: {
      prompt: "Paso 1: Halla la primera derivada de f(x) = -(1/3)x³ + 4x.",
      correct: "f'(x) = -x² + 4",
      wrong: ["f'(x) = x² + 4", "f'(x) = -3x² + 4", "f'(x) = -x² - 4"],
      explain: "3 por -(1/3) es -1, por lo que queda -x² + 4."
    },
    q2: {
      prompt: "Paso 2: Resuelve -x² + 4 = 0 para encontrar los puntos críticos.",
      correct: "x = -2 y x = 2",
      wrong: ["x = 0 y x = 4", "x = -4 y x = 4", "Solo x = 2"],
      explain: "x² = 4 ➔ x = ±2."
    },
    q3: {
      prompt: "Paso 3: Sabiendo que f''(x) = -2x, clasifica x = -2 y x = 2:",
      correct: "Valle en x = -2 (f''(-2) = 4 > 0) y Cima en x = 2 (f''(2) = -4 < 0)",
      wrong: [
        "Cima en x = -2 y Valle en x = 2",
        "Dos Cimas simétricas",
        "Ninguno es extremo local"
      ],
      explain: "En x = -2, f''(-2) = +4 > 0 (Valle). En x = 2, f''(2) = -4 < 0 (Cima)."
    }
  },
  {
    num: 8,
    name: "Doble Cañón de Redstone",
    isBoss: false,
    eqText: "f(x) = (1/3)x³ - x² - 3x + 2",
    fn: (x) => (1 / 3) * Math.pow(x, 3) - x * x - 3 * x + 2,
    df: (x) => x * x - 2 * x - 3,
    d2f: (x) => 2 * x - 2,
    critX: [-1, 3],
    q1: {
      prompt: "Paso 1: Calcula la derivada f'(x) de f(x) = (1/3)x³ - x² - 3x + 2.",
      correct: "f'(x) = x² - 2x - 3",
      wrong: ["f'(x) = 3x² - 2x - 3", "f'(x) = x² + 2x - 3", "f'(x) = x² - 3"],
      explain: "Derivamos cada término: x² - 2x - 3."
    },
    q2: {
      prompt: "Paso 2: Factoriza x² - 2x - 3 = (x - 3)(x + 1) = 0. ¿Cuáles son las raíces?",
      correct: "x = -1 y x = 3",
      wrong: ["x = 1 y x = -3", "x = 0 y x = 3", "x = -2 y x = 3"],
      explain: "Igualando cada factor a cero: x = 3 y x = -1."
    },
    q3: {
      prompt: "Paso 3: Evalúa en f''(x) = 2x - 2 ambos puntos críticos:",
      correct: "Máximo en x = -1 (f''(-1) = -4) y Mínimo en x = 3 (f''(3) = 4)",
      wrong: [
        "Mínimo en x = -1 y Máximo en x = 3",
        "Máximo en ambos puntos",
        "Mínimo en ambos puntos"
      ],
      explain: "f''(-1) = -4 < 0 (Máximo Local) y f''(3) = 4 > 0 (Mínimo Local)."
    }
  },
  {
    num: 9,
    name: "Meseta de Basalto",
    isBoss: false,
    eqText: "f(x) = (1/3)x³ + x² - 3x",
    fn: (x) => (1 / 3) * Math.pow(x, 3) + x * x - 3 * x,
    df: (x) => x * x + 2 * x - 3,
    d2f: (x) => 2 * x + 2,
    critX: [-3, 1],
    q1: {
      prompt: "Paso 1: Deriva la función f(x) = (1/3)x³ + x² - 3x.",
      correct: "f'(x) = x² + 2x - 3",
      wrong: ["f'(x) = x² - 2x - 3", "f'(x) = 3x² + 2x - 3", "f'(x) = x² + 2x"],
      explain: "Baja el 3 multiplicando a 1/3 (queda x²), el x² pasa a 2x y -3x pasa a -3."
    },
    q2: {
      prompt: "Paso 2: Resuelve x² + 2x - 3 = (x + 3)(x - 1) = 0.",
      correct: "x = -3 y x = 1",
      wrong: ["x = 3 y x = -1", "x = -3 y x = 0", "x = 1 y x = 3"],
      explain: "De (x + 3)(x - 1) = 0 obtenemos x = -3 y x = 1."
    },
    q3: {
      prompt: "Paso 3: Con f''(x) = 2x + 2, determina dónde está la Cima y el Valle:",
      correct: "Cima en x = -3 (f''(-3) = -4 < 0) y Valle en x = 1 (f''(1) = 4 > 0)",
      wrong: [
        "Valle en x = -3 y Cima en x = 1",
        "Cima en x = 0 y Valle en x = 1",
        "No existen extremos reales"
      ],
      explain: "En x = -3 la segunda derivada es negativa (Cima); en x = 1 es positiva (Valle)."
    }
  },
  {
    num: 10,
    name: "🔥 JEFE NIVEL 10: Fortaleza del Wither",
    isBoss: true,
    eqText: "f(x) = 0.25x³ - 0.75x² - 2.25x + 2",
    fn: (x) => 0.25 * Math.pow(x, 3) - 0.75 * x * x - 2.25 * x + 2,
    df: (x) => 0.75 * x * x - 1.5 * x - 2.25,
    d2f: (x) => 1.5 * x - 1.5,
    critX: [-1, 3],
    q1: {
      prompt: "⚔️ JEFE FASE 1: Calcula f'(x) de f(x) = 0.25x³ - 0.75x² - 2.25x + 2.",
      correct: "f'(x) = 0.75x² - 1.5x - 2.25",
      wrong: [
        "f'(x) = 0.75x² - 0.75x - 2.25",
        "f'(x) = 0.25x² - 1.5x - 2.25",
        "f'(x) = 1.5x² - 1.5x - 2"
      ],
      explain: "Multiplicamos: 3(0.25) = 0.75x²; 2(-0.75) = -1.5x; y la derivada de -2.25x es -2.25."
    },
    q2: {
      prompt: "⚔️ JEFE FASE 2: Divide f'(x) = 0 entre 0.75 para obtener x² - 2x - 3 = 0. ¿Cuáles son sus puntos críticos?",
      correct: "x = -1 y x = 3",
      wrong: ["x = 1 y x = -3", "x = -2 y x = 2", "x = 0 y x = 3"],
      explain: "Al dividir entre 0.75 queda x² - 2x - 3 = (x - 3)(x + 1) = 0 ➔ x = -1 y x = 3."
    },
    q3: {
      prompt: "⚔️ JEFE FASE 3: Evalúa la segunda derivada f''(x) = 1.5x - 1.5 y derrota al Wither:",
      correct: "Cima en x = -1 (f''(-1) = -3 < 0) y Valle en x = 3 (f''(3) = +3 > 0)",
      wrong: [
        "Valle en x = -1 y Cima en x = 3",
        "Cima en x = 3 con f''(3) = -3",
        "Punto de inflexión en x = -1 y x = 3"
      ],
      explain: "¡Wither derrotado! En x = -1 la concavidad es negativa (-3, Máximo) y en x = 3 es positiva (+3, Mínimo)."
    }
  },
  {
    num: 11,
    name: "Ladera de Lapislázuli",
    isBoss: false,
    eqText: "f(x) = -0.5x² + 3x - 1",
    fn: (x) => -0.5 * x * x + 3 * x - 1,
    df: (x) => -x + 3,
    d2f: (x) => -1,
    critX: [3],
    q1: {
      prompt: "Paso 1: Obtén la primera derivada de f(x) = -0.5x² + 3x - 1.",
      correct: "f'(x) = -x + 3",
      wrong: ["f'(x) = -0.5x + 3", "f'(x) = x + 3", "f'(x) = -2x + 3"],
      explain: "2 por -0.5 da -1x, más la derivada de 3x que es 3."
    },
    q2: {
      prompt: "Paso 2: Si -x + 3 = 0, ¿cuál es el punto crítico?",
      correct: "x = 3",
      wrong: ["x = -3", "x = 0", "x = 1"],
      explain: "-x + 3 = 0 ➔ x = 3."
    },
    q3: {
      prompt: "Paso 3: Como f''(x) = -1 < 0, en x = 3 tenemos:",
      correct: "Máximo Local (Cima)",
      wrong: ["Mínimo Local (Valle)", "Pendiente vertical", "Concavidad positiva"],
      explain: "Segunda derivada negativa siempre indica un Máximo Local."
    }
  },
  {
    num: 12,
    name: "Cuenca de Amatista",
    isBoss: false,
    eqText: "f(x) = 0.5x² - x - 2",
    fn: (x) => 0.5 * x * x - x - 2,
    df: (x) => x - 1,
    d2f: (x) => 1,
    critX: [1],
    q1: {
      prompt: "Paso 1: Calcula f'(x) para f(x) = 0.5x² - x - 2.",
      correct: "f'(x) = x - 1",
      wrong: ["f'(x) = 0.5x - 1", "f'(x) = x - 2", "f'(x) = 2x - 1"],
      explain: "La derivada de 0.5x² es x y la de -x es -1."
    },
    q2: {
      prompt: "Paso 2: Iguala x - 1 = 0:",
      correct: "x = 1",
      wrong: ["x = -1", "x = 2", "x = 0"],
      explain: "x - 1 = 0 ➔ x = 1."
    },
    q3: {
      prompt: "Paso 3: Con f''(x) = 1 > 0, el punto x = 1 es:",
      correct: "Mínimo Local (Valle)",
      wrong: ["Máximo Local (Cima)", "Asíntota", "Punto sin concavidad"],
      explain: "f''(1) = 1 > 0 demuestra que es un Valle."
    }
  },
  {
    num: 13,
    name: "Paso de los Golems",
    isBoss: false,
    eqText: "f(x) = (1/3)x³ - 2x² + 3x + 1",
    fn: (x) => (1 / 3) * Math.pow(x, 3) - 2 * x * x + 3 * x + 1,
    df: (x) => x * x - 4 * x + 3,
    d2f: (x) => 2 * x - 4,
    critX: [1, 3],
    q1: {
      prompt: "Paso 1: Deriva f(x) = (1/3)x³ - 2x² + 3x + 1.",
      correct: "f'(x) = x² - 4x + 3",
      wrong: ["f'(x) = x² - 2x + 3", "f'(x) = 3x² - 4x + 3", "f'(x) = x² + 4x + 3"],
      explain: "Derivando término a término: x² - 4x + 3."
    },
    q2: {
      prompt: "Paso 2: Factoriza x² - 4x + 3 = (x - 1)(x - 3) = 0:",
      correct: "x = 1 y x = 3",
      wrong: ["x = -1 y x = -3", "x = 1 y x = 4", "x = 0 y x = 3"],
      explain: "Raíces en x = 1 y x = 3."
    },
    q3: {
      prompt: "Paso 3: Evalúa en f''(x) = 2x - 4:",
      correct: "Cima en x = 1 (f''(1) = -2 < 0) y Valle en x = 3 (f''(3) = 2 > 0)",
      wrong: [
        "Valle en x = 1 y Cima en x = 3",
        "Dos Valles consecutivos",
        "Dos Cimas consecutivas"
      ],
      explain: "En x = 1 da -2 (Cima) y en x = 3 da +2 (Valle)."
    }
  },
  {
    num: 14,
    name: "Barranco de Espeleotema",
    isBoss: false,
    eqText: "f(x) = (1/3)x³ + 2x² + 3x + 2",
    fn: (x) => (1 / 3) * Math.pow(x, 3) + 2 * x * x + 3 * x + 2,
    df: (x) => x * x + 4 * x + 3,
    d2f: (x) => 2 * x + 4,
    critX: [-3, -1],
    q1: {
      prompt: "Paso 1: Halla la derivada de f(x) = (1/3)x³ + 2x² + 3x + 2.",
      correct: "f'(x) = x² + 4x + 3",
      wrong: ["f'(x) = x² - 4x + 3", "f'(x) = 3x² + 4x + 3", "f'(x) = x² + 2x + 3"],
      explain: "Regla de la potencia: x² + 4x + 3."
    },
    q2: {
      prompt: "Paso 2: Resuelve (x + 3)(x + 1) = 0:",
      correct: "x = -3 y x = -1",
      wrong: ["x = 3 y x = 1", "x = -3 y x = 1", "x = -4 y x = -1"],
      explain: "Igualando cada factor a 0 obtenemos x = -3 y x = -1."
    },
    q3: {
      prompt: "Paso 3: Sustituye en f''(x) = 2x + 4:",
      correct: "Cima en x = -3 (f''(-3) = -2 < 0) y Valle en x = -1 (f''(-1) = 2 > 0)",
      wrong: [
        "Valle en x = -3 y Cima en x = -1",
        "Ambos son puntos de inflexión",
        "Ambos son Cimas"
      ],
      explain: "f''(-3) = -2 < 0 (Cima); f''(-1) = +2 > 0 (Valle)."
    }
  },
  {
    num: 15,
    name: "Silla de Montar (Punto de Inflexión)",
    isBoss: false,
    eqText: "f(x) = 0.25x³ + 1",
    fn: (x) => 0.25 * Math.pow(x, 3) + 1,
    df: (x) => 0.75 * x * x,
    d2f: (x) => 1.5 * x,
    critX: [0],
    q1: {
      prompt: "Paso 1: Calcula la primera derivada de f(x) = 0.25x³ + 1.",
      correct: "f'(x) = 0.75x²",
      wrong: ["f'(x) = 0.25x²", "f'(x) = 0.75x² + 1", "f'(x) = 1.5x"],
      explain: "3 por 0.25 es 0.75x²."
    },
    q2: {
      prompt: "Paso 2: Si 0.75x² = 0, ¿cuál es el único punto donde la pendiente vale 0?",
      correct: "x = 0",
      wrong: ["x = 0.75", "x = -1 y x = 1", "x = 1"],
      explain: "0.75x² = 0 solo se cumple en x = 0."
    },
    q3: {
      prompt: "Paso 3: En x = 0 la pendiente f'(x) no cambia de signo y f''(0) = 0. ¿Qué es x = 0?",
      correct: "Punto de Inflexión (descanso horizontal, ni Máximo ni Mínimo)",
      wrong: ["Máximo Absoluto", "Mínimo Absoluto", "Asíntota vertical"],
      explain: "Si la pendiente no cambia de signo al cruzar f'(x)=0, es un Punto de Inflexión."
    }
  },
  {
    num: 16,
    name: "Cráter Cuártico",
    isBoss: false,
    eqText: "f(x) = 0.1x⁴ - 0.8x² + 2",
    fn: (x) => 0.1 * Math.pow(x, 4) - 0.8 * x * x + 2,
    df: (x) => 0.4 * Math.pow(x, 3) - 1.6 * x,
    d2f: (x) => 1.2 * x * x - 1.6,
    critX: [-2, 0, 2],
    q1: {
      prompt: "Paso 1: Deriva el polinomio de grado 4: f(x) = 0.1x⁴ - 0.8x² + 2.",
      correct: "f'(x) = 0.4x³ - 1.6x",
      wrong: ["f'(x) = 0.4x³ - 0.8x", "f'(x) = 0.1x³ - 1.6x", "f'(x) = 4x³ - 1.6x"],
      explain: "4(0.1)x³ = 0.4x³ y 2(-0.8)x = -1.6x."
    },
    q2: {
      prompt: "Paso 2: Factoriza 0.4x(x² - 4) = 0. ¿Cuáles son los TRES puntos críticos?",
      correct: "x = -2, x = 0 y x = 2",
      wrong: ["Solo x = -2 y x = 2", "x = -4, x = 0 y x = 4", "x = -1, x = 0 y x = 1"],
      explain: "El factor x da x = 0, y x² - 4 = 0 da x = -2 y x = 2."
    },
    q3: {
      prompt: "Paso 3: Evalúa en f''(x) = 1.2x² - 1.6 cada uno de los tres puntos:",
      correct: "Cima central en x = 0 (f''(0) < 0) y dos Valles en x = -2 y x = 2 (f'' > 0)",
      wrong: [
        "Valle central en x = 0 y dos Cimas en x = ±2",
        "Tres Mínimos Locales",
        "Tres Máximos Locales"
      ],
      explain: "En x = 0, f''(0) = -1.6 < 0 (Cima). En x = ±2, f''(±2) = +3.2 > 0 (Valles)."
    }
  },
  {
    num: 17,
    name: "Corona de Dos Picos (Grado 4)",
    isBoss: false,
    eqText: "f(x) = -0.1x⁴ + 0.8x² + 1",
    fn: (x) => -0.1 * Math.pow(x, 4) + 0.8 * x * x + 1,
    df: (x) => -0.4 * Math.pow(x, 3) + 1.6 * x,
    d2f: (x) => -1.2 * x * x + 1.6,
    critX: [-2, 0, 2],
    q1: {
      prompt: "Paso 1: Calcula f'(x) de f(x) = -0.1x⁴ + 0.8x² + 1.",
      correct: "f'(x) = -0.4x³ + 1.6x",
      wrong: ["f'(x) = 0.4x³ - 1.6x", "f'(x) = -0.4x³ + 0.8x", "f'(x) = -0.1x³ + 1.6x"],
      explain: "Multiplicamos los exponentes: -0.4x³ + 1.6x."
    },
    q2: {
      prompt: "Paso 2: Iguala -0.4x(x² - 4) = 0 para hallar los tres puntos críticos:",
      correct: "x = -2, x = 0 y x = 2",
      wrong: ["x = -4, x = 0 y x = 4", "Solo x = 0", "x = -2 y x = 2 únicamente"],
      explain: "Las raíces del polinomio cúbico son x = -2, x = 0 y x = 2."
    },
    q3: {
      prompt: "Paso 3: Con f''(x) = -1.2x² + 1.6, identifica Cimas y Valles:",
      correct: "Dos Cimas en x = -2 y x = 2 (f'' < 0) y un Valle en x = 0 (f''(0) = 1.6 > 0)",
      wrong: [
        "Una Cima en x = 0 y dos Valles en x = ±2",
        "Tres Cimas iguales",
        "No hay extremos locales"
      ],
      explain: "En x = 0 da +1.6 > 0 (Valle central) y en x = ±2 da -3.2 < 0 (dos Cimas)."
    }
  },
  {
    num: 18,
    name: "Templo del Desierto",
    isBoss: false,
    eqText: "f(x) = -0.25x³ + 0.75x² + 2.25x - 1",
    fn: (x) => -0.25 * Math.pow(x, 3) + 0.75 * x * x + 2.25 * x - 1,
    df: (x) => -0.75 * x * x + 1.5 * x + 2.25,
    d2f: (x) => -1.5 * x + 1.5,
    critX: [-1, 3],
    q1: {
      prompt: "Paso 1: Deriva f(x) = -0.25x³ + 0.75x² + 2.25x - 1.",
      correct: "f'(x) = -0.75x² + 1.5x + 2.25",
      wrong: [
        "f'(x) = 0.75x² - 1.5x - 2.25",
        "f'(x) = -0.75x² + 0.75x + 2.25",
        "f'(x) = -0.25x² + 1.5x"
      ],
      explain: "Regla de la potencia en cada término: -0.75x² + 1.5x + 2.25."
    },
    q2: {
      prompt: "Paso 2: Al dividir f'(x) = 0 entre -0.75 queda x² - 2x - 3 = 0. Sus raíces son:",
      correct: "x = -1 y x = 3",
      wrong: ["x = 1 y x = -3", "x = -2 y x = 3", "x = 0 y x = 2"],
      explain: "(x - 3)(x + 1) = 0 ➔ x = -1 y x = 3."
    },
    q3: {
      prompt: "Paso 3: Evalúa en f''(x) = -1.5x + 1.5:",
      correct: "Valle en x = -1 (f''(-1) = 3 > 0) y Cima en x = 3 (f''(3) = -3 < 0)",
      wrong: [
        "Cima en x = -1 y Valle en x = 3",
        "Dos Cimas en x = -1 y x = 3",
        "Dos Valles en x = -1 y x = 3"
      ],
      explain: "En x = -1 la segunda derivada es positiva (+3, Valle) y en x = 3 es negativa (-3, Cima)."
    }
  },
  {
    num: 19,
    name: "Bastión de Netherita",
    isBoss: false,
    eqText: "f(x) = 0.5x³ - 1.5x + 2",
    fn: (x) => 0.5 * Math.pow(x, 3) - 1.5 * x + 2,
    df: (x) => 1.5 * x * x - 1.5,
    d2f: (x) => 3 * x,
    critX: [-1, 1],
    q1: {
      prompt: "Paso 1: Obtén la primera derivada de f(x) = 0.5x³ - 1.5x + 2.",
      correct: "f'(x) = 1.5x² - 1.5",
      wrong: ["f'(x) = 0.5x² - 1.5", "f'(x) = 1.5x² + 2", "f'(x) = 3x² - 1.5"],
      explain: "3(0.5)x² = 1.5x² y la derivada de -1.5x es -1.5."
    },
    q2: {
      prompt: "Paso 2: Si 1.5(x² - 1) = 0, ¿cuáles son los puntos críticos?",
      correct: "x = -1 y x = 1",
      wrong: ["x = -1.5 y x = 1.5", "Solo x = 1", "x = 0 y x = 1"],
      explain: "x² = 1 ➔ x = -1 y x = 1."
    },
    q3: {
      prompt: "Paso 3: Evalúa en f''(x) = 3x:",
      correct: "Cima en x = -1 (f''(-1) = -3 < 0) y Valle en x = 1 (f''(1) = 3 > 0)",
      wrong: [
        "Valle en x = -1 y Cima en x = 1",
        "Inflexión en ambos puntos",
        "Cima en ambos puntos"
      ],
      explain: "f''(-1) = -3 < 0 (Máximo Local) y f''(1) = 3 > 0 (Mínimo Local)."
    }
  },
  {
    num: 20,
    name: "🐉 JEFE FINAL NIVEL 20: Cumbre del Ender Dragon",
    isBoss: true,
    eqText: "f(x) = 0.05x⁴ - 0.45x² + 2.5",
    fn: (x) => 0.05 * Math.pow(x, 4) - 0.45 * x * x + 2.5,
    df: (x) => 0.2 * Math.pow(x, 3) - 0.9 * x,
    d2f: (x) => 0.6 * x * x - 0.9,
    critX: [-2.1, 0, 2.1],
    q1: {
      prompt: "🐉 JEFE FINAL FASE 1: Deriva la función del Ender Dragon f(x) = 0.05x⁴ - 0.45x² + 2.5.",
      correct: "f'(x) = 0.2x³ - 0.9x",
      wrong: [
        "f'(x) = 0.2x³ - 0.45x",
        "f'(x) = 0.05x³ - 0.9x",
        "f'(x) = 0.4x³ - 0.9x²"
      ],
      explain: "Multiplicamos: 4(0.05)x³ = 0.2x³ y 2(-0.45)x = -0.9x."
    },
    q2: {
      prompt: "🐉 JEFE FINAL FASE 2: Factoriza 0.2x(x² - 4.5) = 0 para hallar los puntos críticos:",
      correct: "Tres puntos críticos: x = 0 y dos simétricos en x ≈ ±2.12 (raíz de 4.5)",
      wrong: [
        "Solo existe un punto crítico en x = 0",
        "Dos puntos críticos en x = -9 y x = 9",
        "No tiene raíces reales"
      ],
      explain: "De 0.2x(x² - 4.5) = 0 obtenemos x = 0 y x² = 4.5 ➔ x ≈ -2.12 y x ≈ +2.12."
    },
    q3: {
      prompt: "🐉 JEFE FINAL FASE 3: Evalúa la segunda derivada f''(x) = 0.6x² - 0.9 para conquistar el juego:",
      correct: "Cima central en x = 0 (f''(0) = -0.9 < 0) y dos Valles simétricos en x ≈ ±2.12 (f'' = +1.8 > 0)",
      wrong: [
        "Valle central en x = 0 y dos Cimas en x ≈ ±2.12",
        "Tres Máximos Locales idénticos",
        "Criterio no concluyente en los tres puntos"
      ],
      explain: "🏆 ¡HAS VENCIDO AL ENDER DRAGON Y DOMINADO CÁLCULO DIFERENCIAL! En x = 0 hay un Máximo Local y en x ≈ ±2.12 hay dos Mínimos Locales."
    }
  }
];
