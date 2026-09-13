/* =========================================================
   RentoRide — Login / Signup JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");

  const switchToSignup =
    document.getElementById("switchToSignup");

  const switchToLogin =
    document.getElementById("switchToLogin");

  const authMessage =
    document.getElementById("authMessage");

  const googleLogin =
    document.getElementById("googleLogin");

  const forgotPassword =
    document.getElementById("forgotPassword");


  /* =========================================================
     MESSAGE
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
     LOGIN TAB
     ========================================================= */

  function showLogin() {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    formTitle.textContent = "Welcome Back";

    formSubtitle.textContent =
      "Login to continue your RentoRide journey.";

    hideMessage();
  }


  /* =========================================================
     SIGNUP TAB
     ========================================================= */

  function showSignup() {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    formTitle.textContent = "Create Account";

    formSubtitle.textContent =
      "Join RentoRide and start your journey.";

    hideMessage();
  }


  loginTab.addEventListener("click", showLogin);
  signupTab.addEventListener("click", showSignup);

  switchToSignup.addEventListener(
    "click",
    showSignup
  );

  switchToLogin.addEventListener(
    "click",
    showLogin
  );


  /* =========================================================
     SHOW / HIDE PASSWORD
     ========================================================= */

  document
    .querySelectorAll(".show-password")
    .forEach(button => {

      button.addEventListener("click", () => {

        const targetId =
          button.dataset.target;

        const input =
          document.getElementById(targetId);

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

  document
    .querySelectorAll(".role-card")
    .forEach(card => {

      card.addEventListener("click", () => {

        document
          .querySelectorAll(".role-card")
          .forEach(item => {
            item.classList.remove("selected");
          });

        card.classList.add("selected");

        const radio =
          card.querySelector(
            "input[type='radio']"
          );

        if (radio) {
          radio.checked = true;
        }

      });

    });


  /* =========================================================
     LOGIN
     ========================================================= */

  loginForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();

      const password =
        document
          .getElementById("loginPassword")
          .value;


      if (!email || !password) {

        showMessage(
          "Please enter your email and password."
        );

        return;
      }


      /*
       * SUPABASE LOGIN
       *
       * Yaha baad me actual Supabase code
       * connect karenge.
       */


      showMessage(
        "Login system is ready to connect with Supabase."
      );

    }
  );


  /* =========================================================
     SIGNUP
     ========================================================= */

  signupForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const name =
        document
          .getElementById("signupName")
          .value
          .trim();

      const phone =
        document
          .getElementById("signupPhone")
          .value
          .trim();

      const email =
        document
          .getElementById("signupEmail")
          .value
          .trim();

      const password =
        document
          .getElementById("signupPassword")
          .value;

      const confirmPassword =
        document
          .getElementById("signupConfirm")
          .value;

      const terms =
        document
          .getElementById("terms")
          .checked;

      const role =
        document.querySelector(
          'input[name="role"]:checked'
        )?.value;


      if (
        !name ||
        !phone ||
        !email ||
        !password ||
        !confirmPassword
      ) {

        showMessage(
          "Please complete all required fields."
        );

        return;
      }


      if (password.length < 6) {

        showMessage(
          "Password must contain at least 6 characters."
        );

        return;
      }


      if (password !== confirmPassword) {

        showMessage(
          "Passwords do not match."
        );

        return;
      }


      if (!terms) {

        showMessage(
          "Please accept the Terms & Privacy Policy."
        );

        return;
      }


      /*
       * Selected role:
       *
       * customer = Rent a Vehicle
       * owner    = List My Vehicle
       */


      showMessage(
        `Account form ready. Selected role: ${role}.`
      );

    }
  );


  /* =========================================================
     GOOGLE LOGIN
     ========================================================= */

  googleLogin.addEventListener(
    "click",
    () => {

      showMessage(
        "Google login will be connected with Supabase next."
      );

    }
  );


  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */

  forgotPassword.addEventListener(
    "click",
    event => {

      event.preventDefault();

      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();


      if (!email) {

        showMessage(
          "Enter your email first, then request a password reset."
        );

        return;
      }


      showMessage(
        "Password reset will be connected with Supabase."
      );

    }
  );

});
