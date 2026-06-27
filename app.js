const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

// ──────────────────────────────────────────────────────────────
// [보안] 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
// Gemini API 호출은 Vercel Serverless Function(/api/gemini-counseling)에서 처리한다.
// .env 파일은 GitHub에 올리지 않는다.
// Vercel 배포 시 Project Settings > Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.
// ──────────────────────────────────────────────────────────────

let currentUser = null;
let selectedStudentForCounseling = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function getStudentAlias(student) {
  const index = STUDENTS.findIndex((s) => s.id === student.id);
  const labels = ["학생 A", "학생 B", "학생 C", "학생 D", "학생 E"];
  return labels[index] || `학생 ${index + 1}`;
}

function buildAnonymizedData(student, concern) {
  const gradeEntries = Object.entries(student.grades)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return {
    studentAlias: getStudentAlias(student),
    gradeSummary: gradeEntries,
    learningTraits: student.traits.join(" / "),
    teacherConcern: concern,
  };
}

function renderCounselingPanel() {
  return `
    <section class="counseling-panel" id="counselingPanel" aria-label="AI 학생 상담 전략 도우미">
      <div class="section-title">
        <h3>AI 학생 상담 전략 도우미</h3>
      </div>

      <div class="counseling-body">
        <div class="counseling-selected" id="counselingSelected">
          <p class="counseling-placeholder">위 학생 카드에서 "상담 전략 요청" 버튼을 눌러 학생을 선택해주세요.</p>
        </div>

        <div class="counseling-form hidden" id="counselingForm">
          <label for="teacherConcern">교사 상담 고민</label>
          <textarea
            id="teacherConcern"
            rows="4"
            placeholder="수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?&#10;과제 제출이 자주 늦습니다. 혼내기보다는 원인을 파악하고 싶은데 어떻게 접근하면 좋을까요?&#10;친구들과 협업할 때 소극적인 편입니다. 어떤 질문으로 대화를 시작하면 좋을까요?"
          ></textarea>

          <details class="preview-details">
            <summary>전송 데이터 미리보기</summary>
            <pre class="preview-json" id="previewJson">{}</pre>
          </details>

          <div class="counseling-actions">
            <button type="button" class="primary-button" id="submitCounseling">AI 상담 전략 받기</button>
          </div>

          <p class="counseling-message hidden" id="counselingMessage" role="alert" aria-live="polite"></p>
        </div>

        <div class="counseling-result hidden" id="counselingResult">
          <div class="section-title"><h3>AI 상담 전략 결과</h3></div>
          <div class="result-content" id="resultContent"></div>
        </div>

        <p class="counseling-disclaimer">AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.</p>
      </div>
    </section>
  `;
}

function selectStudentForCounseling(studentId) {
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student) return;

  selectedStudentForCounseling = student;

  const selectedEl = document.querySelector("#counselingSelected");
  const formEl = document.querySelector("#counselingForm");
  const resultEl = document.querySelector("#counselingResult");
  const messageEl = document.querySelector("#counselingMessage");

  selectedEl.innerHTML = `
    <div class="selected-student-info">
      <div>
        <span class="eyebrow">선택된 학생</span>
        <p class="selected-name">${student.name} (${student.id})</p>
      </div>
      <div>
        <span class="eyebrow">Gemini 전송용 (익명화)</span>
        <p class="selected-alias">${getStudentAlias(student)}</p>
      </div>
    </div>
  `;

  formEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  messageEl.classList.add("hidden");

  updatePreview();

  document.querySelector("#counselingPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updatePreview() {
  const concern = document.querySelector("#teacherConcern")?.value || "";
  if (!selectedStudentForCounseling) return;
  const data = buildAnonymizedData(selectedStudentForCounseling, concern || "(교사 고민 미입력)");
  const previewEl = document.querySelector("#previewJson");
  if (previewEl) {
    previewEl.textContent = JSON.stringify(data, null, 2);
  }
}

async function submitCounseling() {
  const concernInput = document.querySelector("#teacherConcern");
  const messageEl = document.querySelector("#counselingMessage");
  const resultEl = document.querySelector("#counselingResult");
  const contentEl = document.querySelector("#resultContent");
  const submitBtn = document.querySelector("#submitCounseling");

  if (!selectedStudentForCounseling) {
    showCounselingMessage("학생을 먼저 선택해주세요.", true);
    return;
  }

  const concern = concernInput.value.trim();
  if (!concern) {
    showCounselingMessage("상담 고민을 먼저 입력해주세요.", true);
    return;
  }

  const payload = buildAnonymizedData(selectedStudentForCounseling, concern);

  submitBtn.disabled = true;
  submitBtn.textContent = "AI가 상담 전략을 생성하는 중입니다...";
  resultEl.classList.add("hidden");
  showCounselingMessage("AI가 상담 전략을 생성하는 중입니다...", false);

  try {
    const response = await fetch("/api/gemini-counseling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      contentEl.innerHTML = formatGeminiResponse(data.result);
      resultEl.classList.remove("hidden");
      messageEl.classList.add("hidden");
    } else {
      showCounselingMessage(
        "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.",
        true
      );
    }
  } catch {
    showCounselingMessage(
      "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.",
      true
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "AI 상담 전략 받기";
  }
}

function showCounselingMessage(text, isError) {
  const el = document.querySelector("#counselingMessage");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("hidden", "error", "info");
  el.classList.add(isError ? "error" : "info");
}

function formatGeminiResponse(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^## (.+)$/gm, '<h4 class="response-heading">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function bindCounselingEvents() {
  const submitBtn = document.querySelector("#submitCounseling");
  const concernInput = document.querySelector("#teacherConcern");

  if (submitBtn) {
    submitBtn.addEventListener("click", submitCounseling);
  }
  if (concernInput) {
    concernInput.addEventListener("input", updatePreview);
  }

  document.querySelectorAll(".counseling-request-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectStudentForCounseling(btn.dataset.studentId);
    });
  });
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    ${renderCounselingPanel()}
  `;

  bindCounselingEvents();
  showOnly(adminView);
  logoutButton.classList.remove("hidden");
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <button type="button" class="ghost-button counseling-request-btn" data-student-id="${student.id}">상담 전략 요청</button>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

showOnly(loginView);
