/* =========================================================
   RentoRide — Login / Signup JS  (real Supabase auth)

   REQUIRES (include before this file, in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/login.js"></script>

   Replaces the previous stubbed version where submit handlers
   just did `await new Promise(r => setTimeout(r, 600))` and
   showed a fake success message without calling Supabase at all.

   UI/validation logic (tabs, password strength meter, show/hide,
   phone digit filter, account-type toggle) is unchanged from the
   working version — only the two submit handlers and the account
   type toggle's effect on redirect are new/changed.
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

  function showMessage(message, isError = true) {
    authMessage.textContent = message;
    authMessage.classList.add("show");
    authMessage.classList.toggle("is-error", isError);
    authMessage.classList.toggle("is-success", !isError);
  }

  function hideMessage() {
    authMessage.textContent = "";
    authMessage.classList.remove("show", "is-error", "is-success");
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
     ACCOUNT TYPE TOGGLE
     Drives both the signup role AND where login redirects to,
     since a customer and an owner land on different home pages.
     ========================================================= */

  const typeCustomer = document.getElementById("typeCustomer");
  const typeOwner = document.getElementById("typeOwner");
  let accountType = "customer";

  function setAccountType(next) {
    accountType = next;
    typeCustomer.classList.toggle("active", next === "customer");
    typeOwner.classList.toggle("active", next === "owner");
  }

  if (typeCustomer && typeOwner) {
    typeCustomer.addEventListener("click", () => setAccountType("customer"));
    typeOwner.addEventListener("click", () => setAccountType("owner"));
  }


  /* =========================================================
     PHONE VALIDATION
     ========================================================= */

  const signupPhone = document.getElementById("signupPhone");

  if (signupPhone) {
    signupPhone.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });
  }


  /* =========================================================
     PASSWORD STRENGTH METER
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

    if (!value) return { level: "" };
    if (score <= 1) return { level: "weak" };
    if (score <= 3) return { level: "medium" };
    return { level: "strong" };
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
     BUTTON LOADING STATE
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
     POST-LOGIN REDIRECT
     Sends the user to the right home page for their role, and
     honours a ?redirect= param set by RentoRideAuth.requireAuth()
     when they got bounced here from a protected page.
     ========================================================= */

  function redirectAfterAuth(role) {

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirect");

    if (redirectTo) {
      window.location.href = redirectTo;
      return;
    }

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "owner") {
      window.location.href = "owner-dashboard.html";
    } else {
      window.location.href = "index.html";
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

      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        showMessage(error.message || "Invalid email or password.");
        return;
      }

      const { data: profile, error: profileError } =
        await window.supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        showMessage("Login succeeded but your profile could not be loaded. Please contact support.");
        return;
      }

      showMessage("Login successful — redirecting...", false);

      setTimeout(() => redirectAfterAuth(profile.role), 500);

    } catch (err) {

      console.error("Login error:", err);
      showMessage("Something went wrong. Please try again.");

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
    const role = accountType; // "customer" | "owner"
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

      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name, role } // read by the handle_new_user() DB trigger
        }
      });

      if (error) {
        showMessage(error.message || "Could not create account.");
        return;
      }

      // Some Supabase projects require email confirmation before a
      // session exists — handle both cases correctly instead of
      // assuming the user is immediately logged in.
      if (!data.session) {

        showMessage(
          "Account created! Please check your email to confirm your account, then log in.",
          false
        );

        setTimeout(showLogin, 2500);
        return;
      }

      // phone isn't in auth.users by default — store it on the profile
      await window.supabaseClient
        .from("profiles")
        .update({ phone })
        .eq("id", data.user.id);

      showMessage("Account created — redirecting...", false);

      setTimeout(() => redirectAfterAuth(role), 500);

    } catch (err) {

      console.error("Signup error:", err);
      showMessage("Something went wrong. Please try again.");

    } finally {
      setButtonLoading(submitBtn, false, "", `Create Account <span>→</span>`);
    }
  });


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  googleLogin.addEventListener("click", async () => {

    const { error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/index.html" }
    });

    if (error) {
      showMessage("Google sign-in is not configured yet. Please use email/password.");
    }
  });


  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */

  forgotPassword.addEventListener("click", async event => {
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

    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
      email,
      { redirectTo: window.location.origin + "/login.html" }
    );

    if (error) {
      showMessage(error.message || "Could not send reset email.");
      return;
    }

    showMessage("Password reset link sent — check your email.", false);
  });


  /* =========================================================
     ALREADY LOGGED IN? — skip the form entirely
     ========================================================= */

  (async () => {
    const current = await window.RentoRideAuth.getCurrentUser();
    if (current) redirectAfterAuth(current.profile.role);
  })();

});
