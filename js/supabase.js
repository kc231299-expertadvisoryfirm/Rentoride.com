/* =========================================================
   RentoRide — Supabase Client (single source of truth)

   Every page that needs Supabase includes ONLY this file
   (before any other RentoRide script). It exposes:

     window.supabaseClient   → the client
     window.RentoRideAuth    → auth/session helpers used across pages

   Previously this config was duplicated and inconsistent across
   supabase.js, dashboard.html, admin-login.js and admin.js (the
   last of which even had placeholder "YOUR_SUPABASE_URL" strings
   still in it — that's why the admin panel never worked). This
   file is now the only place the URL/key live.
   ========================================================= */

(function () {

  const SUPABASE_URL = "https://axvttcxrhsblvkmcnqgb.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Nn7T1_HByXSy9Vrxy4XgoA_KlsJAafa";

  if (typeof window.supabase === "undefined") {
    console.error(
      "Supabase JS SDK not loaded. Add this script tag BEFORE supabase.js:\n" +
      '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
    );
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );


  /* =========================================================
     SHARED AUTH HELPERS
     Used by login.js, my-bookings.js, owner-dashboard.js,
     admin.js, list-vehicle.js — one implementation, not five.
     ========================================================= */

  window.RentoRideAuth = {

    // Returns the current session's user + profile row, or null.
    // Never throws — callers just get null on "not logged in".
    async getCurrentUser() {

      const { data: { user }, error } =
        await window.supabaseClient.auth.getUser();

      if (error || !user) return null;

      const { data: profile, error: profileError } =
        await window.supabaseClient
          .from("profiles")
          .select("id, name, email, phone, role, city, avatar_url")
          .eq("id", user.id)
          .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        return null;
      }

      return { authUser: user, profile };
    },

    // Redirects to login.html if not authenticated.
    // Optionally enforces a required role (e.g. "owner", "admin").
    // Returns the {authUser, profile} object on success so the
    // calling page can use it immediately without a second fetch.
    async requireAuth(requiredRole) {

      const current = await this.getCurrentUser();

      if (!current) {
        window.location.replace(
          "login.html?redirect=" + encodeURIComponent(window.location.pathname)
        );
        return null;
      }

      if (requiredRole && current.profile.role !== requiredRole) {

        // admins may access owner-only pages; nobody else gets
        // cross-role access
        if (!(requiredRole === "owner" && current.profile.role === "admin")) {

          alert("You don't have access to this page.");
          window.location.replace("index.html");
          return null;
        }
      }

      return current;
    },

    async signOut() {
      await window.supabaseClient.auth.signOut();
      window.location.href = "login.html";
    }
  };

})();
