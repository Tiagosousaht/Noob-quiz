import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://kkouwjzemhdkqidjrhrn.supabase.co",
  "sb_publishable_0qwp4AYBKAo1OprIQrwj3Q_EblkPeeG"
);

const LOCAL_PLAYER_KEY = "noobQuizPlayer";
const MUSIC_ENABLED_KEY = "quizMusicEnabled";
const MUSIC_TIME_KEY = "quizMusicTime";

function getSavedPlayer() {
  const raw = localStorage.getItem(LOCAL_PLAYER_KEY);
  if (!raw) return null;

  try {
    const player = JSON.parse(raw);
    if (!player || !player.id || !player.name) return null;
    return player;
  } catch (error) {
    console.error("Erro ao ler jogador salvo:", error);
    return null;
  }
}

const player = getSavedPlayer();

if (!player) {
  window.location.href = "index.html";
}

if (typeof player.total_score !== "number") player.total_score = Number(player.total_score || 0);
if (typeof player.best_score !== "number") player.best_score = Number(player.best_score || 0);
if (typeof player.total_hits !== "number") player.total_hits = Number(player.total_hits || 0);
if (typeof player.total_matches !== "number") player.total_matches = Number(player.total_matches || 0);

const particlesContainer = document.getElementById("particles");
const bgMusic = document.getElementById("bgMusic");

const scoreValue = document.getElementById("scoreValue");
const correctValue = document.getElementById("correctValue");
const questionCounter = document.getElementById("questionCounter");
const bestRankMini = document.getElementById("bestRankMini");
const playerNameEl = document.getElementById("playerName");
const playerRankLabel = document.getElementById("playerRankLabel");
const userAvatar = document.getElementById("userAvatar");
const rankingList = document.getElementById("rankingList");

const bestScoreMini = document.getElementById("bestScoreMini");
const totalScoreMini = document.getElementById("totalScoreMini");
const totalHitsMini = document.getElementById("totalHitsMini");
const totalMatchesMini = document.getElementById("totalMatchesMini");

