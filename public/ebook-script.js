// Ebook Reader Javascript - Cabelo Forte

document.addEventListener('DOMContentLoaded', () => {
  // 1. CHAPTER NAVIGATION
  const navLinks = document.querySelectorAll('.nav-link');
  const chapters = document.querySelectorAll('.ebook-chapter');
  const prevButtons = document.querySelectorAll('.btn-prev-chapter');
  const nextButtons = document.querySelectorAll('.btn-next-chapter');
  const startButton = document.querySelector('.btn-start');
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const topBarTitle = document.getElementById('topBarTitle');

  function showChapter(chapterId) {
    // Hide all chapters
    chapters.forEach(ch => ch.classList.remove('active'));
    
    // Show target chapter
    const targetChapter = document.getElementById(chapterId);
    if (targetChapter) {
      targetChapter.classList.add('active');
      
      // Update sidebar nav state
      navLinks.forEach(link => {
        if (link.getAttribute('data-chapter') === chapterId) {
          link.classList.add('active');
          // Update top bar title
          topBarTitle.textContent = link.textContent;
        } else {
          link.classList.remove('active');
        }
      });

      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Close mobile sidebar if open
      sidebar.classList.remove('open');
    }
  }

  // Bind sidebar links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const chapterId = link.getAttribute('data-chapter');
      showChapter(chapterId);
    });
  });

  // Bind Start Reading button on cover
  if (startButton) {
    startButton.addEventListener('click', () => {
      showChapter('aviso');
    });
  }

  // Bind Prev/Next buttons
  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentActive = document.querySelector('.ebook-chapter.active');
      if (currentActive && currentActive.previousElementSibling && currentActive.previousElementSibling.classList.contains('ebook-chapter')) {
        showChapter(currentActive.previousElementSibling.id);
      }
    });
  });

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentActive = document.querySelector('.ebook-chapter.active');
      if (currentActive && currentActive.nextElementSibling && currentActive.nextElementSibling.classList.contains('ebook-chapter')) {
        showChapter(currentActive.nextElementSibling.id);
      }
    });
  });

  // Mobile Sidebar Toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Close sidebar clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992) {
      if (!sidebar.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });


  // 2. DARK MODE TOGGLE
  const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
  
  // Check local storage for preference
  if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleDarkModeBtn.innerHTML = '☀️';
  }

  toggleDarkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('dark-mode', 'enabled');
      toggleDarkModeBtn.innerHTML = '☀️';
    } else {
      localStorage.setItem('dark-mode', 'disabled');
      toggleDarkModeBtn.innerHTML = '🌙';
    }
  });


  // 3. PRINT / PDF SAVE EXPORT
  const printBtn = document.getElementById('printPdf');
  printBtn.addEventListener('click', () => {
    window.print();
  });


  // 4. DAILY CHECKLIST WIDGET
  const checklistContainer = document.getElementById('dailyChecklist');
  const checklistItems = [
    { id: 'check-tonico-m', label: 'Tônico / Minoxidil (Manhã)' },
    { id: 'check-tonico-n', label: 'Tônico / Minoxidil (Noite)' },
    { id: 'check-suplemento', label: 'Suplemento / Vitaminas' },
    { id: 'check-massagem', label: 'Massagem Capilar (4 min)' },
    { id: 'check-shampoo', label: 'Higienização do Couro' }
  ];

  function renderChecklist() {
    checklistContainer.innerHTML = '';
    
    checklistItems.forEach(item => {
      const isChecked = localStorage.getItem(item.id) === 'true';
      
      const label = document.createElement('label');
      label.className = `checklist-item ${isChecked ? 'checked' : ''}`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = isChecked;
      
      checkbox.addEventListener('change', () => {
        localStorage.setItem(item.id, checkbox.checked);
        label.classList.toggle('checked', checkbox.checked);
      });
      
      const span = document.createElement('span');
      span.textContent = item.label;
      
      label.appendChild(checkbox);
      label.appendChild(span);
      checklistContainer.appendChild(label);
    });
  }

  renderChecklist();


  // 5. ESSENTIAL OIL DILUTION CALCULATOR
  const carrierSize = document.getElementById('carrierSize');
  const dilutionRate = document.getElementById('dilutionRate');
  const calcResult = document.getElementById('calcResult');

  function calculateDrops() {
    const size = parseInt(carrierSize.value, 10);
    const percentage = parseFloat(dilutionRate.value);
    
    // Formula: ml * percentage_decimal * drops_per_ml (approx 20 drops per ml)
    const drops = Math.round(size * (percentage / 100) * 20);
    
    calcResult.innerHTML = `Adicione <strong>${drops} gotas</strong> do óleo essencial ao óleo vegetal carreador para atingir ${percentage}%.`;
  }

  carrierSize.addEventListener('change', calculateDrops);
  dilutionRate.addEventListener('change', calculateDrops);
  calculateDrops(); // Init


  // 6. SCALP MASSAGE TIMER
  const timerDisplay = document.getElementById('timerDisplay');
  const timerStartBtn = document.getElementById('timerStart');
  const timerResetBtn = document.getElementById('timerReset');
  const timerTip = document.getElementById('timerTip');

  let timerInterval = null;
  let timeRemaining = 240; // 4 minutes

  const tips = [
    { time: 180, text: "Etapa 1: Deslizamento Suave - Aqueça o couro cabeludo com movimentos circulares na nuca e laterais." },
    { time: 90, text: "Etapa 2: Pressão Firme - Pressione as polpas dos dedos e mova a pele sobre o crânio (sem esfregar fios)." },
    { time: 30, text: "Etapa 3: Amassamento e Pinça - Belisque e massageie as áreas de maior rarefação (entradas e coroa)." },
    { time: 0, text: "Etapa 4: Finalização - Deslize suavemente a mão do topo até a nuca para relaxar os nervos." }
  ];

  function updateTimerTip() {
    const activeTip = tips.find(tip => timeRemaining >= tip.time) || tips[tips.length - 1];
    timerTip.textContent = activeTip.text;
  }

  function displayTime() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function startTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerStartBtn.textContent = 'Iniciar';
      timerStartBtn.style.backgroundColor = 'var(--primary)';
    } else {
      timerStartBtn.textContent = 'Pausar';
      timerStartBtn.style.backgroundColor = '#e11d48'; // Rosy red
      
      timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
          displayTime();
          updateTimerTip();
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          timerStartBtn.textContent = 'Concluído!';
          timerStartBtn.style.backgroundColor = 'var(--accent-mint)';
          // Add sound effect
          try {
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance("Massagem capilar concluída!");
            utterance.lang = "pt-BR";
            synth.speak(utterance);
          } catch(e) {}
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = 240;
    displayTime();
    updateTimerTip();
    timerStartBtn.textContent = 'Iniciar';
    timerStartBtn.style.backgroundColor = 'var(--primary)';
  }

  timerStartBtn.addEventListener('click', startTimer);
  timerResetBtn.addEventListener('click', resetTimer);
  displayTime();
  updateTimerTip();


  // 7. DIAGNOSTIC QUIZ WIDGET
  const quizOptions = document.querySelectorAll('.quiz-option');
  const submitQuizBtn = document.getElementById('submitQuiz');
  const quizResultBox = document.getElementById('quizResult');

  let selectedOptions = {
    q1: null,
    q2: null,
    q3: null,
    q4: null
  };

  quizOptions.forEach(option => {
    option.addEventListener('click', () => {
      const question = option.getAttribute('data-question');
      const value = option.getAttribute('data-val');
      
      // Toggle select styles within the same question group
      document.querySelectorAll(`.quiz-option[data-question="${question}"]`).forEach(opt => {
        opt.classList.remove('selected');
      });
      
      option.classList.add('selected');
      selectedOptions[question] = value;
    });
  });

  submitQuizBtn.addEventListener('click', () => {
    if (!selectedOptions.q1 || !selectedOptions.q2 || !selectedOptions.q3 || !selectedOptions.q4) {
      alert("Por favor, responda a todas as 4 perguntas do questionário.");
      return;
    }

    let aagPoints = 0;
    let efluvioPoints = 0;
    let areataPoints = 0;
    let quebraPoints = 0;

    // Q1
    if (selectedOptions.q1 === 'efluvio') efluvioPoints += 2;
    else if (selectedOptions.q1 === 'aag') aagPoints += 2;
    else if (selectedOptions.q1 === 'areata') areataPoints += 3;
    else if (selectedOptions.q1 === 'quebra') quebraPoints += 3;

    // Q2
    if (selectedOptions.q2 === 'efluvio') efluvioPoints += 1;
    else if (selectedOptions.q2 === 'aag') aagPoints += 1;

    // Q3
    if (selectedOptions.q3 === 'efluvio') efluvioPoints += 2;
    else if (selectedOptions.q3 === 'aag') aagPoints += 0.5;

    // Q4
    if (selectedOptions.q4 === 'aag') aagPoints += 1.5;
    else if (selectedOptions.q4 === 'efluvio') efluvioPoints += 0.5;

    // Calculate maximum
    let resultTitle = "";
    let resultDesc = "";
    let resultColor = "";
    let resultBg = "";

    const maxPoints = Math.max(aagPoints, efluvioPoints, areataPoints, quebraPoints);

    if (maxPoints === areataPoints) {
      resultTitle = "Possível Alopecia Areata";
      resultDesc = "Sua queda se apresenta em falhas circulares isoladas. Esta é uma condição autoimune que ataca o folículo sem destruí-lo de forma permanente, mas exige acompanhamento médico para aplicação de corticoides.";
      resultColor = "#1e3a8a"; // Blue
      resultBg = "#eff6ff";
    } else if (maxPoints === quebraPoints) {
      resultTitle = "Possível Quebra Capilar (Haste)";
      resultDesc = "Seus fios estão se partindo devido a agressões mecânicas, químicas ou térmicas, e não caindo da raiz. Invista em cronograma capilar (reconstrução com queratina/aminoácidos) e evite químicas.";
      resultColor = "#b45309"; // Amber
      resultBg = "#fffbeb";
    } else if (aagPoints > efluvioPoints) {
      resultTitle = "Possível Alopecia Androgenética (Calvície)";
      resultDesc = "Seu padrão sugere afinamento gradual herdado geneticamente, concentrado em áreas específicas (entradas e coroa). O tratamento clínico focado em bloquear o hormônio DHT (como finasterida) e estimular o crescimento (como minoxidil) é o mais recomendado com supervisão médica.";
      resultColor = "#1e3a2f"; // Dark green
      resultBg = "#f5f0e6"; // Gold-light
    } else {
      resultTitle = "Possível Eflúvio Telógeno (Queda Aguda)";
      resultDesc = "Seus cabelos estão caindo de forma difusa e súbita, o que costuma ocorrer 2 a 3 meses após um evento gatilho (estresse, febre, pós-parto, deficiência de vitaminas). A boa notícia é que tende a ser reversível assim que a causa raiz é tratada.";
      resultColor = "#065f46"; // Emerald
      resultBg = "#ecfdf5";
    }

    quizResultBox.style.display = 'block';
    quizResultBox.style.backgroundColor = resultBg;
    quizResultBox.style.color = resultColor;
    quizResultBox.style.border = `1px solid ${resultColor}`;
    quizResultBox.innerHTML = `<strong>${resultTitle}</strong><br><span style="font-size:0.75rem; line-height:1.4; display:block; margin-top:5px;">${resultDesc}</span>`;
  });
});
