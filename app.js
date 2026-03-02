/* ======================================================================
   app.js  –  World Trivia Quiz Engine
   ====================================================================== */

(() => {
  "use strict";

  /* ---------- DOM refs ---------- */
  const $start   = document.getElementById("start-screen");
  const $quiz    = document.getElementById("quiz-screen");
  const $result  = document.getElementById("result-screen");

  const $catBtns   = document.querySelectorAll(".category-btn");
  const $countBtns = document.querySelectorAll(".count-btn");
  const $startBtn  = document.getElementById("start-btn");

  const $counter   = document.getElementById("question-counter");
  const $catLabel  = document.getElementById("category-label");
  const $progress  = document.getElementById("progress-fill");
  const $scoreDisp = document.getElementById("score-display");
  const $timerDisp = document.getElementById("timer-display");

  const $qText     = document.getElementById("question-text");
  const $qVisual   = document.getElementById("question-visual");
  const $options   = document.getElementById("options-container");
  const $feedback  = document.getElementById("feedback");

  const $retryBtn  = document.getElementById("retry-btn");
  const $homeBtn   = document.getElementById("home-btn");

  /* ---------- Quiz state ---------- */
  let selectedCategory = null;
  let selectedCount    = null;
  let questions        = [];
  let currentIndex     = 0;
  let score            = 0;
  let timer            = null;
  let timeLeft         = 15;
  let answers          = [];          // { question, correct, chosen, isCorrect, timeTaken }
  let questionStartTime = 0;

  const LETTERS = ["A", "B", "C", "D"];
  const TIME_PER_QUESTION = 15;       // seconds

  /* ================================================================
     SETUP – category & count selection
     ================================================================ */
  $catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      $catBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCategory = btn.dataset.category;
      checkReady();
    });
  });

  $countBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      $countBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedCount = parseInt(btn.dataset.count, 10);
      checkReady();
    });
  });

  function checkReady() {
    $startBtn.disabled = !(selectedCategory && selectedCount);
  }

  $startBtn.addEventListener("click", () => {
    if (!selectedCategory || !selectedCount) return;
    buildQuestions();
    showScreen($quiz);
    renderQuestion();
  });

  /* ================================================================
     QUESTION GENERATION
     ================================================================ */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandom(arr, n, exclude) {
    const filtered = arr.filter(x => x !== exclude);
    return shuffle(filtered).slice(0, n);
  }

  function buildQuestions() {
    const pool = TRIVIA_DATA[selectedCategory];
    const shuffled = shuffle(pool);
    // if user wants more questions than data, repeat with shuffle
    const expanded = [];
    while (expanded.length < selectedCount) {
      expanded.push(...shuffle(pool));
    }
    const picked = expanded.slice(0, selectedCount);

    questions = picked.map(item => generateQuestion(item, pool));
    currentIndex = 0;
    score = 0;
    answers = [];
  }

  function generateQuestion(item, pool) {
    switch (selectedCategory) {
      case "flags":
        return buildFlagQuestion(item, pool);
      case "countries":
        return buildCountryQuestion(item, pool);
      case "languages":
        return buildLanguageQuestion(item, pool);
      case "currencies":
        return buildCurrencyQuestion(item, pool);
    }
  }

  /* ----- Helper: build flag <img> tag ----- */
  function flagImg(code, size = 160) {
    return `<img src="https://flagcdn.com/w${size}/${code}.png" alt="flag" class="flag-img" />`;
  }
  function flagImgSmall(code) {
    return `<img src="https://flagcdn.com/w80/${code}.png" alt="flag" class="flag-img-small" />`;
  }

  /* ----- Flag questions ----- */
  function buildFlagQuestion(item, pool) {
    const type = Math.random() < 0.5 ? "flag-to-country" : "country-to-flag";
    if (type === "flag-to-country") {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: "Which country does this flag belong to?",
        visual: item.code,
        visualType: "flag",
        options: opts,
        answer: item.country,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.code), 3, item.code);
      const opts = shuffle([item.code, ...wrongs]);
      return {
        text: `Which flag belongs to ${item.country}?`,
        visual: "",
        visualType: "flag-options",
        options: opts,
        answer: item.code,
      };
    }
  }

  /* ----- Country questions (capital / continent) ----- */
  function buildCountryQuestion(item, pool) {
    const r = Math.random();
    if (r < 0.33) {
      // capital → country
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `${item.capital} is the capital of which country?`,
        visual: "",
        options: opts,
        answer: item.country,
      };
    } else if (r < 0.66) {
      // country → capital
      const wrongs = pickRandom(pool.map(p => p.capital), 3, item.capital);
      const opts = shuffle([item.capital, ...wrongs]);
      return {
        text: `What is the capital of ${item.country}?`,
        visual: "",
        options: opts,
        answer: item.capital,
      };
    } else {
      // country → continent
      const allContinents = [...new Set(pool.map(p => p.continent))];
      const wrongs = pickRandom(allContinents, 3, item.continent);
      const opts = shuffle([item.continent, ...wrongs]);
      return {
        text: `On which continent is ${item.country} located?`,
        visual: "",
        options: opts,
        answer: item.continent,
      };
    }
  }

  /* ----- Language questions ----- */
  function buildLanguageQuestion(item, pool) {
    if (Math.random() < 0.5) {
      const wrongs = pickRandom(pool.map(p => p.language), 3, item.language);
      const opts = shuffle([item.language, ...wrongs]);
      return {
        text: `What is the official language of ${item.country}?`,
        visual: "",
        options: opts,
        answer: item.language,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `"${item.language}" is the official language of which country?`,
        visual: "",
        options: opts,
        answer: item.country,
      };
    }
  }

  /* ----- Currency questions ----- */
  function buildCurrencyQuestion(item, pool) {
    if (Math.random() < 0.5) {
      const wrongs = pickRandom(pool.map(p => p.currency), 3, item.currency);
      const opts = shuffle([item.currency, ...wrongs]);
      return {
        text: `What is the currency of ${item.country}?`,
        visual: "",
        options: opts,
        answer: item.currency,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `Which country uses the "${item.currency}"?`,
        visual: "",
        options: opts,
        answer: item.country,
      };
    }
  }

  /* ================================================================
     RENDER QUESTION
     ================================================================ */
  function renderQuestion() {
    const q = questions[currentIndex];

    // header
    $counter.textContent = `${currentIndex + 1} / ${questions.length}`;
    $catLabel.textContent = selectedCategory;
    $progress.style.width = `${((currentIndex) / questions.length) * 100}%`;
    $scoreDisp.textContent = `Score: ${score}`;

    // question
    $qText.textContent = q.text;
    if (q.visualType === "flag" && q.visual) {
      $qVisual.innerHTML = flagImg(q.visual, 240);
    } else {
      $qVisual.innerHTML = "";
    }

    // options
    $options.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      if (q.visualType === "flag-options") {
        btn.innerHTML = `<span class="opt-letter">${LETTERS[i]}</span>${flagImgSmall(opt)}`;
        btn.dataset.code = opt;
      } else {
        btn.innerHTML = `<span class="opt-letter">${LETTERS[i]}</span>${opt}`;
      }
      btn.addEventListener("click", () => handleAnswer(btn, opt, q));
      $options.appendChild(btn);
    });

    // feedback
    $feedback.classList.add("hidden");
    $feedback.className = "feedback hidden";

    // timer
    startTimer();
    questionStartTime = Date.now();
  }

  /* ================================================================
     TIMER
     ================================================================ */
  function startTimer() {
    clearInterval(timer);
    timeLeft = TIME_PER_QUESTION;
    $timerDisp.textContent = `⏱ ${timeLeft}s`;
    $timerDisp.classList.remove("warning");

    timer = setInterval(() => {
      timeLeft--;
      $timerDisp.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 5) $timerDisp.classList.add("warning");
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    const q = questions[currentIndex];
    lockOptions(null, q);
    showFeedback(false, q.answer);

    answers.push({
      question: q.text,
      visual: q.visual || "",
      visualType: q.visualType || "",
      correct: q.answer,
      chosen: "⏱ Time's up",
      isCorrect: false,
      timeTaken: TIME_PER_QUESTION,
    });

    setTimeout(nextQuestion, 1500);
  }

  /* ================================================================
     ANSWER HANDLING
     ================================================================ */
  function handleAnswer(btn, chosen, q) {
    clearInterval(timer);
    const timeTaken = ((Date.now() - questionStartTime) / 1000).toFixed(1);
    const isCorrect = chosen === q.answer;

    if (isCorrect) score++;

    lockOptions(btn, q);
    showFeedback(isCorrect, q.answer);

    answers.push({
      question: q.text,
      visual: q.visual || "",
      visualType: q.visualType || "",
      correct: q.answer,
      chosen,
      isCorrect,
      timeTaken: parseFloat(timeTaken),
    });

    setTimeout(nextQuestion, 1200);
  }

  function lockOptions(clickedBtn, q) {
    const btns = $options.querySelectorAll(".option-btn");
    btns.forEach(b => {
      b.classList.add("locked");
      b.style.pointerEvents = "none";
      // show correct — use dataset.code for flag-option questions
      const val = b.dataset.code || b.textContent.slice(1);
      if (val === q.answer) b.classList.add("correct-answer");
      if (b === clickedBtn && val !== q.answer) b.classList.add("wrong-answer");
    });
  }

  function showFeedback(isCorrect, correctAnswer) {
    $feedback.classList.remove("hidden", "correct", "wrong");
    if (isCorrect) {
      $feedback.classList.add("correct");
      $feedback.textContent = "✅ Correct!";
    } else {
      $feedback.classList.add("wrong");
      $feedback.textContent = `❌ Wrong! Answer: ${correctAnswer}`;
    }
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  /* ================================================================
     RESULTS
     ================================================================ */
  function showResults() {
    clearInterval(timer);
    showScreen($result);

    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const wrong = total - score;
    const avgTime = (answers.reduce((s, a) => s + a.timeTaken, 0) / total).toFixed(1);

    // emoji & title
    let emoji, title, message;
    if (pct === 100)       { emoji = "🏆"; title = "Perfect Score!"; message = "You're a world trivia master!"; }
    else if (pct >= 80)    { emoji = "🌟"; title = "Excellent!"; message = "Impressive knowledge of the world!"; }
    else if (pct >= 60)    { emoji = "👏"; title = "Great Job!"; message = "You know quite a lot!"; }
    else if (pct >= 40)    { emoji = "😊"; title = "Good Effort!"; message = "Keep learning and try again!"; }
    else                   { emoji = "📚"; title = "Keep Learning!"; message = "The world has so much to teach us!"; }

    document.getElementById("result-emoji").textContent = emoji;
    document.getElementById("result-title").textContent = title;
    document.getElementById("result-score").textContent = `${score} / ${total}  (${pct}%)`;
    document.getElementById("result-message").textContent = message;

    const bar = document.getElementById("result-bar");
    bar.style.width = "0";
    bar.style.background = pct >= 60
      ? "linear-gradient(90deg,var(--correct),var(--accent))"
      : "linear-gradient(90deg,var(--wrong),#e17055)";
    requestAnimationFrame(() => { bar.style.width = pct + "%"; });

    document.getElementById("stat-correct").textContent = score;
    document.getElementById("stat-wrong").textContent = wrong;
    document.getElementById("stat-time").textContent = avgTime + "s";

    // review list
    const $review = document.getElementById("review-list");
    $review.innerHTML = "";
    answers.forEach((a, i) => {
      const div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML = `
        <span class="review-icon">${a.isCorrect ? "✅" : "❌"}</span>
        <div class="review-detail">
          <div class="review-q">${i + 1}. ${a.visualType === "flag" && a.visual ? `<img src="https://flagcdn.com/w40/${a.visual}.png" class="review-flag" /> ` : ""}${a.question}</div>
          <div class="review-a">
            ${a.isCorrect
              ? `<span class="correct-text">${a.correct}</span>`
              : `<span class="wrong-text">${a.chosen}</span><span class="correct-text">${a.correct}</span>`
            }
          </div>
        </div>`;
      $review.appendChild(div);
    });
  }

  /* ================================================================
     NAVIGATION
     ================================================================ */
  function showScreen(screen) {
    [$start, $quiz, $result].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $retryBtn.addEventListener("click", () => {
    buildQuestions();
    showScreen($quiz);
    renderQuestion();
  });

  $homeBtn.addEventListener("click", () => {
    clearInterval(timer);
    // reset selections
    $catBtns.forEach(b => b.classList.remove("selected"));
    $countBtns.forEach(b => b.classList.remove("selected"));
    selectedCategory = null;
    selectedCount = null;
    $startBtn.disabled = true;
    showScreen($start);
  });

})();