const welcomeScreen = document.getElementById("welcomeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultsScreen = document.getElementById("resultsScreen");

const startQuizBtn = document.getElementById("startQuizBtn");
const backHomeBtn = document.getElementById("backHomeBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const changePlayerBtn = document.getElementById("changePlayerBtn");
const categorySelect = document.getElementById("categorySelect");
const selectedCategoryPreview = document.getElementById("selectedCategoryPreview");

const progressLabel = document.getElementById("progressLabel");
const liveScore = document.getElementById("liveScore");
const liveCorrect = document.getElementById("liveCorrect");
const liveTotalPlayer = document.getElementById("liveTotalPlayer");
const liveHitsTotal = document.getElementById("liveHitsTotal");
const progressFill = document.getElementById("progressFill");
const timerValue = document.getElementById("timerValue");
const questionCategory = document.getElementById("questionCategory");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");

const finalRank = document.getElementById("finalRank");
const finalScoreText = document.getElementById("finalScoreText");
const summaryScore = document.getElementById("summaryScore");
const summaryCorrect = document.getElementById("summaryCorrect");
const summaryRank = document.getElementById("summaryRank");
const summaryTotal = document.getElementById("summaryTotal");
const summaryHits = document.getElementById("summaryHits");
const summaryMatches = document.getElementById("summaryMatches");
const summaryBest = document.getElementById("summaryBest");

let questions = [];
let categories = [];
let selectedCategory = null;
let currentQuestionIndex = 0;
let score = 0;
let correctAnswers = 0;
let timer = 15;
let timerInterval = null;
let answered = false;

let musicEnabled = localStorage.getItem(MUSIC_ENABLED_KEY) !== "false";

function persistLocalPlayer() {
  localStorage.setItem(LOCAL_PLAYER_KEY, JSON.stringify(player));
}

function startBackgroundMusic() {
  if (!musicEnabled || !bgMusic) return;

  bgMusic.volume = 0.25;

  const savedTime = localStorage.getItem(MUSIC_TIME_KEY);
  if (savedTime && !isNaN(parseFloat(savedTime))) {
    bgMusic.currentTime = parseFloat(savedTime);
  }

  const playPromise = bgMusic.play();

  if (playPromise !== undefined) {
    playPromise.catch(() => {
      console.log("Música bloqueada até interação do usuário.");
    });
  }
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
  localStorage.setItem(MUSIC_TIME_KEY, "0");
}

function saveMusicTime() {
  if (!bgMusic) return;
  localStorage.setItem(MUSIC_TIME_KEY, String(bgMusic.currentTime || 0));
}

function createParticles() {
  if (!particlesContainer) return;

  particlesContainer.innerHTML = "";

  for (let i = 0; i < 24; i++) {
    const particle = document.createElement("span");
    particle.classList.add("particle");

    const size = Math.random() * 4 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 8 + 8}s`;
    particle.style.animationDelay = `${Math.random() * 6}s`;
    particle.style.opacity = `${Math.random() * 0.4 + 0.2}`;

    const colors = ["#00f7ff", "#ff2bd6", "#7a5cff", "#ffe66d"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.background = color;
    particle.style.color = color;

    particlesContainer.appendChild(particle);
  }
}

function getRankByScore(score) {
  if (score >= 1400) return "🧠 Cérebro Humano Ativado";
  if (score >= 1250) return "👑 Inteligência Ilegal";
  if (score >= 1100) return "🔥 Pensante Perigoso";
  if (score >= 950) return "😎 Já Não É Burro";
  if (score >= 800) return "📚 Começou a Entender";
  if (score >= 650) return "🤓 Usou 2 Neurônios";
  if (score >= 500) return "🙂 Teve um Momento de Luz";
  if (score >= 350) return "😅 Acertou na Sorte";
  if (score >= 200) return "🤡 Vai Burro";
  if (score >= 100) return "💀 Burro Com Confiança";
  return "🐌 Modo Pedra";
}

function setPlayerInfo() {
  const name = player.name || "Jogador";
  const bestScore = Number(player.best_score || 0);
  const totalScore = Number(player.total_score || 0);
  const totalHits = Number(player.total_hits || 0);
  const totalMatches = Number(player.total_matches || 0);
  const rank = getRankByScore(bestScore);

  if (playerNameEl) {
    playerNameEl.textContent = name;
  }

  if (userAvatar) {
    userAvatar.textContent = name.charAt(0).toUpperCase();
  }

  if (playerRankLabel) {
    playerRankLabel.textContent = `Rank atual: ${rank}`;
  }

  if (bestRankMini) {
    bestRankMini.textContent = rank;
  }

  if (bestScoreMini) {
    bestScoreMini.textContent = `${bestScore} pts`;
  }

  if (totalScoreMini) {
    totalScoreMini.textContent = `${totalScore} pts`;
  }

  if (totalHitsMini) {
    totalHitsMini.textContent = `${totalHits}`;
  }

  if (totalMatchesMini) {
    totalMatchesMini.textContent = `${totalMatches}`;
  }
}

function showScreen(screen) {
  [welcomeScreen, quizScreen, resultsScreen].forEach((item) => {
    if (item) {
      item.classList.add("hidden");
    }
  });

  if (screen) {
    screen.classList.remove("hidden");
  }
}

function updateStats() {
  const totalQuestions = questions.length || 0;
  const currentQuestionNumber = totalQuestions
    ? Math.min(currentQuestionIndex + 1, totalQuestions)
    : 0;

  if (scoreValue) {
    scoreValue.textContent = `${score} pts`;
  }

  if (correctValue) {
    correctValue.textContent = `${correctAnswers}`;
  }

  if (questionCounter) {
    questionCounter.textContent = `${currentQuestionNumber}/${totalQuestions}`;
  }

  if (liveScore) {
    liveScore.textContent = `${score} pontos`;
  }

  if (liveCorrect) {
    liveCorrect.textContent = `${correctAnswers} acertos`;
  }

  if (liveTotalPlayer) {
    liveTotalPlayer.textContent = `${Number(player.total_score || 0)} pts totais`;
  }

  if (liveHitsTotal) {
    liveHitsTotal.textContent = `${Number(player.total_hits || 0)} acertos totais`;
  }
}

function updateCategoryPreview() {
  if (!categorySelect || !selectedCategoryPreview) return;

  const categoryId = Number(categorySelect.value);

  if (!categoryId) {
    selectedCategoryPreview.innerHTML = `
      <div class="preview-title">Categoria selecionada</div>
      <div class="preview-name neon-cyan">Nenhuma categoria escolhida</div>
      <div class="preview-points">Escolha uma categoria para ver a pontuação</div>
    `;
    return;
  }

  const category = categories.find((cat) => Number(cat.id) === categoryId);

  if (!category) return;

  selectedCategoryPreview.innerHTML = `
    <div class="preview-title">Categoria selecionada</div>
    <div class="preview-name neon-cyan">${category.name}</div>
    <div class="preview-points">
      Essa categoria vale <strong>${category.points} pontos</strong> por acerto.
    </div>
  `;
}

function startTimer() {
  clearInterval(timerInterval);
  timer = 15;

  if (timerValue) {
    timerValue.textContent = timer;
  }

  timerInterval = setInterval(() => {
    timer--;

    if (timerValue) {
      timerValue.textContent = timer;
    }

    if (timer <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

async function loadCategories() {
  if (!categorySelect) return;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("difficulty_order", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    categorySelect.innerHTML = `<option value="">Erro ao carregar categorias</option>`;
    return;
  }

  categories = data || [];

  categorySelect.innerHTML = `
    <option value="">Selecione uma categoria</option>
    ${categories
      .map(
        (cat) => `
      <option value="${cat.id}">
        ${cat.name} (${cat.points} pts)
      </option>
    `
      )
      .join("")}
  `;
}

async function loadQuestionsByCategory(categoryId) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao carregar perguntas:", error);
    return [];
  }

  return data || [];
}

async function renderRanking() {
  if (!rankingList) return;

  const { data, error } = await supabase
    .from("players")
    .select("id, name, best_score")
    .order("best_score", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Erro ranking:", error);
    rankingList.innerHTML = `
      <div class="rank-item">
        <div class="rank-pos">!</div>
        <div class="rank-name">Erro ao carregar ranking</div>
        <div class="rank-score">0</div>
      </div>
    `;
    return;
  }

  rankingList.innerHTML = (data || [])
    .map((item, index) => {
      const isCurrentPlayer = item.id === player.id;

      return `
        <div class="rank-item ${isCurrentPlayer ? "rank-item-current" : ""}">
          <div class="rank-pos">${index + 1}</div>
          <div class="rank-name">${item.name}</div>
          <div class="rank-score">${Number(item.best_score || 0)}</div>
        </div>
      `;
    })
    .join("");
}

function renderQuestion() {
  answered = false;

  const current = questions[currentQuestionIndex];
  if (!current) return;

  if (questionCategory) {
    questionCategory.textContent = `Categoria: ${selectedCategory.name}`;
  }

  if (questionText) {
    questionText.textContent = current.question_pt;
  }

  if (progressLabel) {
    progressLabel.textContent = `Pergunta ${currentQuestionIndex + 1} de ${questions.length}`;
  }

  if (progressFill) {
    progressFill.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
  }

  if (questionCounter) {
    questionCounter.textContent = `${currentQuestionIndex + 1}/${questions.length}`;
  }

  const options = [
    { key: "A", text: current.option_a_pt },
    { key: "B", text: current.option_b_pt },
    { key: "C", text: current.option_c_pt },
    { key: "D", text: current.option_d_pt }
  ];

  if (optionsContainer) {
    optionsContainer.innerHTML = options
      .map(
        (option) => `
          <button class="option" data-key="${option.key}">
            <span class="option-letter">${option.key}</span>
            <span class="option-text">${option.text}</span>
          </button>
        `
      )
      .join("");

    document.querySelectorAll(".option").forEach((button) => {
      button.addEventListener("click", () => handleAnswer(button.dataset.key));
    });
  }

  startTimer();
  updateStats();
}

function handleAnswer(selectedKey) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  const current = questions[currentQuestionIndex];
  const allOptions = document.querySelectorAll(".option");
  const acertou = selectedKey === current.correct_option;

  allOptions.forEach((button) => {
    const key = button.dataset.key;

    if (key === current.correct_option) {
      button.classList.add("correct");
    }

    if (key === selectedKey && key !== current.correct_option) {
      button.classList.add("wrong");
    }

    button.disabled = true;
  });

  if (acertou) {
    const pontosDaCategoria = Number(selectedCategory?.points || 10);
    score += pontosDaCategoria;
    correctAnswers += 1;
  }

  updateStats();

  setTimeout(() => {
    nextQuestion();
  }, 900);
}

function handleTimeout() {
  if (answered) return;
  answered = true;

  const current = questions[currentQuestionIndex];

  document.querySelectorAll(".option").forEach((button) => {
    if (button.dataset.key === current.correct_option) {
      button.classList.add("correct");
    }
    button.disabled = true;
  });

  updateStats();

  setTimeout(() => {
    nextQuestion();
  }, 900);
}

function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= questions.length) {
    finishQuiz();
    return;
  }

  renderQuestion();
}

async function updateScore(playerId, scoreAtual, acertosAtuais) {
  const { data, error } = await supabase
    .from("players")
    .select("best_score, total_score")
    .eq("id", playerId)
    .single();

  if (error) {
    console.error("Erro ao buscar player:", error);
    return false;
  }

  const bestScoreAtual = Number(data?.best_score || 0);
  const totalScoreAtual = Number(data?.total_score || 0);

  const newBest = Math.max(scoreAtual, bestScoreAtual);
  const newTotal = totalScoreAtual + scoreAtual;

  const { error: updateError } = await supabase
    .from("players")
    .update({
      best_score: newBest,
      total_score: newTotal,
      last_login: new Date().toISOString()
    })
    .eq("id", playerId);

  if (updateError) {
    console.error("Erro ao atualizar score:", updateError);
    return false;
  }

  player.best_score = newBest;
  player.total_score = newTotal;
  player.total_hits = Number(player.total_hits || 0) + Number(acertosAtuais || 0);
  player.total_matches = Number(player.total_matches || 0) + 1;

  persistLocalPlayer();
  return true;
}

async function finishQuiz() {
  clearInterval(timerInterval);
  saveMusicTime();

  if (player?.id) {
    const updated = await updateScore(player.id, score, correctAnswers);
    if (updated) {
      await renderRanking();
    }
  }

  const rank = getRankByScore(Number(player.best_score || score));

  if (finalRank) {
    finalRank.textContent = rank;
  }

  if (finalScoreText) {
    finalScoreText.textContent = `${player.name} fez ${score} pontos e acertou ${correctAnswers} perguntas.`;
  }

  if (summaryScore) {
    summaryScore.textContent = `${score} pontos`;
  }

  if (summaryCorrect) {
    summaryCorrect.textContent = `${correctAnswers} / ${questions.length}`;
  }

  if (summaryRank) {
    summaryRank.textContent = rank;
  }

  if (summaryTotal) {
    summaryTotal.textContent = `${Number(player.total_score || 0)} pontos totais`;
  }

  if (summaryHits) {
    summaryHits.textContent = `${Number(player.total_hits || 0)} acertos totais`;
  }

  if (summaryMatches) {
    summaryMatches.textContent = `${Number(player.total_matches || 0)} partidas jogadas`;
  }

  if (summaryBest) {
    summaryBest.textContent = `${Number(player.best_score || 0)} melhor pontuação`;
  }

  setPlayerInfo();
  updateStats();
  showScreen(resultsScreen);
}

async function resetQuiz() {
  const categoryId = Number(categorySelect?.value);

  if (!categoryId) {
    alert("Selecione uma categoria primeiro.");
    return;
  }

  selectedCategory = categories.find((cat) => Number(cat.id) === categoryId);

  if (!selectedCategory) {
    alert("Categoria inválida.");
    return;
  }

  const loadedQuestions = await loadQuestionsByCategory(categoryId);

  if (!loadedQuestions.length) {
    alert("Essa categoria ainda não tem perguntas cadastradas.");
    return;
  }

  questions = loadedQuestions;
  currentQuestionIndex = 0;
  score = 0;
  correctAnswers = 0;
  timer = 15;
  answered = false;

  startBackgroundMusic();
  setPlayerInfo();
  updateStats();
  renderQuestion();
  showScreen(quizScreen);
}

if (categorySelect) {
  categorySelect.addEventListener("change", updateCategoryPreview);
}

if (startQuizBtn) {
  startQuizBtn.addEventListener("click", () => {
    startBackgroundMusic();
    resetQuiz();
  });
}

if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    startBackgroundMusic();
    resetQuiz();
  });
}

if (backHomeBtn) {
  backHomeBtn.addEventListener("click", () => {
    saveMusicTime();
    window.location.href = "home.html";
  });
}

if (changePlayerBtn) {
  changePlayerBtn.addEventListener("click", () => {
    saveMusicTime();
    localStorage.removeItem(LOCAL_PLAYER_KEY);
    window.location.href = "home.html";
  });
}

if (bgMusic) {
  bgMusic.volume = 0.25;

  bgMusic.addEventListener("timeupdate", () => {
    if (!bgMusic.paused) {
      saveMusicTime();
    }
  });
}

window.addEventListener("beforeunload", () => {
  saveMusicTime();
  persistLocalPlayer();
});

async function initQuizPage() {
  createParticles();
  setPlayerInfo();
  updateStats();
  showScreen(welcomeScreen);
  await loadCategories();
  updateCategoryPreview();
  await renderRanking();
  startBackgroundMusic();
}

initQuizPage();