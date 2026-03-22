const DIMENSION_LABELS = {
  S: "社交启动",
  R: "独处回血",
  E: "环境感知",
  P: "行动节奏",
  M: "情绪表达",
  B: "边界模式"
};

const WEIGHTS = { S: 1, R: 1, E: 1.1, P: 1, M: 0.8, B: 0.9 };

const state = {
  questions: [],
  resultsData: null,
  currentIndex: 0,
  answers: []
};

const els = {
  loading: document.getElementById("loadingScreen"),
  start: document.getElementById("startScreen"),
  quiz: document.getElementById("quizScreen"),
  result: document.getElementById("resultScreen"),
  startBtn: document.getElementById("startBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  copyBtn: document.getElementById("copyBtn"),
  questionIndex: document.getElementById("questionIndex"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  progressText: document.getElementById("progressText"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  resultEmoji: document.getElementById("resultEmoji"),
  resultName: document.getElementById("resultName"),
  resultFlavor: document.getElementById("resultFlavor"),
  resultSubtitle: document.getElementById("resultSubtitle"),
  resultDescription: document.getElementById("resultDescription"),
  keywordChips: document.getElementById("keywordChips"),
  strengthList: document.getElementById("strengthList"),
  tipList: document.getElementById("tipList"),
  dimensionBars: document.getElementById("dimensionBars"),
  flavorName: document.getElementById("flavorName"),
  flavorDescription: document.getElementById("flavorDescription")
};

async function loadData() {
  try {
    const [questionsRes, resultsRes] = await Promise.all([
      fetch("./questions.json"),
      fetch("./results.json")
    ]);

    if (!questionsRes.ok || !resultsRes.ok) {
      throw new Error("数据文件读取失败");
    }

    state.questions = await questionsRes.json();
    state.resultsData = await resultsRes.json();
    state.answers = new Array(state.questions.length).fill(null);

    showScreen("start");
  } catch (error) {
    els.loading.innerHTML = `
      <div class="notice" style="margin-top:0">
        <strong>页面初始化失败。</strong><br />
        如果你是直接双击打开本地 HTML，浏览器可能会拦截 JSON 读取。<br />
        直接把整个文件夹上传到 GitHub Pages 或 Vercel，页面就能正常运行。
      </div>
    `;
    console.error(error);
  }
}

function showScreen(name) {
  [els.loading, els.start, els.quiz, els.result].forEach((section) => {
    section.classList.add("hidden");
    section.classList.remove("active");
  });

  const screenMap = {
    loading: els.loading,
    start: els.start,
    quiz: els.quiz,
    result: els.result
  };

  screenMap[name].classList.remove("hidden");
  screenMap[name].classList.add("active");
}

function startQuiz() {
  state.currentIndex = 0;
  state.answers = new Array(state.questions.length).fill(null);
  renderQuestion();
  showScreen("quiz");
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  const answerIndex = state.answers[state.currentIndex];
  const total = state.questions.length;
  const progress = Math.round(((state.currentIndex + 1) / total) * 100);

  els.questionIndex.textContent = `Question ${state.currentIndex + 1}`;
  els.questionText.textContent = question.question;
  els.progressText.textContent = `第 ${state.currentIndex + 1} / ${total} 题`;
  els.progressPercent.textContent = `${progress}%`;
  els.progressFill.style.width = `${progress}%`;
  els.prevBtn.disabled = state.currentIndex === 0;
  els.nextBtn.disabled = answerIndex === null;
  els.nextBtn.textContent = state.currentIndex === total - 1 ? "查看结果" : "下一题";

  els.optionsList.innerHTML = "";
  question.options.forEach((option, optionIndex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = option.text;

    if (answerIndex === optionIndex) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      state.answers[state.currentIndex] = optionIndex;
      renderQuestion();
    });

    els.optionsList.appendChild(btn);
  });
}

function goNext() {
  if (state.answers[state.currentIndex] === null) return;

  if (state.currentIndex === state.questions.length - 1) {
    renderResult();
    showScreen("result");
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function goPrev() {
  if (state.currentIndex === 0) return;
  state.currentIndex -= 1;
  renderQuestion();
}

function computeMaxScores(questions) {
  const maxScores = { S: 0, R: 0, E: 0, P: 0, M: 0, B: 0 };

  questions.forEach((question) => {
    Object.keys(maxScores).forEach((dimension) => {
      const localMax = question.options.reduce((best, option) => {
        return Math.max(best, option.scores?.[dimension] || 0);
      }, 0);
      maxScores[dimension] += localMax;
    });
  });

  return maxScores;
}

function computeProfile() {
  const totals = { S: 0, R: 0, E: 0, P: 0, M: 0, B: 0 };

  state.questions.forEach((question, qIndex) => {
    const chosenIndex = state.answers[qIndex];
    const chosenOption = question.options[chosenIndex];
    if (!chosenOption) return;

    Object.entries(chosenOption.scores || {}).forEach(([dimension, value]) => {
      totals[dimension] += value;
    });
  });

  const maxScores = computeMaxScores(state.questions);
  const normalized = {};

  Object.keys(totals).forEach((dimension) => {
    normalized[dimension] = maxScores[dimension]
      ? Math.round((totals[dimension] / maxScores[dimension]) * 100)
      : 0;
  });

  return { totals, normalized };
}

function pickArchetype(normalized) {
  let best = null;

  state.resultsData.archetypes.forEach((archetype) => {
    let distance = 0;

    Object.keys(DIMENSION_LABELS).forEach((dimension) => {
      const diff = normalized[dimension] - archetype.vector[dimension];
      distance += Math.pow(diff, 2) * (WEIGHTS[dimension] || 1);
    });

    if (!best || distance < best.distance) {
      best = { archetype, distance };
    }
  });

  return best.archetype;
}

function pickFlavor(normalized) {
  const flavors = Object.fromEntries(
    state.resultsData.flavors.map((item) => [item.id, item])
  );

  if (normalized.E >= 78) return flavors.high_sensitive;
  if (normalized.B >= 72 && normalized.S <= 42) return flavors.slow_warm;
  if (normalized.R >= 68 && normalized.S <= 45 && normalized.E >= 55) return flavors.night_mode;
  if (normalized.S >= 68 && normalized.M >= 60) return flavors.outgoing;

  const fallbackOrder = [
    { id: "high_sensitive", score: normalized.E },
    { id: "slow_warm", score: normalized.B + (100 - normalized.S) },
    { id: "night_mode", score: normalized.R + normalized.E },
    { id: "outgoing", score: normalized.S + normalized.M }
  ].sort((a, b) => b.score - a.score);

  return flavors[fallbackOrder[0].id];
}

function buildSummaryText(archetype, flavor, normalized) {
  const dominant = Object.entries(normalized)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dimension]) => DIMENSION_LABELS[dimension])
    .join("、");

  return `我测出来是「${archetype.name}｜${flavor.name}」。\n${archetype.subtitle}\n主导维度：${dominant}。`;
}

