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

function setupArchiveConsole() {
  const buttons = $$(".filter-button");
  const items = $$(".archive-item");
  const detail = {
    title: $("#detailTitle"),
    text: $("#detailText"),
    code: $("#detailCode"),
    access: $("#detailAccess"),
    runtime: $("#detailRuntime"),
    state: $("#detailState")
  };

  if (!buttons.length || !items.length) return;

  const setActiveItem = (item) => {
    if (!item || item.hidden) return;

    items.forEach((archiveItem) => {
      archiveItem.classList.toggle("is-selected", archiveItem === item);
    });

    detail.title.textContent = item.dataset.title || "";
    detail.text.textContent = item.dataset.text || "";
    detail.code.textContent = item.dataset.code || "";
    detail.access.textContent = item.dataset.access || "";
    detail.runtime.textContent = item.dataset.runtime || "";
    detail.state.textContent = item.dataset.state || "";
  };

  const applyFilter = (filter) => {
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === filter);
    });

    items.forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.category !== filter;
    });

    const selectedItem = items.find((item) => item.classList.contains("is-selected") && !item.hidden);
    setActiveItem(selectedItem || items.find((item) => !item.hidden));
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter || "all");
    });
  });

  items.forEach((item) => {
    item.addEventListener("click", () => setActiveItem(item));
    item.addEventListener("focus", () => setActiveItem(item));
  });
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;

    if (!CONTACT_WEBHOOK_URL) {
      status.textContent = "Webhook à configurer dans app.js.";
      return;
    }

    const submitButton = $("button[type='submit']", form);
    submitButton.disabled = true;
    status.textContent = "Envoi...";

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
      status.textContent = "Message envoyé.";
    } catch {
      status.textContent = "Envoi impossible. Vérifie le webhook.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

setupMobileNav();
setupArchiveConsole();
setupCurrentYear();
setupContactForm();
