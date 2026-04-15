(() => {
  'use strict';

  // Année dans le footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nav : fond opaque au scroll
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Ferme le menu au clic sur un lien
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal au scroll — sections, cartes, items timeline
  const revealTargets = document.querySelectorAll(
    '.section-head, .about-grid > *, .comp-card, .timeline-item, .lang-card, .contact-card, .hero-content > *'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => io.observe(el));
  } else {
    // Fallback : tout affiché
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // =========================================================
  // Formulaire de contact — Formspree AJAX
  // =========================================================
  const form = document.getElementById('contact-form');
  if (form) {
    const feedback = form.querySelector('.form-feedback');
    const submit = form.querySelector('.form-submit');
    const btnLabel = submit ? submit.querySelector('.btn-label') : null;

    const setFeedback = (msg, type) => {
      if (!feedback) return;
      feedback.textContent = msg;
      feedback.classList.remove('success', 'error');
      if (type) feedback.classList.add(type);
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Validation HTML5
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Détection endpoint non configuré
      const endpoint = form.getAttribute('action') || '';
      if (endpoint.includes('YOUR_FORMSPREE_ID')) {
        setFeedback("⚠ Formulaire non configuré — remplace YOUR_FORMSPREE_ID dans index.html par l'ID Formspree.", 'error');
        return;
      }

      submit.disabled = true;
      if (btnLabel) btnLabel.textContent = 'Envoi…';
      setFeedback('', null);

      try {
        const data = new FormData(form);
        const response = await fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          form.reset();
          setFeedback('✓ Merci, votre message a bien été envoyé. Je reviens vers vous rapidement.', 'success');
        } else {
          const payload = await response.json().catch(() => ({}));
          const errMsg = (payload && payload.errors && payload.errors.length)
            ? payload.errors.map(e => e.message).join(', ')
            : "Une erreur est survenue. Merci de réessayer ou de m'écrire directement par e-mail.";
          setFeedback('✗ ' + errMsg, 'error');
        }
      } catch (err) {
        setFeedback("✗ Impossible d'envoyer le message (vérifiez votre connexion).", 'error');
      } finally {
        submit.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Envoyer le message';
      }
    });
  }

  // =========================================================
  // Bannière RGPD
  // =========================================================
  const CONSENT_KEY = 'ss-portfolio-consent-v1';
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');

  if (banner && acceptBtn) {
    let already = null;
    try { already = localStorage.getItem(CONSENT_KEY); } catch (e) { /* storage indisponible */ }

    if (!already) {
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.add('visible'));
    }

    acceptBtn.addEventListener('click', () => {
      try { localStorage.setItem(CONSENT_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      banner.classList.remove('visible');
      setTimeout(() => { banner.hidden = true; }, 400);
    });
  }

  // =========================================================
  // Engrenages pilotés par le scroll — rotation simultanée
  // Chaque engrenage tourne en sens alterné (engrenage 1 horaire,
  // engrenage 2 anti-horaire, etc.) pour donner l'illusion d'une
  // chaîne mécanique qui s'actionne quand la page scrolle.
  // =========================================================
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduce) {
    const gears = Array.from(document.querySelectorAll('.gear'));
    if (gears.length) {
      // Coefficient : degrés par pixel scrollé (identique à tous = simultané)
      const DEG_PER_PX = 0.35;

      // Sens alternés pour effet d'engrenage qui s'entraîne
      const directions = gears.map((_, i) => (i % 2 === 0 ? 1 : -1));

      let ticking = false;
      const updateGears = () => {
        const y = window.scrollY;
        const baseRotation = y * DEG_PER_PX;
        gears.forEach((gear, i) => {
          gear.style.transform = `rotate(${baseRotation * directions[i]}deg)`;
        });
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateGears);
      }, { passive: true });

      // Position initiale
      updateGears();
    }
  }
})();