function renderResult() {
  const { normalized } = computeProfile();
  const archetype = pickArchetype(normalized);
  const flavor = pickFlavor(normalized);

  els.resultEmoji.textContent = archetype.emoji;
  els.resultName.textContent = archetype.name;
  els.resultFlavor.textContent = flavor.name;
  els.resultSubtitle.textContent = archetype.subtitle;
  els.resultDescription.textContent = archetype.description;
  els.flavorName.textContent = `${flavor.name}：`;
  els.flavorDescription.textContent = flavor.description;

  els.keywordChips.innerHTML = archetype.keywords
    .map((keyword) => `<span class="chip">${keyword}</span>`)
    .join("");

  els.strengthList.innerHTML = archetype.strengths
    .map((item) => `<li>${item}</li>`)
    .join("");

  els.tipList.innerHTML = archetype.tips
    .map((item) => `<li>${item}</li>`)
    .join("");

  els.dimensionBars.innerHTML = Object.entries(normalized)
    .map(([dimension, score]) => {
      return `
        <div class="dimension-row">
          <div class="dimension-head">
            <span>${DIMENSION_LABELS[dimension]}</span>
            <span>${score}</span>
          </div>
          <div class="dimension-track">
            <div class="dimension-fill" style="width:${score}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const summaryText = buildSummaryText(archetype, flavor, normalized);
  els.copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      els.copyBtn.textContent = "已复制";
      setTimeout(() => {
        els.copyBtn.textContent = "复制结果文案";
      }, 1600);
    } catch {
      els.copyBtn.textContent = "复制失败";
      setTimeout(() => {
        els.copyBtn.textContent = "复制结果文案";
      }, 1600);
    }
  };
}

els.startBtn.addEventListener("click", startQuiz);
els.prevBtn.addEventListener("click", goPrev);
els.nextBtn.addEventListener("click", goNext);
els.restartBtn.addEventListener("click", startQuiz);

loadData();
