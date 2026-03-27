import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://kkouwjzemhdkqidjrhrn.supabase.co",
  "sb_publishable_0qwp4AYBKAo1OprIQrwj3Q_EblkPeeG"
);

const particlesContainer = document.getElementById("particles");

const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");

const adminWelcome = document.getElementById("adminWelcome");
const logoutBtn = document.getElementById("logoutBtn");
const goHomeBtn = document.getElementById("goHomeBtn");

const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categorySlug = document.getElementById("categorySlug");
const categoryPoints = document.getElementById("categoryPoints");
const categoryOrder = document.getElementById("categoryOrder");
const categoryStatus = document.getElementById("categoryStatus");

const questionForm = document.getElementById("questionForm");
const questionId = document.getElementById("questionId");
const questionCategory = document.getElementById("questionCategory");
const questionPt = document.getElementById("questionPt");
const questionEn = document.getElementById("questionEn");
const optionApt = document.getElementById("optionApt");
const optionBpt = document.getElementById("optionBpt");
const optionCpt = document.getElementById("optionCpt");
const optionDpt = document.getElementById("optionDpt");
const optionAen = document.getElementById("optionAen");
const optionBen = document.getElementById("optionBen");
const optionCen = document.getElementById("optionCen");
const optionDen = document.getElementById("optionDen");
const correctOption = document.getElementById("correctOption");
const difficulty = document.getElementById("difficulty");
const questionActive = document.getElementById("questionActive");
const saveQuestionBtn = document.getElementById("saveQuestionBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const questionStatus = document.getElementById("questionStatus");

const categoriesList = document.getElementById("categoriesList");
const questionsList = document.getElementById("questionsList");
const reloadCategoriesBtn = document.getElementById("reloadCategoriesBtn");
const reloadQuestionsBtn = document.getElementById("reloadQuestionsBtn");

let categoriesCache = [];
let questionsCache = [];

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

async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin, display_name, email")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw profileError;

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    throw new Error("Acesso negado. Usuário não é administrador.");
  }

  return { user: data.user, profile };
}

async function checkAdminAccess() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin, display_name, email")
    .eq("id", session.user.id)
    .single();

  if (error || !profile?.is_admin) {
    await supabase.auth.signOut();
    showLogin();
    return;
  }

  showAdmin(profile);
  await Promise.all([loadCategories(), loadQuestions()]);
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  adminScreen.classList.add("hidden");
}

function showAdmin(profile) {
  loginScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");
  adminWelcome.textContent = `Bem-vindo, ${profile.display_name || profile.email || "Admin"}`;
}

function resetQuestionForm() {
  questionForm.reset();
  questionId.value = "";
  questionActive.checked = true;
  saveQuestionBtn.textContent = "Salvar pergunta";
  questionStatus.textContent = "";
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("difficulty_order", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return;
  }

  categoriesCache = data || [];
  renderCategories();
  fillCategorySelect();
}

function fillCategorySelect() {
  questionCategory.innerHTML = `<option value="">Selecione uma categoria</option>`;

  categoriesCache.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = `${category.name} (${category.points} pts)`;
    questionCategory.appendChild(option);
  });
}

function renderCategories() {
  if (!categoriesCache.length) {
    categoriesList.innerHTML = `<div class="list-item"><p>Nenhuma categoria cadastrada ainda.</p></div>`;
    return;
  }

  categoriesList.innerHTML = categoriesCache
    .map((category) => `
      <div class="list-item">
        <strong>${category.name}</strong>
        <span>Slug: ${category.slug}</span><br>
        <span>Pontos: ${category.points}</span><br>
        <span>Ordem: ${category.difficulty_order}</span><br>
        <span>Status: ${category.is_active ? "Ativa" : "Inativa"}</span>
      </div>
    `)
    .join("");
}

