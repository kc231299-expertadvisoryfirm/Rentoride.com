/* =========================================================
   RentoRide — Shared Utilities
   Include this BEFORE page-specific scripts:
   <script src="js/utils.js"></script>
   <script src="js/bikes.js"></script>
   ========================================================= */

/* =========================================================
   MOBILE NAV TOGGLE
   Works with any page that has:
   #menuToggle (button) + #navMenu (nav)
   ========================================================= */

function initMobileNav() {

  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (!menuToggle || !navMenu) return;

  menuToggle.setAttribute("aria-label", "Toggle navigation menu");
  menuToggle.setAttribute("aria-expanded", "false");

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}


/* =========================================================
   PROFILE DROPDOWN MENU
   Works with any page that has:
   #profileBtn (button) + #profileMenu (menu)
   ========================================================= */

function initProfileMenu() {

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  if (!profileBtn || !profileMenu) return;

  profileBtn.setAttribute("aria-haspopup", "true");
  profileBtn.setAttribute("aria-expanded", "false");

  profileBtn.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = profileMenu.classList.toggle("show");
    profileBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", () => {
    profileMenu.classList.remove("show");
    profileBtn.setAttribute("aria-expanded", "false");
  });

  // Prevent menu clicks from closing the menu via the document listener
  profileMenu.addEventListener("click", event => {
    event.stopPropagation();
  });
}


/* =========================================================
   ESCAPE KEY — closes any open modal / menu / sidebar
   Works with elements carrying a ".show" or ".open" or ".active"
   class that represents "visible" state, tagged with
   [data-dismissable] so this stays opt-in per element.
   ========================================================= */

function initEscapeDismiss() {

  document.addEventListener("keydown", event => {

    if (event.key !== "Escape") return;

    document.querySelectorAll("[data-dismissable].show").forEach(el => {
      el.classList.remove("show");
    });

    document.querySelectorAll("[data-dismissable].open").forEach(el => {
      el.classList.remove("open");
    });

    const navMenu = document.getElementById("navMenu");
    if (navMenu) navMenu.classList.remove("active");

    const profileMenu = document.getElementById("profileMenu");
    if (profileMenu) profileMenu.classList.remove("show");
  });
}


/* =========================================================
   SIMPLE FOCUS TRAP FOR MODALS
   Call initFocusTrap(modalElement) when a modal opens.
   Add data-dismissable to any modal wrapper to get Escape
   handling for free from initEscapeDismiss().
   ========================================================= */

function initFocusTrap(modalElement) {

  if (!modalElement) return;

  const focusableSelectors =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  const focusable = modalElement.querySelectorAll(focusableSelectors);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  first.focus();

  function trap(event) {
    if (event.key !== "Tab") return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  modalElement.addEventListener("keydown", trap);
}


/* =========================================================
   AUTO-INIT ON EVERY PAGE THAT LOADS THIS FILE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initProfileMenu();
  initEscapeDismiss();
});
