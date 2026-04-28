const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const CONTACT_WEBHOOK_URL = "";

/* ── Scroll Reveal ── */
function setupReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => obs.observe(el));
}

/* ── Counter animation ── */
function setupCounters() {
  const counters = $$("[data-count]");
  counters.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    let current = 0;
    const step = () => {
      current++;
      el.textContent = current;
      if (current < target) requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ── Parallax on hero wreath ── */
function setupParallax() {
  const hero = $(".command-hero");
  const wreath = $(".wreath");
  if (!hero || !wreath) return;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    wreath.style.transform = `rotateX(${y * -20}deg) rotateY(${x * 25}deg)`;
  }, { passive: true });

  hero.addEventListener("mouseleave", () => {
    wreath.style.transform = "";
  });
}

/* ── Cursor glow ── */
function setupCursorGlow() {
  const glow = $(".cursor-glow");
  if (!glow || window.matchMedia("(pointer: coarse)").matches) return;

  document.addEventListener("mousemove", (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    glow.style.opacity = "1";
  }, { passive: true });
}

// Gestion du Jukebox 3D
function setupJukebox() {
  const buttons = $$(".filter-button");
  const jukebox = $("#jukebox");
  const allItems = $$(".shard-item");

  if (!jukebox || !buttons.length || !allItems.length) return;

  let visibleItems = [...allItems];
  let currentIndex = 0;

  const renderJukebox = () => {
    const len = visibleItems.length;
    allItems.forEach(item => {
      if (!visibleItems.includes(item)) {
        item.removeAttribute('data-offset');
        item.hidden = true;
        item.tabIndex = -1;
        item.setAttribute("aria-hidden", "true");
        item.removeAttribute("aria-current");
        return;
      }

      item.hidden = false;
      const i = visibleItems.indexOf(item);
      // Circular offset: shortest path around the ring
      let offset = i - currentIndex;
      if (offset > len / 2) offset -= len;
      if (offset < -len / 2) offset += len;

      const isInDeck = Math.abs(offset) <= 3;
      item.setAttribute('data-offset', offset);
      item.tabIndex = isInDeck ? 0 : -1;
      item.setAttribute("aria-hidden", String(!isInDeck));
      item.setAttribute("aria-current", offset === 0 ? "true" : "false");
    });
  };

  const setIndex = (index, shouldFocus = false) => {
    const len = visibleItems.length;
    currentIndex = ((index % len) + len) % len;
    renderJukebox();

    if (shouldFocus) {
      visibleItems[currentIndex]?.focus();
    }
  };

  allItems.forEach((item) => {
    const id = $(".shard-id", item)?.textContent?.trim();
    const title = $(".shard-title", item)?.textContent?.trim();

    if (id && title) {
      item.setAttribute("aria-label", `${id} - ${title}`);
    }
  });

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.toggle("is-active", b === btn));
      const filter = btn.dataset.filter;

      visibleItems = allItems.filter(item =>
        filter === 'all' || item.dataset.category === filter
      );

      setIndex(0);
    });
  });

  allItems.forEach(item => {
    item.addEventListener("click", () => {
      if (visibleItems.includes(item)) {
        setIndex(visibleItems.indexOf(item));
      }
    });

    item.addEventListener("focus", () => {
      if (visibleItems.includes(item)) {
        setIndex(visibleItems.indexOf(item));
      }
    });

    item.addEventListener("keydown", (event) => {
      if (!visibleItems.includes(item)) return;

      const keyActions = {
        ArrowLeft: () => setIndex(currentIndex - 1, true),
        ArrowRight: () => setIndex(currentIndex + 1, true),
        Home: () => setIndex(0, true),
        End: () => setIndex(visibleItems.length - 1, true)
      };

      const action = keyActions[event.key];
      if (!action) return;

      event.preventDefault();
      action();
    });
  });

  // Swipe tactile mobile
  let touchStartX = 0;
  jukebox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  jukebox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      setIndex(dx < 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: true });

  // Scroll wheel navigation
  jukebox.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 10) {
      e.preventDefault();
      setIndex(delta > 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: false });

  renderJukebox();
}

function setupCurrentYear() {
  const year = $("#year");
  if (!year) return;
  year.textContent = String(new Date().getFullYear());
}

function setupContactForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  if (!form || !status) return;

  const submitButton = $("button[type='submit']", form);
  if (!submitButton) return;

  if (!CONTACT_WEBHOOK_URL) {
    submitButton.disabled = true;
    submitButton.title = "Configurez CONTACT_WEBHOOK_URL dans src/scripts/app.js";
    status.textContent = "Formulaire en attente de configuration.";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;
    submitButton.disabled = true;
    status.textContent = "Transmission en cours...";

    try {
      const response = await fetch(CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "quatrieme-mur",
          name: data.name,
          email: data.email,
          message: data.message,
          sentAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook error ${response.status}`);
      }

      form.reset();
      status.textContent = "Transmission réussie.";

      setTimeout(() => {
        status.textContent = "";
      }, 5000);

    } catch {
      status.textContent = "Erreur de transmission. Vérifiez la liaison.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupReveal();
  setupCounters();
  setupParallax();
  setupCursorGlow();
  setupJukebox();
  setupCurrentYear();
  setupContactForm();
});
