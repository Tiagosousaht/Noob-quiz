import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://kkouwjzemhdkqidjrhrn.supabase.co",
  "sb_publishable_0qwp4AYBKAo1OprIQrwj3Q_EblkPeeG"
);

const playBtn = document.getElementById("playBtn");
const rankingBtn = document.getElementById("rankingBtn");
const nameModal = document.getElementById("nameModal");
const closeModal = document.getElementById("closeModal");
const nameForm = document.getElementById("nameForm");
const playerNameInput = document.getElementById("playerName");
const statusMessage = document.getElementById("statusMessage");
const particlesContainer = document.getElementById("particles");

const LOCAL_PLAYER_KEY = "noobQuizPlayer";

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

function openModal() {
  if (!nameModal) return;
  nameModal.classList.add("active");
  statusMessage.textContent = "";
  playerNameInput.focus();
}

function closeNameModal() {
  if (!nameModal) return;
  nameModal.classList.remove("active");
  statusMessage.textContent = "";
}

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

function saveLocalPlayer(player) {
  localStorage.setItem(LOCAL_PLAYER_KEY, JSON.stringify(player));
}

function clearLocalPlayer() {
  localStorage.removeItem(LOCAL_PLAYER_KEY);
}

function goToQuiz(player) {
  if (!player || !player.id || !player.name) {
    openModal();
    return;
  }

  window.location.href = "quiz.html";
}

async function findPlayer(name) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("name", name)
    .limit(1);

  if (error) throw error;
  return data && data.length ? data[0] : null;
}

async function createPlayer(name) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      name,
      best_score: 0,
      total_score: 0,
      last_login: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateLastLogin(id) {
  const { error } = await supabase
    .from("players")
    .update({
      last_login: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;
}

if (playBtn) {
  playBtn.addEventListener("click", async () => {
    const savedPlayer = getSavedPlayer();

    if (savedPlayer && savedPlayer.id && savedPlayer.name) {
      try {
        await updateLastLogin(savedPlayer.id);
        goToQuiz(savedPlayer);
        return;
      } catch (error) {
        console.error("Erro ao atualizar login:", error);
        clearLocalPlayer();
      }
    }

    openModal();
  });
}

if (rankingBtn) {
  rankingBtn.addEventListener("click", () => {
    alert("Ranking global em breve.");
  });
}

if (closeModal) {
  closeModal.addEventListener("click", closeNameModal);
}

if (nameModal) {
  nameModal.addEventListener("click", (event) => {
    if (event.target === nameModal) {
      closeNameModal();
    }
  });
}

if (nameForm) {
  nameForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = playerNameInput.value.trim();

    if (name.length < 3) {
      statusMessage.textContent = "Digite pelo menos 3 letras.";
      return;
    }

    if (name.length > 18) {
      statusMessage.textContent = "Máximo de 18 caracteres.";
      return;
    }

    try {
      statusMessage.textContent = "Verificando jogador...";

      let player = await findPlayer(name);

      if (!player) {
        statusMessage.textContent = "Criando cadastro...";
        player = await createPlayer(name);
      } else {
        await updateLastLogin(player.id);
      }

      saveLocalPlayer(player);
      statusMessage.textContent = "Entrando...";

      setTimeout(() => {
        closeNameModal();
        goToQuiz(player);
      }, 300);
    } catch (error) {
      console.error("Erro no cadastro/login:", error);
      statusMessage.textContent = error.message || "Erro ao entrar.";
    }
  });
}

createParticles();