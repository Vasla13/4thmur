const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const CONTACT_ENDPOINT = "/api/contact";

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

const categoryLabels = {
  all: "Tout",
  signature: "Élite",
  prototype: "Expérimental",
  archive: "Classique"
};

let catalogueItems = [];
let selectedDance = null;
let intelHideTimer = null;

function createShardItem(item) {
  const card = document.createElement("article");
  card.className = "shard-item";
  card.dataset.category = item.category;
  card.dataset.id = item.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${item.id} - ${item.title}`);

  const pins = Array.from({ length: 5 }, () => "<span></span>").join("");
  card.innerHTML = `
    <span class="shard-tag">${item.tag}</span>
    <div class="shard-pins" aria-hidden="true">${pins}</div>
    <span class="shard-id">${item.id}</span>
    <strong class="shard-title">${item.title}</strong>
    <span class="shard-mood">${item.mood}</span>
    <div class="shard-chip" aria-hidden="true"></div>
  `;

  return card;
}

function updateFilterCounts(buttons, items) {
  buttons.forEach((button) => {
    const filter = button.dataset.filter;
    const count = filter === "all"
      ? items.length
      : items.filter(item => item.category === filter).length;

    const countEl = $(".filter-count", button);
    if (countEl) countEl.textContent = String(count);

    const label = categoryLabels[filter] || button.textContent.trim();
    const labelNode = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (labelNode) labelNode.textContent = `${label} `;
  });
}

function renderIntelBubble(item) {
  const bubble = $("#intelBubble");
  if (!bubble || !item) return;

  window.clearTimeout(intelHideTimer);
  $(".intel-title", bubble).textContent = item.title;
  $(".intel-desc", bubble).textContent = item.description;
  $(".intel-grid", bubble).innerHTML = `
    <span><b>ID</b>${item.id}</span>
    <span><b>Niveau</b>${item.rarity}</span>
    <span><b>Intensité</b>${item.intensity}/10</span>
    <span><b>Durée</b>${item.duration}</span>
    <span><b>Statut</b>${item.status}</span>
    <span><b>Accès</b>${item.price}</span>
  `;
  $(".intel-request", bubble).textContent = `Demander ${item.id}`;
  bubble.dataset.activeId = item.id;
  bubble.setAttribute("aria-hidden", "false");
  bubble.classList.remove("is-visible");
  window.requestAnimationFrame(() => {
    bubble.classList.add("is-visible");
  });
}

function hideIntelBubble() {
  const bubble = $("#intelBubble");
  if (!bubble) return;
  bubble.classList.remove("is-visible");
  bubble.setAttribute("aria-hidden", "true");
}

function scheduleIntelHide() {
  window.clearTimeout(intelHideTimer);
  intelHideTimer = window.setTimeout(hideIntelBubble, 160);
}

function requestDance(item) {
  if (!item) return;
  selectedDance = item;

  const form = $("#contactForm");
  if (!form) return;
  const message = $("textarea[name='message']", form);
  const danceId = $("input[name='danceId']", form);
  const danceTitle = $("input[name='danceTitle']", form);
  const selected = $("#selectedDs");

  if (danceId) danceId.value = item.id;
  if (danceTitle) danceTitle.value = item.title;
  if (message && !message.value.trim()) {
    message.value = `Je souhaite obtenir ${item.id} - ${item.title}.`;
  }
  if (selected) {
    selected.hidden = false;
    selected.textContent = `DS sélectionnée: ${item.id} · ${item.title}`;
  }

  $("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => $("input[name='name']", form)?.focus(), 450);
}

// Gestion du Jukebox 3D
async function setupJukebox() {
  const buttons = $$(".filter-button");
  const jukebox = $("#jukebox");
  const bubble = $("#intelBubble");

  if (!jukebox || !buttons.length) return;

  try {
    const response = await fetch(jukebox.dataset.catalogueUrl || "src/data/catalogue.json");
    if (!response.ok) throw new Error(`Catalogue ${response.status}`);
    catalogueItems = await response.json();
  } catch {
    jukebox.innerHTML = '<p class="catalogue-error">Catalogue indisponible.</p>';
    return;
  }

  jukebox.replaceChildren(...catalogueItems.map(createShardItem));

  const allItems = $$(".shard-item", jukebox);
  let visibleItems = [...allItems];
  let currentIndex = 0;

  updateFilterCounts(buttons, catalogueItems);

  const getItemData = (card) => catalogueItems.find(item => item.id === card?.dataset.id);

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

      if (!len) return;
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
    if (!len) {
      renderJukebox();
      return;
    }

    currentIndex = ((index % len) + len) % len;
    renderJukebox();

    if (shouldFocus) {
      visibleItems[currentIndex]?.focus();
    }
  };

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });
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
        renderIntelBubble(getItemData(item));
      }
    });

    item.addEventListener("focus", () => {
      if (visibleItems.includes(item)) {
        setIndex(visibleItems.indexOf(item));
        renderIntelBubble(getItemData(item));
      }
    });

    item.addEventListener("pointerenter", () => {
      if (visibleItems.includes(item)) {
        renderIntelBubble(getItemData(item));
      }
    });

    item.addEventListener("pointerleave", () => {
      scheduleIntelHide();
    });

    item.addEventListener("blur", () => {
      scheduleIntelHide();
    });

    item.addEventListener("keydown", (event) => {
      if (!visibleItems.includes(item)) return;

      const keyActions = {
        ArrowLeft: () => setIndex(currentIndex - 1, true),
        ArrowRight: () => setIndex(currentIndex + 1, true),
        Home: () => setIndex(0, true),
        End: () => setIndex(visibleItems.length - 1, true),
        Enter: () => requestDance(getItemData(item)),
        " ": () => requestDance(getItemData(item))
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
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
      e.preventDefault();
      setIndex(e.deltaX > 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: false });

  bubble?.addEventListener("pointerenter", () => {
    window.clearTimeout(intelHideTimer);
    if (bubble.dataset.activeId) {
      const item = catalogueItems.find(entry => entry.id === bubble.dataset.activeId);
      if (item) renderIntelBubble(item);
    }
  });

  bubble?.addEventListener("pointerleave", scheduleIntelHide);

  const requestButton = bubble ? $(".intel-request", bubble) : null;
  requestButton?.addEventListener("click", () => {
    const item = catalogueItems.find(entry => entry.id === bubble.dataset.activeId);
    if (item) requestDance(item);
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

  if (window.location.protocol === "file:") {
    submitButton.disabled = true;
    submitButton.title = "Servez le site en HTTP pour activer le formulaire";
    status.textContent = "Formulaire disponible via serveur HTTP.";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;

    const payload = {
      name: String(data.name || "").trim(),
      email: String(data.email || "").trim(),
      message: String(data.message || "").trim(),
      danceId: String(data.danceId || "").trim(),
      danceTitle: String(data.danceTitle || "").trim(),
      website: String(data.website || "").trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = "Tous les champs sont requis.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Transmission en cours...";

    try {
      const response = await fetch(form.action || CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = "Erreur de transmission. Vérifiez la liaison.";
        try {
          const details = await response.json();
          if (details?.error) message = details.error;
        } catch {
          // The HTTP status is enough when the response is not JSON.
        }
        throw new Error(message);
      }

      form.reset();
      status.textContent = "Transmission réussie.";

      setTimeout(() => {
        status.textContent = "";
      }, 5000);

    } catch (error) {
      status.textContent = error.message || "Erreur de transmission. Vérifiez la liaison.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupReveal();
  setupParallax();
  setupCursorGlow();
  setupJukebox();
  setupCurrentYear();
  setupContactForm();
});