async function loadQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      *,
      categories (
        id,
        name,
        points
      )
    `)
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao carregar perguntas:", error);
    return;
  }

  questionsCache = data || [];
  renderQuestions();
}

function renderQuestions() {
  if (!questionsCache.length) {
    questionsList.innerHTML = `<div class="list-item"><p>Nenhuma pergunta cadastrada ainda.</p></div>`;
    return;
  }

  questionsList.innerHTML = questionsCache
    .map((question) => `
      <div class="list-item">
        <strong>${question.question_pt}</strong>
        <span class="tag tag-cyan">${question.categories?.name || "Sem categoria"}</span>
        <span class="tag tag-pink">${question.difficulty}</span>
        <span class="tag ${question.is_active ? "tag-green" : "tag-red"}">
          ${question.is_active ? "Ativa" : "Inativa"}
        </span>

        <p><strong>Respostas:</strong></p>
        <p>A) ${question.option_a_pt}</p>
        <p>B) ${question.option_b_pt}</p>
        <p>C) ${question.option_c_pt}</p>
        <p>D) ${question.option_d_pt}</p>
        <p><strong>Correta:</strong> ${question.correct_option}</p>

        <div class="item-actions">
          <button class="action-btn action-edit" data-edit-id="${question.id}">Editar</button>
          <button class="action-btn action-toggle" data-toggle-id="${question.id}" data-active="${question.is_active}">
            ${question.is_active ? "Desativar" : "Ativar"}
          </button>
          <button class="action-btn action-delete" data-delete-id="${question.id}">Excluir</button>
        </div>
      </div>
    `)
    .join("");

  document.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => editQuestion(Number(button.dataset.editId)));
  });

  document.querySelectorAll("[data-toggle-id]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleQuestionStatus(Number(button.dataset.toggleId), button.dataset.active === "true")
    );
  });

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteQuestion(Number(button.dataset.deleteId)));
  });
}

function editQuestion(id) {
  const question = questionsCache.find((item) => item.id === id);
  if (!question) return;

  questionId.value = question.id;
  questionCategory.value = question.category_id;
  questionPt.value = question.question_pt || "";
  questionEn.value = question.question_en || "";
  optionApt.value = question.option_a_pt || "";
  optionBpt.value = question.option_b_pt || "";
  optionCpt.value = question.option_c_pt || "";
  optionDpt.value = question.option_d_pt || "";
  optionAen.value = question.option_a_en || "";
  optionBen.value = question.option_b_en || "";
  optionCen.value = question.option_c_en || "";
  optionDen.value = question.option_d_en || "";
  correctOption.value = question.correct_option || "";
  difficulty.value = question.difficulty || "easy";
  questionActive.checked = !!question.is_active;

  saveQuestionBtn.textContent = "Atualizar pergunta";
  questionStatus.textContent = "Modo edição ativado.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleQuestionStatus(id, isCurrentlyActive) {
  const { error } = await supabase
    .from("questions")
    .update({ is_active: !isCurrentlyActive })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao alterar status da pergunta.");
    return;
  }

  await loadQuestions();
}

async function deleteQuestion(id) {
  const confirmed = confirm("Tem certeza que deseja excluir esta pergunta?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir pergunta.");
    return;
  }

  await loadQuestions();
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    loginStatus.textContent = "Entrando no painel...";
    await loginAdmin(adminEmail.value.trim(), adminPassword.value.trim());
    loginStatus.textContent = "Login realizado com sucesso!";
    await checkAdminAccess();
  } catch (error) {
    console.error(error);
    loginStatus.textContent = error.message || "Erro ao fazer login.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

goHomeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

reloadCategoriesBtn.addEventListener("click", loadCategories);
reloadQuestionsBtn.addEventListener("click", loadQuestions);
cancelEditBtn.addEventListener("click", resetQuestionForm);

categoryName.addEventListener("input", () => {
  if (!categorySlug.value.trim()) {
    categorySlug.value = slugify(categoryName.value);
  }
});

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    categoryStatus.textContent = "Salvando categoria...";

    const payload = {
      name: categoryName.value.trim(),
      slug: slugify(categorySlug.value.trim() || categoryName.value.trim()),
      points: Number(categoryPoints.value),
      difficulty_order: Number(categoryOrder.value),
      is_active: true
    };

    const { error } = await supabase.from("categories").insert(payload);

    if (error) throw error;

    categoryStatus.textContent = "Categoria salva com sucesso!";
    categoryForm.reset();
    await loadCategories();
  } catch (error) {
    console.error(error);
    categoryStatus.textContent = error.message || "Erro ao salvar categoria.";
  }
});

questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    questionStatus.textContent = questionId.value
      ? "Atualizando pergunta..."
      : "Salvando pergunta...";

    const payload = {
      category_id: Number(questionCategory.value),
      question_pt: questionPt.value.trim(),
      question_en: questionEn.value.trim() || null,
      option_a_pt: optionApt.value.trim(),
      option_b_pt: optionBpt.value.trim(),
      option_c_pt: optionCpt.value.trim(),
      option_d_pt: optionDpt.value.trim(),
      option_a_en: optionAen.value.trim() || optionApt.value.trim(),
      option_b_en: optionBen.value.trim() || optionBpt.value.trim(),
      option_c_en: optionCen.value.trim() || optionCpt.value.trim(),
      option_d_en: optionDen.value.trim() || optionDpt.value.trim(),
      correct_option: correctOption.value,
      difficulty: difficulty.value,
      is_active: questionActive.checked
    };

    let error;

    if (questionId.value) {
      const response = await supabase
        .from("questions")
        .update(payload)
        .eq("id", Number(questionId.value));

      error = response.error;
    } else {
      const response = await supabase
        .from("questions")
        .insert(payload);

      error = response.error;
    }

    if (error) throw error;

    questionStatus.textContent = questionId.value
      ? "Pergunta atualizada com sucesso!"
      : "Pergunta salva com sucesso!";

    resetQuestionForm();
    await loadQuestions();
  } catch (error) {
    console.error(error);
    questionStatus.textContent = error.message || "Erro ao salvar pergunta.";
  }
});

createParticles();
checkAdminAccess();