/* ======================================================================
   app.js  –  World Trivia Quiz Engine
   Features: Quiz, Learn/Flashcard, Spaced Repetition, Stats, Score History
   ====================================================================== */

(() => {
  "use strict";

  /* =================================================================
     PERSISTENCE – localStorage helpers
     ================================================================= */
  const STORAGE_KEY = "worldTrivia";

  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData();
    } catch { return defaultData(); }
  }

  function defaultData() {
    return {
      history: [],          // [{date, category, total, correct, pct, bestStreak}]
      countryStats: {},     // { "France": {correct:0, wrong:0, lastSeen:0} }
      allTimeBestStreak: 0,
    };
  }

  function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }

  let appData = loadData();

  /* =================================================================
     DOM REFS
     ================================================================= */
  const $start   = document.getElementById("start-screen");
  const $quiz    = document.getElementById("quiz-screen");
  const $result  = document.getElementById("result-screen");
  const $learn   = document.getElementById("learn-screen");

  // Tabs
  const $navTabs     = document.querySelectorAll(".nav-tab");
  const $tabContents = document.querySelectorAll(".tab-content");

  // Quiz setup
  const $catBtns   = document.querySelectorAll(".category-btn");
  const $countBtns = document.querySelectorAll(".count-btn");
  const $startBtn  = document.getElementById("start-btn");
  const $modeBtns  = document.querySelectorAll(".mode-btn");

  // Quiz screen
  const $counter   = document.getElementById("question-counter");
  const $catLabel  = document.getElementById("category-label");
  const $progress  = document.getElementById("progress-fill");
  const $scoreDisp = document.getElementById("score-display");
  const $timerDisp = document.getElementById("timer-display");
  const $qText     = document.getElementById("question-text");
  const $qVisual   = document.getElementById("question-visual");
  const $options   = document.getElementById("options-container");
  const $feedback  = document.getElementById("feedback");
  const $exitBtn   = document.getElementById("exit-btn");
  const $streakDisp= document.getElementById("streak-display");

  // Result screen
  const $retryBtn     = document.getElementById("retry-btn");
  const $retryWrong   = document.getElementById("retry-wrong-btn");
  const $homeBtn      = document.getElementById("home-btn");

  // Learn setup
  const $learnBtn    = document.getElementById("learn-btn");
  const $regionBtns  = document.querySelectorAll(".region-btn");
  const $sortBtns    = document.querySelectorAll(".sort-btn");

  // Learn screen
  const $learnBack   = document.getElementById("learn-back-btn");
  const $learnCounter= document.getElementById("learn-counter");
  const $flashcard   = document.getElementById("flashcard");
  const $fcFlag      = document.getElementById("fc-flag");
  const $fcCountry   = document.getElementById("fc-country");
  const $fcFlagBack  = document.getElementById("fc-flag-back");
  const $fcCountryBack= document.getElementById("fc-country-back");
  const $fcCapital   = document.getElementById("fc-capital");
  const $fcContinent = document.getElementById("fc-continent");
  const $fcLanguage  = document.getElementById("fc-language");
  const $fcCurrency  = document.getElementById("fc-currency");
  const $fcPrev      = document.getElementById("fc-prev");
  const $fcNext      = document.getElementById("fc-next");
  const $fcKnow      = document.getElementById("fc-know");

  // Stats
  const $clearStats  = document.getElementById("clear-stats-btn");

  /* =================================================================
     STATE
     ================================================================= */
  let selectedCategory = null;
  let selectedCount    = null;
  let questions        = [];
  let currentIndex     = 0;
  let score            = 0;
  let timer            = null;
  let timeLeft         = 15;
  let answers          = [];
  let questionStartTime = 0;
  let timedMode        = true;
  let currentStreak    = 0;
  let bestStreak       = 0;

  // Learn state
  let learnRegion      = "all";
  let learnSort        = "alpha";
  let learnCards       = [];
  let learnIndex       = 0;

  const LETTERS = ["A", "B", "C", "D"];
  const TIME_PER_QUESTION = 15;

  /* =================================================================
     TABS ON START SCREEN
     ================================================================= */
  $navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      $navTabs.forEach(t => t.classList.remove("active"));
      $tabContents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "stats-setup") renderStats();
    });
  });

  /* =================================================================
     QUIZ SETUP – category & count selection
     ================================================================= */
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

  $modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      $modeBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      timedMode = btn.dataset.mode === "timed";
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

  /* =================================================================
     LEARN SETUP
     ================================================================= */
  $regionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      $regionBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      learnRegion = btn.dataset.region;
    });
  });

  $sortBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      $sortBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      learnSort = btn.dataset.sort;
    });
  });

  $learnBtn.addEventListener("click", () => {
    buildLearnCards();
    learnIndex = 0;
    showScreen($learn);
    renderFlashcard();
  });

  /* =================================================================
     SPACED REPETITION – country tracking
     ================================================================= */
  function recordCountry(country, isCorrect) {
    if (!appData.countryStats[country]) {
      appData.countryStats[country] = { correct: 0, wrong: 0, lastSeen: 0 };
    }
    const s = appData.countryStats[country];
    if (isCorrect) s.correct++; else s.wrong++;
    s.lastSeen = Date.now();
    saveData();
  }

  function getCountryWeight(country) {
    const s = appData.countryStats[country];
    if (!s) return 5; // never seen = high weight
    const total = s.correct + s.wrong;
    if (total === 0) return 5;
    const accuracy = s.correct / total;
    // Lower accuracy = higher weight (more likely to appear)
    return Math.max(1, Math.round((1 - accuracy) * 10));
  }

  function getCountryAccuracy(country) {
    const s = appData.countryStats[country];
    if (!s || (s.correct + s.wrong) === 0) return -1; // never tested
    return s.correct / (s.correct + s.wrong);
  }

  /* =================================================================
     QUESTION GENERATION
     ================================================================= */
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

  /** Weighted shuffle — items with higher weight appear earlier */
  function weightedShuffle(items, getWeight) {
    const weighted = items.map(item => ({
      item,
      sort: Math.random() ** (1 / getWeight(item)),
    }));
    weighted.sort((a, b) => b.sort - a.sort);
    return weighted.map(w => w.item);
  }

  function buildQuestions(wrongOnly) {
    if (wrongOnly && answers.length) {
      // Replay only wrong answers
      const wrongCountries = answers
        .filter(a => !a.isCorrect && a.sourceCountry)
        .map(a => a.sourceCountry);
      const uniqueCountries = [...new Set(wrongCountries)];
      if (uniqueCountries.length === 0) return;

      const cats = selectedCategory === "mixed"
        ? ["flags", "countries", "languages", "currencies"]
        : [selectedCategory];

      questions = [];
      uniqueCountries.forEach(country => {
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const pool = TRIVIA_DATA[cat];
        const item = pool.find(p => p.country === country);
        if (item) questions.push(generateQuestion(item, pool, cat));
      });
      questions = shuffle(questions);
      selectedCount = questions.length;
    } else if (selectedCategory === "mixed") {
      const categories = ["flags", "countries", "languages", "currencies"];
      questions = [];
      const allItems = [];
      categories.forEach(cat => {
        TRIVIA_DATA[cat].forEach(item => allItems.push({ item, cat }));
      });
      // Weighted: countries you get wrong more appear more often
      const sorted = weightedShuffle(allItems, e => getCountryWeight(e.item.country));
      let idx = 0;
      while (questions.length < selectedCount) {
        const { item, cat } = sorted[idx % sorted.length];
        questions.push(generateQuestion(item, TRIVIA_DATA[cat], cat));
        idx++;
      }
    } else {
      const pool = TRIVIA_DATA[selectedCategory];
      // Weighted shuffle — weaker countries appear more often
      const sorted = weightedShuffle(pool, item => getCountryWeight(item.country));
      const picked = [];
      let idx = 0;
      while (picked.length < selectedCount) {
        picked.push(sorted[idx % sorted.length]);
        idx++;
      }
      questions = picked.map(item => generateQuestion(item, pool, selectedCategory));
    }
    currentIndex = 0;
    score = 0;
    currentStreak = 0;
    bestStreak = 0;
    answers = [];
  }

  function generateQuestion(item, pool, cat) {
    let q;
    switch (cat) {
      case "flags":      q = buildFlagQuestion(item, pool); break;
      case "countries":  q = buildCountryQuestion(item, pool); break;
      case "languages":  q = buildLanguageQuestion(item, pool); break;
      case "currencies": q = buildCurrencyQuestion(item, pool); break;
    }
    q.sourceCountry = item.country;
    q.sourceCategory = cat;
    return q;
  }

  /* ----- Flag img helpers ----- */
  function flagImg(code) {
    return `<img src="https://flagcdn.com/w320/${code}.png" alt="flag" class="flag-img" />`;
  }
  function flagImgSmall(code) {
    return `<img src="https://flagcdn.com/w160/${code}.png" alt="flag" class="flag-img-small" />`;
  }

  /* ----- Flag questions ----- */
  function buildFlagQuestion(item, pool) {
    const type = Math.random() < 0.5 ? "flag-to-country" : "country-to-flag";
    if (type === "flag-to-country") {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: "Which country does this flag belong to?",
        visual: item.code, visualType: "flag", options: opts, answer: item.country,
        explanation: `This is the flag of ${item.country}.`,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.code), 3, item.code);
      const opts = shuffle([item.code, ...wrongs]);
      return {
        text: `Which flag belongs to ${item.country}?`,
        visual: "", visualType: "flag-options", options: opts, answer: item.code,
        explanation: `This is the flag of ${item.country}.`,
      };
    }
  }

  /* ----- Country questions ----- */
  function buildCountryQuestion(item, pool) {
    const r = Math.random();
    if (r < 0.33) {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `${item.capital} is the capital of which country?`,
        visual: "", options: opts, answer: item.country,
        explanation: `${item.capital} is the capital of ${item.country}, located in ${item.continent}.`,
      };
    } else if (r < 0.66) {
      const wrongs = pickRandom(pool.map(p => p.capital), 3, item.capital);
      const opts = shuffle([item.capital, ...wrongs]);
      return {
        text: `What is the capital of ${item.country}?`,
        visual: "", options: opts, answer: item.capital,
        explanation: `The capital of ${item.country} is ${item.capital}.`,
      };
    } else {
      const allContinents = [...new Set(pool.map(p => p.continent))];
      const wrongs = pickRandom(allContinents, 3, item.continent);
      const opts = shuffle([item.continent, ...wrongs]);
      return {
        text: `On which continent is ${item.country} located?`,
        visual: "", options: opts, answer: item.continent,
        explanation: `${item.country} is located in ${item.continent}. Its capital is ${item.capital}.`,
      };
    }
  }

  function nameRevealed(country, value) {
    const c = country.toLowerCase();
    const v = value.toLowerCase();
    const words = c.split(/[\s-]+/).filter(w => w.length > 3);
    return words.some(w => v.includes(w));
  }

  /* ----- Language questions ----- */
  function buildLanguageQuestion(item, pool) {
    const canReverse = !nameRevealed(item.country, item.language);
    const doReverse = canReverse && Math.random() < 0.5;
    if (!doReverse) {
      const wrongs = pickRandom(pool.map(p => p.language), 3, item.language);
      const opts = shuffle([item.language, ...wrongs]);
      return {
        text: `What is the official language of ${item.country}?`,
        visual: "", options: opts, answer: item.language,
        explanation: `The official language of ${item.country} is ${item.language}.`,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `"${item.language}" is the official language of which country?`,
        visual: "", options: opts, answer: item.country,
        explanation: `${item.language} is the official language of ${item.country}.`,
      };
    }
  }

  /* ----- Currency questions ----- */
  function buildCurrencyQuestion(item, pool) {
    const canReverse = !nameRevealed(item.country, item.currency);
    const doReverse = canReverse && Math.random() < 0.5;
    if (!doReverse) {
      const wrongs = pickRandom(pool.map(p => p.currency), 3, item.currency);
      const opts = shuffle([item.currency, ...wrongs]);
      return {
        text: `What is the currency of ${item.country}?`,
        visual: "", options: opts, answer: item.currency,
        explanation: `The currency of ${item.country} is ${item.currency}.`,
      };
    } else {
      const wrongs = pickRandom(pool.map(p => p.country), 3, item.country);
      const opts = shuffle([item.country, ...wrongs]);
      return {
        text: `Which country uses the "${item.currency}"?`,
        visual: "", options: opts, answer: item.country,
        explanation: `${item.currency} is the currency of ${item.country}.`,
      };
    }
  }

  /* =================================================================
     RENDER QUESTION
     ================================================================= */
  function renderQuestion() {
    const q = questions[currentIndex];

    $counter.textContent = `${currentIndex + 1} / ${questions.length}`;
    $catLabel.textContent = q.sourceCategory || selectedCategory;
    $progress.style.width = `${((currentIndex) / questions.length) * 100}%`;
    $scoreDisp.textContent = `Score: ${score}`;

    $qText.textContent = q.text;
    $qVisual.innerHTML = (q.visualType === "flag" && q.visual) ? flagImg(q.visual) : "";

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

    $feedback.classList.add("hidden");
    $feedback.className = "feedback hidden";

    // streak display
    if (currentStreak > 0) {
      $streakDisp.textContent = `🔥 ${currentStreak}`;
      $streakDisp.classList.remove("hidden");
      if (currentStreak >= 5) $streakDisp.classList.add("big-streak");
      else $streakDisp.classList.remove("big-streak");
    } else {
      $streakDisp.classList.add("hidden");
      $streakDisp.classList.remove("big-streak");
    }

    if (timedMode) {
      startTimer();
    } else {
      clearInterval(timer);
      $timerDisp.textContent = "♾️ Untimed";
      $timerDisp.classList.remove("warning");
    }
    questionStartTime = Date.now();
  }

  /* =================================================================
     TIMER
     ================================================================= */
  function startTimer() {
    clearInterval(timer);
    timeLeft = TIME_PER_QUESTION;
    $timerDisp.textContent = `⏱ ${timeLeft}s`;
    $timerDisp.classList.remove("warning");
    timer = setInterval(() => {
      timeLeft--;
      $timerDisp.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 5) $timerDisp.classList.add("warning");
      if (timeLeft <= 0) { clearInterval(timer); handleTimeout(); }
    }, 1000);
  }

  function handleTimeout() {
    const q = questions[currentIndex];
    lockOptions(null, q);
    showFeedback(false, q.answer, q.explanation);
    currentStreak = 0;
    $streakDisp.classList.add("hidden");
    $streakDisp.classList.remove("big-streak");

    if (q.sourceCountry) recordCountry(q.sourceCountry, false);

    answers.push({
      question: q.text, visual: q.visual || "", visualType: q.visualType || "",
      correct: q.answer, chosen: "⏱ Time's up", isCorrect: false,
      timeTaken: TIME_PER_QUESTION, sourceCountry: q.sourceCountry || "",
    });
    setTimeout(nextQuestion, 1500);
  }

  /* =================================================================
     ANSWER HANDLING
     ================================================================= */
  function handleAnswer(btn, chosen, q) {
    clearInterval(timer);
    const timeTaken = ((Date.now() - questionStartTime) / 1000).toFixed(1);
    const isCorrect = chosen === q.answer;

    if (isCorrect) {
      score++;
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      $streakDisp.textContent = `🔥 ${currentStreak}`;
      $streakDisp.classList.remove("hidden", "pop");
      void $streakDisp.offsetWidth;
      $streakDisp.classList.add("pop");
      if (currentStreak >= 5) $streakDisp.classList.add("big-streak");
    } else {
      currentStreak = 0;
      $streakDisp.classList.add("hidden");
      $streakDisp.classList.remove("big-streak");
    }

    if (q.sourceCountry) recordCountry(q.sourceCountry, isCorrect);

    lockOptions(btn, q);
    showFeedback(isCorrect, q.answer, q.explanation);

    answers.push({
      question: q.text, visual: q.visual || "", visualType: q.visualType || "",
      correct: q.answer, chosen, isCorrect, timeTaken: parseFloat(timeTaken),
      sourceCountry: q.sourceCountry || "",
    });
    setTimeout(nextQuestion, 1200);
  }

  function lockOptions(clickedBtn, q) {
    const btns = $options.querySelectorAll(".option-btn");
    btns.forEach(b => {
      b.classList.add("locked");
      b.style.pointerEvents = "none";
      const val = b.dataset.code || b.textContent.slice(1);
      if (val === q.answer) b.classList.add("correct-answer");
      if (b === clickedBtn && val !== q.answer) b.classList.add("wrong-answer");
    });
  }

  function showFeedback(isCorrect, correctAnswer, explanation) {
    $feedback.classList.remove("hidden", "correct", "wrong");
    if (isCorrect) {
      $feedback.classList.add("correct");
      let msg = "✅ Correct!";
      if (currentStreak >= 3) msg += ` 🔥 ${currentStreak} in a row!`;
      $feedback.innerHTML = msg;
    } else {
      $feedback.classList.add("wrong");
      $feedback.innerHTML = `❌ Wrong! Answer: ${correctAnswer}${explanation ? `<div class="explanation">💡 ${explanation}</div>` : ""}`;
    }
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) showResults();
    else renderQuestion();
  }

  /* =================================================================
     RESULTS
     ================================================================= */
  function showResults() {
    clearInterval(timer);
    showScreen($result);

    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const wrong = total - score;
    const avgTime = (answers.reduce((s, a) => s + a.timeTaken, 0) / total).toFixed(1);

    // Update all-time best streak
    if (bestStreak > appData.allTimeBestStreak) {
      appData.allTimeBestStreak = bestStreak;
    }

    // Save to history
    appData.history.unshift({
      date: new Date().toISOString(),
      category: selectedCategory,
      total, correct: score, pct, bestStreak,
    });
    if (appData.history.length > 50) appData.history = appData.history.slice(0, 50);
    saveData();

    let emoji, title, message;
    if (pct === 100)    { emoji = "🏆"; title = "Perfect Score!"; message = "You're a world trivia master!"; }
    else if (pct >= 80) { emoji = "🌟"; title = "Excellent!"; message = "Impressive knowledge of the world!"; }
    else if (pct >= 60) { emoji = "👏"; title = "Great Job!"; message = "You know quite a lot!"; }
    else if (pct >= 40) { emoji = "😊"; title = "Good Effort!"; message = "Keep learning and try again!"; }
    else                { emoji = "📚"; title = "Keep Learning!"; message = "The world has so much to teach us!"; }

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
    document.getElementById("stat-streak").textContent = bestStreak;

    // Show/hide retry wrong button
    const hasWrong = answers.some(a => !a.isCorrect);
    $retryWrong.classList.toggle("hidden", !hasWrong);

    // Review list
    const $review = document.getElementById("review-list");
    $review.innerHTML = "";
    answers.forEach((a, i) => {
      const div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML = `
        <span class="review-icon">${a.isCorrect ? "✅" : "❌"}</span>
        <div class="review-detail">
          <div class="review-q">${i + 1}. ${a.visualType === "flag" && a.visual ? `<img src="https://flagcdn.com/w80/${a.visual}.png" class="review-flag" /> ` : ""}${a.question}</div>
          <div class="review-a">
            ${a.isCorrect
              ? `<span class="correct-text">${a.correct}</span>`
              : `<span class="wrong-text">${a.chosen}</span><span class="correct-text">${a.correct}</span>`}
          </div>
        </div>`;
      $review.appendChild(div);
    });
  }

  /* =================================================================
     LEARN / FLASHCARD MODE
     ================================================================= */
  function buildLearnCards() {
    // Merge all data into unified cards
    const flagMap = {}, countryMap = {}, langMap = {}, currMap = {};
    TRIVIA_DATA.flags.forEach(f => flagMap[f.country] = f.code);
    TRIVIA_DATA.countries.forEach(c => countryMap[c.country] = c);
    TRIVIA_DATA.languages.forEach(l => langMap[l.country] = l.language);
    TRIVIA_DATA.currencies.forEach(c => currMap[c.country] = c.currency);

    let cards = TRIVIA_DATA.countries.map(c => ({
      country: c.country,
      code: flagMap[c.country] || "",
      capital: c.capital,
      continent: c.continent,
      language: langMap[c.country] || "N/A",
      currency: currMap[c.country] || "N/A",
    }));

    // Filter by region
    if (learnRegion !== "all") {
      cards = cards.filter(c => c.continent === learnRegion);
    }

    // Sort
    if (learnSort === "alpha") {
      cards.sort((a, b) => a.country.localeCompare(b.country));
    } else if (learnSort === "random") {
      cards = shuffle(cards);
    } else if (learnSort === "weakest") {
      cards.sort((a, b) => {
        const accA = getCountryAccuracy(a.country);
        const accB = getCountryAccuracy(b.country);
        // Never tested first, then lowest accuracy
        if (accA === -1 && accB === -1) return a.country.localeCompare(b.country);
        if (accA === -1) return -1;
        if (accB === -1) return 1;
        return accA - accB;
      });
    }

    learnCards = cards;
  }

  function renderFlashcard() {
    if (learnCards.length === 0) return;
    const card = learnCards[learnIndex];

    $learnCounter.textContent = `${learnIndex + 1} / ${learnCards.length}`;
    $flashcard.classList.remove("flipped");

    // Front
    $fcFlag.src = card.code ? `https://flagcdn.com/w320/${card.code}.png` : "";
    $fcFlag.style.display = card.code ? "block" : "none";
    $fcCountry.textContent = card.country;

    // Back
    $fcFlagBack.src = card.code ? `https://flagcdn.com/w160/${card.code}.png` : "";
    $fcFlagBack.style.display = card.code ? "block" : "none";
    $fcCountryBack.textContent = card.country;
    $fcCapital.textContent = card.capital;
    $fcContinent.textContent = card.continent;
    $fcLanguage.textContent = card.language;
    $fcCurrency.textContent = card.currency;

    // Accuracy indicator
    const acc = getCountryAccuracy(card.country);
    $fcKnow.textContent = acc === -1 ? "🆕 Not tested yet" :
      acc >= 0.8 ? `✅ ${Math.round(acc * 100)}% accuracy` :
      acc >= 0.5 ? `⚠️ ${Math.round(acc * 100)}% accuracy` :
      `❌ ${Math.round(acc * 100)}% accuracy`;

    $fcPrev.disabled = learnIndex === 0;
    $fcNext.disabled = learnIndex === learnCards.length - 1;
  }

  $flashcard.addEventListener("click", () => {
    $flashcard.classList.toggle("flipped");
  });

  $fcPrev.addEventListener("click", () => {
    if (learnIndex > 0) { learnIndex--; renderFlashcard(); }
  });

  $fcNext.addEventListener("click", () => {
    if (learnIndex < learnCards.length - 1) { learnIndex++; renderFlashcard(); }
  });

  $fcKnow.addEventListener("click", (e) => {
    e.stopPropagation();
    // Mark as known and move to next
    if (learnIndex < learnCards.length - 1) { learnIndex++; renderFlashcard(); }
  });

  $learnBack.addEventListener("click", () => goHome());

  /* =================================================================
     STATISTICS DASHBOARD
     ================================================================= */
  function renderStats() {
    const h = appData.history;
    const cs = appData.countryStats;

    // Overview
    document.getElementById("total-games").textContent = h.length;
    const totalCorrect = h.reduce((s, g) => s + g.correct, 0);
    const totalQ = h.reduce((s, g) => s + g.total, 0);
    document.getElementById("total-correct").textContent = totalCorrect;
    document.getElementById("overall-accuracy").textContent = totalQ ? Math.round((totalCorrect / totalQ) * 100) + "%" : "0%";
    document.getElementById("all-time-streak").textContent = appData.allTimeBestStreak;

    // Category breakdown
    const catDiv = document.getElementById("category-stats");
    catDiv.innerHTML = "";
    const categories = ["flags", "countries", "languages", "currencies", "mixed"];
    const catEmojis = { flags: "🏳️", countries: "🗺️", languages: "🗣️", currencies: "💰", mixed: "🎲" };
    categories.forEach(cat => {
      const games = h.filter(g => g.category === cat);
      if (games.length === 0) return;
      const correct = games.reduce((s, g) => s + g.correct, 0);
      const total = games.reduce((s, g) => s + g.total, 0);
      const acc = Math.round((correct / total) * 100);
      const el = document.createElement("div");
      el.className = "cat-stat-row";
      el.innerHTML = `
        <span class="cat-stat-name">${catEmojis[cat]} ${cat}</span>
        <div class="cat-stat-bar-wrap">
          <div class="cat-stat-bar" style="width:${acc}%;background:${acc >= 70 ? 'var(--correct)' : acc >= 40 ? 'var(--accent3)' : 'var(--wrong)'}"></div>
        </div>
        <span class="cat-stat-pct">${acc}%</span>
        <span class="cat-stat-detail">${games.length} games</span>`;
      catDiv.appendChild(el);
    });

    // Continent knowledge
    const contDiv = document.getElementById("continent-stats");
    contDiv.innerHTML = "";
    const continents = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
    continents.forEach(cont => {
      const countries = TRIVIA_DATA.countries.filter(c => c.continent === cont);
      let tested = 0, totalCorr = 0, totalWrong = 0;
      countries.forEach(c => {
        const s = cs[c.country];
        if (s && (s.correct + s.wrong) > 0) {
          tested++;
          totalCorr += s.correct;
          totalWrong += s.wrong;
        }
      });
      const acc = (totalCorr + totalWrong) > 0 ? Math.round((totalCorr / (totalCorr + totalWrong)) * 100) : 0;
      const coverage = Math.round((tested / countries.length) * 100);
      const el = document.createElement("div");
      el.className = "cont-stat-row";
      el.innerHTML = `
        <span class="cont-stat-name">${cont}</span>
        <div class="cont-stat-bars">
          <div class="cont-stat-bar-wrap">
            <div class="cont-stat-bar accuracy" style="width:${acc}%"></div>
          </div>
          <div class="cont-stat-bar-wrap">
            <div class="cont-stat-bar coverage" style="width:${coverage}%"></div>
          </div>
        </div>
        <div class="cont-stat-labels">
          <span class="cont-stat-pct">${acc}% accuracy</span>
          <span class="cont-stat-pct dim">${tested}/${countries.length} countries tested</span>
        </div>`;
      contDiv.appendChild(el);
    });

    // Recent games history
    const histDiv = document.getElementById("history-list");
    histDiv.innerHTML = "";
    if (h.length === 0) {
      histDiv.innerHTML = '<p class="no-data">No games played yet. Start a quiz!</p>';
    } else {
      h.slice(0, 15).forEach(g => {
        const d = new Date(g.date);
        const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        const el = document.createElement("div");
        el.className = "history-item";
        el.innerHTML = `
          <span class="history-date">${dateStr} ${timeStr}</span>
          <span class="history-cat">${g.category}</span>
          <span class="history-score ${g.pct >= 70 ? 'good' : g.pct >= 40 ? 'ok' : 'bad'}">${g.correct}/${g.total} (${g.pct}%)</span>`;
        histDiv.appendChild(el);
      });
    }
  }

  $clearStats.addEventListener("click", () => {
    if (confirm("Are you sure? This will erase all your score history, statistics, and learning progress.")) {
      appData = defaultData();
      saveData();
      renderStats();
    }
  });

  /* =================================================================
     NAVIGATION
     ================================================================= */
  function showScreen(screen) {
    [$start, $quiz, $result, $learn].forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $retryBtn.addEventListener("click", () => {
    buildQuestions();
    showScreen($quiz);
    renderQuestion();
  });

  $retryWrong.addEventListener("click", () => {
    buildQuestions(true);
    if (questions.length > 0) {
      showScreen($quiz);
      renderQuestion();
    }
  });

  function goHome() {
    clearInterval(timer);
    $catBtns.forEach(b => b.classList.remove("selected"));
    $countBtns.forEach(b => b.classList.remove("selected"));
    selectedCategory = null;
    selectedCount = null;
    currentStreak = 0;
    bestStreak = 0;
    $streakDisp.classList.add("hidden");
    $streakDisp.classList.remove("big-streak");
    $startBtn.disabled = true;
    showScreen($start);
  }

  $homeBtn.addEventListener("click", goHome);

  $exitBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
      goHome();
    }
  });

  // Show stats on initial load if there's data
  if (appData.history.length > 0) {
    // Pre-render stats so they're ready
    setTimeout(() => renderStats(), 100);
  }

})();
