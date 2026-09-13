const SUPABASE_URL = https://axvttcxrhsblvkmcnqgb.supabase.co/rest/v1/
const SUPABASE_ANON_KEY = sb_publishable_Nn7T1_HByXSy9Vrxy4XgoA_KlsJAafa

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");

  const loginBtn = document.getElementById("adminLoginBtn");
  const btnText = loginBtn?.querySelector(".btn-text");
  const btnLoader = loginBtn?.querySelector(".btn-loader");

  const errorBox = document.getElementById("adminLoginError");
  const successBox = document.getElementById("adminLoginSuccess");

  const togglePassword = document.getElementById("togglePassword");


  /* ===============================
     PASSWORD SHOW / HIDE
  =============================== */

  if (togglePassword) {

    togglePassword.addEventListener("click", () => {

      if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "🙈";

      } else {

        passwordInput.type = "password";
        togglePassword.textContent = "👁";

      }

    });

  }


  /* ===============================
     MESSAGE HELPERS
  =============================== */

  function showError(message) {

    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    }

    if (successBox) {
      successBox.textContent = "";
      successBox.style.display = "none";
    }

  }


  function showSuccess(message) {

    if (successBox) {
      successBox.textContent = message;
      successBox.style.display = "block";
    }

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.style.display = "none";
    }

  }


  /* ===============================
     LOGIN
  =============================== */

  if (!form) return;


  form.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email = emailInput.value.trim();
    const password = passwordInput.value;


    if (!email || !password) {

      showError("Please enter your admin email and password.");

      return;

    }


    /* BUTTON LOADING */

    if (loginBtn) {
      loginBtn.disabled = true;
    }

    if (btnText) {
      btnText.textContent = "Authenticating...";
    }

    if (btnLoader) {
      btnLoader.style.display = "flex";
    }


    showError("");


    try {

      /*
       * SUPABASE CLIENT
       *
       * IMPORTANT:
       * Ye assume karta hai ki tumhare project me
       * supabaseClient already available hai.
       */

      if (typeof supabaseClient === "undefined") {

        throw new Error(
          "Supabase client not found. Check your Supabase JS setup."
        );

      }


      /* ===============================
         AUTH LOGIN
      =============================== */

      const {
        data,
        error
      } = await supabaseClient.auth.signInWithPassword({

        email: email,
        password: password

      });


      if (error) {

        console.error("Login error:", error);

        throw new Error(
          "Invalid email or password."
        );

      }


      const user = data.user;


      if (!user) {

        throw new Error(
          "Unable to verify your account."
        );

      }


      /* ===============================
         GET PROFILE ROLE
      =============================== */

      const {
        data: profile,
        error: profileError
      } = await supabaseClient

        .from("profiles")

        .select("id, name, email, role")

        .eq("id", user.id)

        .single();


      if (profileError || !profile) {

        console.error(
          "Profile error:",
          profileError
        );

        await supabaseClient.auth.signOut();

        throw new Error(
          "Admin profile not found."
        );

      }


      /* ===============================
         ADMIN ROLE CHECK
      =============================== */

      if (
        String(profile.role).toLowerCase() !== "admin"
      ) {

        await supabaseClient.auth.signOut();

        throw new Error(
          "Access denied. This account is not an administrator."
        );

      }


      /* ===============================
         SUCCESS
      =============================== */

      showSuccess(
        "Admin verified. Opening Command Center..."
      );


      if (btnText) {
        btnText.textContent = "Access Granted ✓";
      }


      /*
       * Small delay so user can see
       * successful login message.
       */

      setTimeout(() => {

        window.location.replace("admin.html");

      }, 700);


    } catch (error) {

      console.error(
        "Admin authentication error:",
        error
      );


      showError(
        error.message ||
        "Unable to login. Please try again."
      );


      /* RESET BUTTON */

      if (loginBtn) {
        loginBtn.disabled = false;
      }

      if (btnText) {
        btnText.textContent =
          "Access Command Center";
      }

      if (btnLoader) {
        btnLoader.style.display = "none";
      }

    }

  });

});
