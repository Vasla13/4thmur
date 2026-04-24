const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const CONTACT_WEBHOOK_URL = "";

function setupMobileNav() {
  const toggle = $("#navToggle");
  const nav = $("#primaryNav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Ouvrir la navigation");
  };

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fermer la navigation");
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) {
      close();
      return;
    }
    open();
  });

  $$("a", nav).forEach((link) => link.addEventListener("click", close));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) close();
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
    allItems.forEach(item => {
      if (!visibleItems.includes(item)) {
        item.removeAttribute('data-offset');
        item.hidden = true;
        item.tabIndex = -1;
        item.setAttribute("aria-hidden", "true");
        item.removeAttribute("aria-current");
      } else {
        item.hidden = false;
        // Calcule la position relative au centre (ex: -2, -1, 0, 1, 2)
        const offset = visibleItems.indexOf(item) - currentIndex;
        const isInDeck = Math.abs(offset) <= 3;

        item.setAttribute('data-offset', offset);
        item.tabIndex = isInDeck ? 0 : -1;
        item.setAttribute("aria-hidden", String(!isInDeck));
        item.setAttribute("aria-current", offset === 0 ? "true" : "false");
      }
    });
  };

  const setIndex = (index, shouldFocus = false) => {
    currentIndex = Math.max(0, Math.min(index, visibleItems.length - 1));
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
  setupMobileNav();
  setupJukebox();
  setupCurrentYear();
  setupContactForm();
});
