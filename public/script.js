document.addEventListener('DOMContentLoaded', () => {
  // FAQ Accordion
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });
      
      // Toggle current FAQ item
      if (isActive) {
        item.classList.remove('active');
        item.querySelector('.faq-answer').style.maxHeight = null;
      } else {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Reveal elements on scroll (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once revealed, no need to keep observing it
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15, // trigger when 15% of the element is visible
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(element => {
    revealOnScroll.observe(element);
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.startsWith('http') || this.classList.contains('policy-trigger')) return;
      
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Countdown Timer for Offer Section
  let timeInMinutes = 15;
  let currentTime = timeInMinutes * 60;

  function updateTimer() {
    const minutesElement = document.getElementById('timer-minutes');
    const secondsElement = document.getElementById('timer-seconds');
    const heroMinutesElement = document.getElementById('hero-minutes');
    const heroSecondsElement = document.getElementById('hero-seconds');
    
    let minutes = Math.floor(currentTime / 60);
    let seconds = currentTime % 60;

    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

    if (minutesElement) minutesElement.textContent = formattedMinutes;
    if (secondsElement) secondsElement.textContent = formattedSeconds;
    if (heroMinutesElement) heroMinutesElement.textContent = formattedMinutes;
    if (heroSecondsElement) heroSecondsElement.textContent = formattedSeconds;

    if (currentTime <= 0) {
      currentTime = timeInMinutes * 60;
    } else {
      currentTime--;
    }
  }

  // Run timer every second
  if (document.getElementById('timer-minutes') || document.getElementById('hero-minutes')) {
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // ==========================================
  // INTEGRAÇÃO COM BACK-END
  // ==========================================

  // 1. Buscar o preço dinamicamente a partir do servidor (Fallback: 37,90)
  async function fetchProductPrice() {
    try {
      const response = await fetch('/api/price');
      if (response.ok) {
        const data = await response.json();
        const formattedPrice = data.price.toFixed(2).replace('.', ',');
        
        // Atualiza todos os placeholders de preço dinâmicos
        document.querySelectorAll('.dyn-price').forEach(el => {
          el.textContent = formattedPrice;
        });
        
        const mainPrice = document.getElementById('main-product-price');
        if (mainPrice) mainPrice.textContent = formattedPrice;
      }
    } catch (err) {
      // Ignora erro e mantém o fallback estático de R$ 37,90
    }
  }
  fetchProductPrice();

  // 2. Envio do formulário de captura de Leads
  const leadForm = document.getElementById('lead-form');
  const leadMessage = document.getElementById('lead-message');

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('lead-name').value;
      const email = document.getElementById('lead-email').value;
      
      leadMessage.textContent = 'Enviando...';
      leadMessage.style.color = 'var(--text-muted)';
      
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          leadMessage.textContent = 'Guia e dicas enviadas com sucesso!';
          leadMessage.style.color = 'var(--accent-mint)';
          leadForm.reset();
          
          // Meta Pixel Tracking
          if (typeof fbq === 'function') {
            fbq('track', 'Lead', {
              content_name: 'Guia de Prevencao Cabelo Forte',
              status: 'success'
            });
          }
        } else {
          leadMessage.textContent = result.error || 'Erro ao cadastrar. Tente novamente.';
          leadMessage.style.color = '#ef4444';
        }
      } catch (err) {
        console.error(err);
        leadMessage.textContent = 'Erro ao conectar ao servidor.';
        leadMessage.style.color = '#ef4444';
      }
      
      setTimeout(() => {
        leadMessage.textContent = '';
      }, 5000);
    });
  }

  // ==========================================
  // MODAIS DE POLÍTICAS E TERMOS (RODAPÉ)
  // ==========================================
  const policyModal = document.getElementById('policy-modal');
  const closePolicyBtn = document.getElementById('close-policy');
  const policyTitle = document.getElementById('policy-modal-title');
  const policyText = document.getElementById('policy-modal-text');

  const policiesData = {
    privacy: {
      title: "Políticas de Privacidade",
      text: `
        <p><strong>1. Coleta de Informações</strong><br>
        Coletamos informações básicas como nome e endereço de e-mail de forma voluntária quando você se cadastra em nosso site para receber guias capilares gratuitos ou informativos semanais.</p>
        <p style="margin-top: 15px;"><strong>2. Uso das Informações</strong><br>
        Os dados coletados são utilizados exclusivamente para enviar novidades, dicas de nutrição capilar, massagens e atualizações sobre o Método Cabelo Forte. Nós não vendemos ou compartilhamos suas informações pessoais com terceiros sob nenhuma circunstância.</p>
        <p style="margin-top: 15px;"><strong>3. Segurança e Privacidade</strong><br>
        Garantimos que todas as informações de e-mail e cadastro são salvas de forma segura no nosso servidor local cifrado. Você pode solicitar a remoção ou descadastro da lista a qualquer momento clicando no link de remoção no rodapé de nossos informativos.</p>
      `
    },
    terms: {
      title: "Termos de Uso",
      text: `
        <p><strong>1. Natureza Informativa e Educativa</strong><br>
        O Método Cabelo Forte é um e-book/protocolo de caráter puramente educacional e informativo contendo rotinas de massagens capilares e nutrição saudável. As técnicas sugeridas não substituem aconselhamento, diagnósticos ou tratamentos dermatológicos médicos profissionais para alopecia cicatricial ou infecções severas no couro cabeludo.</p>
        <p style="margin-top: 15px;"><strong>2. Resultados</strong><br>
        Os resultados de cura e prevenção da queda capilar dependem diretamente da consistência na aplicação das técnicas e variam de acordo com as particularidades genéticas e o metabolismo de cada pessoa. Não há garantias de reversão total da calvície em áreas onde os folículos já estejam completamente cicatrizados.</p>
        <p style="margin-top: 15px;"><strong>3. Propriedade Intelectual</strong><br>
        Ao adquirir o Cabelo Forte, você obtém uma licença individual de acesso vitalício. A redistribuição comercial, compartilhamento ou venda não autorizada do e-book e videoaulas são estritamente proibidos e passíveis de sanções civis.</p>
      `
    }
  };

  document.body.addEventListener('click', (e) => {
    const trigger = e.target.closest('.policy-trigger');
    if (trigger) {
      e.preventDefault();
      const policyType = trigger.getAttribute('data-policy');
      const data = policiesData[policyType];
      
      if (data) {
        policyTitle.textContent = data.title;
        policyText.innerHTML = data.text;
        policyModal.classList.add('open');
      }
    }
  });

  if (closePolicyBtn) {
    closePolicyBtn.addEventListener('click', () => {
      policyModal.classList.remove('open');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === policyModal) {
      policyModal.classList.remove('open');
    }
  });

  // Track click on Kiwify Checkout links (Initiate Checkout)
  document.querySelectorAll('a[href*="pay.kiwify.com.br"]').forEach(button => {
    button.addEventListener('click', () => {
      if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout', {
          content_name: 'Metodo Cabelo Forte',
          value: 37.90,
          currency: 'BRL'
        });
      }
    });
  });
});
