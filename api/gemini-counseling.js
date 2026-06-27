// ──────────────────────────────────────────────────────────────
// [보안] Gemini API 호출은 반드시 서버(Vercel Serverless Function)에서 처리한다.
// 프론트엔드에 API 키를 넣으면 브라우저 개발자 도구에서 노출될 수 있다.
// .env 파일은 GitHub에 올리지 않는다. (.gitignore에 등록)
// Vercel 배포 시 Project Settings > Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.
// ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST 요청만 허용됩니다." });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body || {};

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({
      success: false,
      error: "필수 값이 누락되었습니다. studentAlias, gradeSummary, learningTraits, teacherConcern을 모두 입력해주세요.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.",
    });
  }

  const systemPrompt = [
    "당신은 학교 교사를 위한 학생 상담 전략 도우미입니다.",
    "교사가 제공하는 학생 데이터와 상담 고민을 바탕으로, 교사가 학생을 이해하고 효과적으로 대화할 수 있도록 돕는 상담 전략을 제안합니다.",
    "",
    "반드시 지켜야 할 원칙:",
    "- 학생을 단정적으로 판단하거나 진단하지 마세요.",
    '- "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다"처럼 단정하는 표현을 사용하지 마세요.',
    "- 교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로 응답하세요.",
    "- 가능성을 열어두는 표현을 사용하세요. (예: ~일 수 있습니다, ~를 살펴볼 수 있습니다)",
    "",
    "반드시 다음 형식으로 응답하세요:",
    "",
    "## 1. 현재 상황 요약",
    "(교사가 제공한 정보를 바탕으로 현재 상황을 간단히 요약합니다)",
    "",
    "## 2. 학생 데이터 기반 해석",
    "(성적과 학습 특성 데이터를 바탕으로 가능한 해석을 제시합니다)",
    "",
    "## 3. 상담 접근 전략",
    "(교사가 실제 상담에서 활용할 수 있는 구체적인 전략을 제안합니다)",
    "",
    "## 4. 교사가 던질 수 있는 질문 3개",
    "(학생과의 대화에서 사용할 수 있는 구체적인 질문을 3개 제시합니다)",
    "",
    "## 5. 피해야 할 말 또는 주의점",
    "(상담 시 피해야 할 표현이나 주의할 점을 안내합니다)",
    "",
    "## 6. 다음 수업에서 해볼 수 있는 작은 지원",
    "(교사가 다음 수업에서 바로 시도해볼 수 있는 작은 실천 방안을 제안합니다)",
  ].join("\n");

  const userMessage = [
    `[학생 식별]: ${studentAlias}`,
    `[성적 요약]: ${gradeSummary}`,
    `[학습 특성]: ${learningTraits}`,
    `[교사의 상담 고민]: ${teacherConcern}`,
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(502).json({
        success: false,
        error: `Gemini API 오류 (${response.status}): ${errorBody}`,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "응답을 생성하지 못했습니다.";

    return res.status(200).json({ success: true, result: text });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `서버 오류: ${err.message}`,
    });
  }
}
