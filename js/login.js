/* =========================================================
   RentoRide — Login / Signup JS
   Adds: password strength meter, live confirm-match,
   phone digit validation, email regex check, button loading states
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");

  const switchToSignup = document.getElementById("switchToSignup");
  const switchToLogin = document.getElementById("switchToLogin");

  const authMessage = document.getElementById("authMessage");
  const googleLogin = document.getElementById("googleLogin");
  const forgotPassword = document.getElementById("forgotPassword");

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  /* =========================================================
     MESSAGE HELPERS
     ========================================================= */

  function showMessage(message) {
    authMessage.textContent = message;
    authMessage.classList.add("show");
  }

  function hideMessage() {
    authMessage.textContent = "";
    authMessage.classList.remove("show");
  }


  /* =========================================================
     TABS
     ========================================================= */

  function showLogin() {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    formTitle.textContent = "Welcome Back";
    formSubtitle.textContent = "Login to continue your RentoRide journey.";
    hideMessage();
  }

  function showSignup() {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    formTitle.textContent = "Create Account";
    formSubtitle.textContent = "Join RentoRide and start your journey.";
    hideMessage();
  }

  loginTab.addEventListener("click", showLogin);
  signupTab.addEventListener("click", showSignup);
  switchToSignup.addEventListener("click", showSignup);
  switchToLogin.addEventListener("click", showLogin);


  /* =========================================================
     SHOW / HIDE PASSWORD
     ========================================================= */

  document.querySelectorAll(".show-password").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
      } else {
        input.type = "password";
        button.textContent = "Show";
      }
    });
  });


  /* =========================================================
     ROLE SELECTOR
     ========================================================= */

  document.querySelectorAll(".role-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".role-card").forEach(item => {
        item.classList.remove("selected");
      });
      card.classList.add("selected");

      const radio = card.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
    });
  });


  /* =========================================================
     PHONE VALIDATION (digits only, max 10) — mirrors list-vehicle.js
     ========================================================= */

  const signupPhone = document.getElementById("signupPhone");

  if (signupPhone) {
    signupPhone.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
  }


  /* =========================================================
     PASSWORD STRENGTH METER
     Add this markup once, right after #signupPassword's
     .password-wrap in login.html:

     <div class="strength-meter" id="strengthMeter">
       <div class="strength-bar" id="strengthBar"></div>
     </div>
     <small class="strength-label" id="strengthLabel"></small>
     ========================================================= */

  const signupPassword = document.getElementById("signupPassword");
  const strengthBar = document.getElementById("strengthBar");
  const strengthLabel = document.getElementById("strengthLabel");

  function getPasswordStrength(value) {
    let score = 0;

    if (value.length >= 6) score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (!value) return { level: "", score: 0 };
    if (score <= 1) return { level: "weak", score };
    if (score <= 3) return { level: "medium", score };
    return { level: "strong", score };
  }

  if (signupPassword && strengthBar && strengthLabel) {

    signupPassword.addEventListener("input", () => {
      const { level } = getPasswordStrength(signupPassword.value);

      strengthBar.className = "strength-bar";
      strengthLabel.className = "strength-label";

      if (level) {
        strengthBar.classList.add(level);
        strengthLabel.classList.add(level);
      }

      strengthLabel.textContent =
        level === "weak" ? "Weak password — add numbers or symbols" :
        level === "medium" ? "Medium strength" :
        level === "strong" ? "Strong password" :
        "";
    });
  }


  /* =========================================================
     LIVE CONFIRM-PASSWORD MATCH
     Add this markup once, right after #signupConfirm's
     .password-wrap in login.html:

     <small class="match-hint" id="matchHint"></small>
     ========================================================= */

  const signupConfirm = document.getElementById("signupConfirm");
  const matchHint = document.getElementById("matchHint");

  function checkPasswordMatch() {
    if (!signupPassword || !signupConfirm || !matchHint) return;

    if (!signupConfirm.value) {
      matchHint.textContent = "";
      matchHint.className = "match-hint";
      return;
    }

    if (signupPassword.value === signupConfirm.value) {
      matchHint.textContent = "✓ Passwords match";
      matchHint.className = "match-hint match-ok";
    } else {
      matchHint.textContent = "✕ Passwords do not match";
      matchHint.className = "match-hint match-bad";
    }
  }

  if (signupPassword) signupPassword.addEventListener("input", checkPasswordMatch);
  if (signupConfirm) signupConfirm.addEventListener("input", checkPasswordMatch);


  /* =========================================================
     BUTTON LOADING STATE HELPER
     ========================================================= */

  function setButtonLoading(button, isLoading, loadingText, originalText) {
    if (!button) return;

    if (isLoading) {
      button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = loadingText;
    } else {
      button.disabled = false;
      button.innerHTML = originalText || button.dataset.originalText || button.innerHTML;
    }
  }


  /* =========================================================
     LOGIN SUBMIT
     ========================================================= */

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const submitBtn = loginForm.querySelector(".primary-btn");

    if (!email || !password) {
      showMessage("Please enter your email and password.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    hideMessage();
    setButtonLoading(submitBtn, true, "Logging in...");

    try {
      /*
       * SUPABASE LOGIN — connect actual call here.
       * await supabaseClient.auth.signInWithPassword({ email, password });
       */
      await new Promise(resolve => setTimeout(resolve, 600));

      showMessage("Login system is ready to connect with Supabase.");

    } finally {
      setButtonLoading(submitBtn, false, "", `Login <span>→</span>`);
    }
  });


  /* =========================================================
     SIGNUP SUBMIT
     ========================================================= */

  signupForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirm").value;
    const terms = document.getElementById("terms").checked;
    const role = document.querySelector('input[name="role"]:checked')?.value;
    const submitBtn = signupForm.querySelector(".primary-btn");

    if (!name || !phone || !email || !password || !confirmPassword) {
      showMessage("Please complete all required fields.");
      return;
    }

    if (phone.length !== 10) {
      showMessage("Please enter a valid 10 digit mobile number.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    if (!terms) {
      showMessage("Please accept the Terms & Privacy Policy.");
      return;
    }

    hideMessage();
    setButtonLoading(submitBtn, true, "Creating account...");

    try {
      /*
       * SUPABASE SIGNUP — connect actual call here.
       * const { error } = await supabaseClient.auth.signUp({ email, password });
       * Surface error.message directly if error (e.g. "User already registered").
       */
      await new Promise(resolve => setTimeout(resolve, 600));

      showMessage(`Account form ready. Selected role: ${role}.`);

    } finally {
      setButtonLoading(submitBtn, false, "", `Create Account <span>→</span>`);
    }
  });


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  googleLogin.addEventListener("click", () => {
    showMessage("Google login will be connected with Supabase next.");
  });


  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */

  forgotPassword.addEventListener("click", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();

    if (!email) {
      showMessage("Enter your email first, then request a password reset.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showMessage("Please enter a valid email address first.");
      return;
    }

    showMessage("Password reset will be connected with Supabase.");
  });

});
