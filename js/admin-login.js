/* =========================================================
   RentoRide — Admin Login JS

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/admin-login.js"></script>

   The client-side role check below is UX only (fast feedback +
   sign-out if a non-admin tries this form). The REAL enforcement
   is server-side: is_admin() in RLS policies means a non-admin
   session simply cannot read admin-only data even if this check
   were bypassed entirely — see db/001_schema.sql.
   ========================================================= */

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

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const show = passwordInput.type === "password";
      passwordInput.type = show ? "text" : "password";
      togglePassword.textContent = show ? "🙈" : "👁";
    });
  }

  function showError(message) {
    if (errorBox) { errorBox.textContent = message; errorBox.style.display = "block"; }
    if (successBox) { successBox.textContent = ""; successBox.style.display = "none"; }
  }

  function showSuccess(message) {
    if (successBox) { successBox.textContent = message; successBox.style.display = "block"; }
    if (errorBox) { errorBox.textContent = ""; errorBox.style.display = "none"; }
  }

  if (!form) return;

  form.addEventListener("submit", async event => {

    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Please enter your admin email and password.");
      return;
    }

    if (loginBtn) loginBtn.disabled = true;
    if (btnText) btnText.textContent = "Authenticating...";
    if (btnLoader) btnLoader.style.display = "flex";

    showError("");

    try {

      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({ email, password });

      if (error) throw new Error("Invalid email or password.");

      const user = data.user;
      if (!user) throw new Error("Unable to verify your account.");

      const { data: profile, error: profileError } =
        await window.supabaseClient
          .from("profiles")
          .select("id, name, email, role")
          .eq("id", user.id)
          .single();

      if (profileError || !profile) {
        await window.supabaseClient.auth.signOut();
        throw new Error("Admin profile not found.");
      }

      if (String(profile.role).toLowerCase() !== "admin") {
        await window.supabaseClient.auth.signOut();
        throw new Error("Access denied. This account is not an administrator.");
      }

      showSuccess("Admin verified. Opening Command Center...");
      if (btnText) btnText.textContent = "Access Granted ✓";

      setTimeout(() => window.location.replace("admin.html"), 700);

    } catch (error) {

      console.error("Admin authentication error:", error);
      showError(error.message || "Unable to login. Please try again.");

      if (loginBtn) loginBtn.disabled = false;
      if (btnText) btnText.textContent = "Access Command Center";
      if (btnLoader) btnLoader.style.display = "none";
    }
  });

});
