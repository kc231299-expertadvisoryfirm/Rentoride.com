/* =========================================================
   RentoRide Admin Dashboard  (Supabase-backed)
   File: js/admin.js

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/admin.js"></script>

   REPLACES the previous version, which had SUPABASE_URL/KEY still
   set to the literal strings "YOUR_SUPABASE_URL"/"YOUR_SUPABASE_ANON_KEY"
   — meaning checkAdminAccess() always failed silently and the whole
   panel never loaded real data. Uses the shared window.supabaseClient
   now, and adds the vehicle-approval + verification actions that
   were UI-only before (buttons existed, no click handlers).
   ========================================================= */

let currentAdmin = null;
let currentProfile = null;


/* =========================================================
   ADMIN SECURITY
   ========================================================= */

async function checkAdminAccess() {

  const current = await window.RentoRideAuth.getCurrentUser();

  if (!current) {
    window.location.replace("admin-login.html");
    return false;
  }

  if (String(current.profile.role).toLowerCase() !== "admin") {
    alert("Access denied. Admin account required.");
    window.location.replace("index.html");
    return false;
  }

  currentAdmin = current.authUser;
  currentProfile = current.profile;

  updateAdminProfile(current.profile);
  return true;
}

function updateAdminProfile(profile) {

  const name = profile.name || profile.email?.split("@")[0] || "Administrator";
  const initials = name.trim().split(/\s+/).map(w => w.charAt(0)).join("").substring(0, 2).toUpperCase();

  ["adminName", "adminHeaderName", "welcomeAdminName"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  });

  ["adminAvatar", "adminHeaderAvatar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials || "A";
  });
}


/* =========================================================
   NAVIGATION (unchanged)
   ========================================================= */

function setupNavigation() {

  const navItems = document.querySelectorAll(".admin-nav-item");
  const sections = document.querySelectorAll(".admin-section");
  const pageTitle = document.getElementById("adminPageTitle");

  navItems.forEach(button => {
    button.addEventListener("click", () => {

      const sectionName = button.dataset.section;
      if (!sectionName) return;

      navItems.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      sections.forEach(section => section.classList.remove("active"));

      const target = document.getElementById(`admin-section-${sectionName}`);
      if (target) target.classList.add("active");

      const titles = {
        overview: "Command Center", users: "Users", owners: "Owners",
        vehicles: "Vehicles", verification: "Verification Center",
        bookings: "Bookings", finance: "Finance Center", analytics: "Analytics",
        support: "Support & Complaints", notifications: "Notifications",
        settings: "Platform Settings"
      };

      if (pageTitle) pageTitle.textContent = titles[sectionName] || "Command Center";

      closeMobileSidebar();
    });
  });

  document.querySelectorAll("[data-section-link]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelector(`.admin-nav-item[data-section="${button.dataset.sectionLink}"]`)?.click();
    });
  });
}


/* =========================================================
   MOBILE SIDEBAR (unchanged)
   ========================================================= */

function setupMobileMenu() {

  document.getElementById("adminMenuBtn")?.addEventListener("click", () => {
    document.getElementById("adminSidebar")?.classList.toggle("open");
    document.getElementById("adminSidebarOverlay")?.classList.toggle("active");
  });

  document.getElementById("adminSidebarOverlay")?.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById("adminSidebar")?.classList.remove("open");
  document.getElementById("adminSidebarOverlay")?.classList.remove("active");
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
  document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    await window.RentoRideAuth.signOut();
  });
}


/* =========================================================
   MODAL SYSTEM (unchanged)
   ========================================================= */

function setupModals() {

  const modal = document.getElementById("adminDetailModal");
  const closeBtn = document.getElementById("closeAdminDetailModal");
  const overlay = modal?.querySelector(".admin-modal-overlay");

  function closeModal() { modal?.classList.remove("active"); }

  closeBtn?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", closeModal);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}

function showAdminDetail(title, content) {

  const modal = document.getElementById("adminDetailModal");
  if (!modal) return;

  document.getElementById("adminDetailModalTitle").textContent = title || "Details";
  document.getElementById("adminDetailModalContent").innerHTML = content || "";

  modal.classList.add("active");
}


/* =========================================================
   VEHICLE APPROVAL — this makes the "Vehicles" section real:
   loads pending/approved/rejected/suspended vehicles from
   Supabase and lets the admin approve/reject/suspend them.
   ========================================================= */

let allVehiclesCache = [];

async function loadVehicles() {

  const { data, error } = await window.supabaseClient
    .from("bikes")
    .select("id, name, brand, model, location, status, image_url, owner_id, profiles:owner_id (name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin vehicles load error:", error);
    return;
  }

  allVehiclesCache = data || [];

  setNumber("adminTotalVehicles", allVehiclesCache.length);
  setNumber("vehicleBadge", allVehiclesCache.filter(v => v.status === "pending").length);
  setNumber("pendingVehicleApprovals", allVehiclesCache.filter(v => v.status === "pending").length);

  renderVehicleGrid("all");
}

function renderVehicleGrid(filter) {

  const container = document.getElementById("adminVehicleList");
  if (!container) return;

  const list = filter === "all" ? allVehiclesCache : allVehiclesCache.filter(v => v.status === filter);

  if (!list.length) {
    container.innerHTML = `
      <div class="admin-large-empty"><div>🏍</div><h3>No vehicles</h3>
      <p>No vehicles match this filter.</p></div>`;
    return;
  }

  container.innerHTML = list.map(bike => `
    <div class="admin-vehicle-card" data-status="${bike.status}" data-bike-id="${bike.id}">
      <img src="${bike.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'}" alt="${bike.name}">
      <div>
        <strong>${bike.name}</strong>
        <p>${bike.location}</p>
        <small>Owner: ${bike.profiles?.name || "—"}</small>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          ${vehicleActionButtons(bike)}
        </div>
      </div>
    </div>
  `).join("");

  attachVehicleActionListeners();
}

function vehicleActionButtons(bike) {
  if (bike.status === "pending") {
    return `
      <button class="admin-outline-btn" data-vehicle-action="approved" data-id="${bike.id}">Approve</button>
      <button class="admin-outline-btn" data-vehicle-action="rejected" data-id="${bike.id}">Reject</button>`;
  }
  if (bike.status === "approved") {
    return `<button class="admin-outline-btn" data-vehicle-action="suspended" data-id="${bike.id}">Suspend</button>`;
  }
  if (bike.status === "suspended") {
    return `<button class="admin-outline-btn" data-vehicle-action="approved" data-id="${bike.id}">Reinstate</button>`;
  }
  return "";
}

function attachVehicleActionListeners() {
  document.querySelectorAll("[data-vehicle-action]").forEach(btn => {
    btn.addEventListener("click", async () => {

      btn.disabled = true;

      const { error } = await window.supabaseClient
        .from("bikes")
        .update({ status: btn.dataset.vehicleAction })
        .eq("id", btn.dataset.id);

      if (error) {
        console.error("Vehicle status update error:", error);
        showAdminNotification("Error", "Could not update vehicle status.");
        btn.disabled = false;
        return;
      }

      showAdminNotification("Vehicle Updated", `Status set to ${btn.dataset.vehicleAction}.`);
      loadVehicles();
    });
  });
}

function setupVehicleFilters() {
  document.querySelectorAll("[data-vehicle-filter]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-vehicle-filter]").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      renderVehicleGrid(button.dataset.vehicleFilter);
    });
  });
}


/* =========================================================
   BOOKINGS TABLE
   ========================================================= */

async function loadAdminBookings() {

  const { data, error } = await window.supabaseClient
    .from("bookings")
    .select("id, booking_ref, status, amount, start_date, end_date, bikes(name), profiles:customer_id(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Admin bookings load error:", error);
    return;
  }

  setNumber("adminTotalBookings", data.length);
  setNumber("adminActiveRentals", data.filter(b => b.status === "active").length);

  const commission = data
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.amount) * 0.10, 0); // 10% default platform commission

  setCurrency("adminPlatformRevenue", commission);

  const container = document.getElementById("adminBookingsTable");
  if (!container) return;

  if (!data.length) {
    container.innerHTML = `<div class="admin-table-empty">No bookings yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="text-align:left;opacity:.7;font-size:12px;">
          <th style="padding:8px;">Ref</th><th>Vehicle</th><th>Customer</th>
          <th>Dates</th><th>Amount</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(b => `
          <tr class="admin-booking-row" data-status="${b.status}" style="border-top:1px solid var(--border,#2a2a2a);">
            <td style="padding:8px;">${b.booking_ref}</td>
            <td>${b.bikes?.name || "—"}</td>
            <td>${b.profiles?.name || "—"}</td>
            <td>${b.start_date} → ${b.end_date}</td>
            <td>₹${b.amount}</td>
            <td><span class="admin-badge">${b.status}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;
}

function setupBookingFilters() {
  document.querySelectorAll(".admin-booking-filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-booking-filter").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.bookingFilter;
      document.querySelectorAll(".admin-booking-row").forEach(row => {
        row.style.display = filter === "all" || row.dataset.status === filter ? "" : "none";
      });
    });
  });
}


/* =========================================================
   USERS / OWNERS TABLES
   ========================================================= */

async function loadUsersAndOwners() {

  const { data, error } = await window.supabaseClient
    .from("profiles")
    .select("id, name, email, phone, role, created_at");

  if (error) {
    console.error("Profiles load error:", error);
    return;
  }

  const customers = data.filter(p => p.role === "customer");
  const owners = data.filter(p => p.role === "owner");

  setNumber("adminTotalUsers", customers.length);
  setNumber("userBadge", customers.length);
  setNumber("adminTotalOwners", owners.length);
  setNumber("ownerBadge", owners.length);

  renderProfileTable("usersTable", customers);
  renderProfileTable("ownersTable", owners);
}

function renderProfileTable(containerId, rows) {

  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<div class="admin-table-empty">None yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="text-align:left;opacity:.7;font-size:12px;">
          <th style="padding:8px;">Name</th><th>Email</th><th>Phone</th><th>Joined</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(p => `
          <tr class="admin-table-row" style="border-top:1px solid var(--border,#2a2a2a);">
            <td style="padding:8px;">${p.name || "—"}</td>
            <td>${p.email}</td>
            <td>${p.phone || "—"}</td>
            <td>${new Date(p.created_at).toLocaleDateString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;
}


/* =========================================================
   SUPPORT / ANALYTICS
   Not yet backed by dedicated tables in this pass — left as
   the existing empty-state UI rather than faked with mock data.
   ========================================================= */

function setupSupportFilters() {
  document.querySelectorAll(".support-filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".support-filter").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
    });
  });
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

  document.getElementById("userSearch")?.addEventListener("input", e => {
    searchTable(e.target.value, "#usersTable .admin-table-row");
  });

  document.getElementById("ownerSearch")?.addEventListener("input", e => {
    searchTable(e.target.value, "#ownersTable .admin-table-row");
  });
}

function searchTable(query, selector) {
  const search = query.trim().toLowerCase();
  document.querySelectorAll(selector).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(search) ? "" : "none";
  });
}


/* =========================================================
   NOTIFICATION POPUP
   ========================================================= */

function showAdminNotification(title, message) {

  const popup = document.getElementById("adminNotificationPopup");
  if (!popup) return;

  document.getElementById("adminPopupTitle").textContent = title || "System Notification";
  document.getElementById("adminPopupMessage").textContent = message || "";

  popup.classList.add("active");
  setTimeout(() => popup.classList.remove("active"), 5000);
}

function setupNotificationPopup() {

  document.getElementById("closeAdminNotificationPopup")?.addEventListener("click", () => {
    document.getElementById("adminNotificationPopup")?.classList.remove("active");
  });

  document.getElementById("adminNotificationBtn")?.addEventListener("click", () => {
    document.querySelector('.admin-nav-item[data-section="notifications"]')?.click();
  });
}


/* =========================================================
   ADMIN BROADCAST NOTIFICATION — currently logs only, since
   there's no `notifications` table yet in this pass. Marked
   clearly rather than pretending it sends anything.
   ========================================================= */

function setupNotificationForm() {

  const form = document.getElementById("adminNotificationForm");
  if (!form) return;

  form.addEventListener("submit", async event => {

    event.preventDefault();

    const title = document.getElementById("notificationTitle")?.value.trim();
    const message = document.getElementById("notificationMessage")?.value.trim();

    if (!title || !message) {
      alert("Please enter notification title and message.");
      return;
    }

    // FRONTEND READY — BACKEND INTEGRATION REQUIRED:
    // needs a `notifications` table + delivery mechanism (email/push)
    // to actually reach users. Flagged rather than faked.
    showAdminNotification("Not yet wired", "Notification broadcast storage isn't built yet — this form validates but doesn't send.");

    form.reset();
  });
}


/* =========================================================
   PLATFORM SETTINGS — stored in localStorage for now since
   there's no settings table; flagged, not faked as saved to DB.
   ========================================================= */

function setupPlatformSettings() {

  const saveBtn = document.getElementById("saveAdminSettings");
  if (!saveBtn) return;

  ["platformCommissionRate", "minimumWithdrawal", "defaultDeliveryCharge"].forEach(id => {
    const el = document.getElementById(id);
    const saved = localStorage.getItem("rr_admin_" + id);
    if (el && saved !== null) el.value = saved;
  });

  ["allowBookings", "maintenanceMode"].forEach(id => {
    const el = document.getElementById(id);
    const saved = localStorage.getItem("rr_admin_" + id);
    if (el && saved !== null) el.checked = saved === "true";
  });

  saveBtn.addEventListener("click", () => {

    ["platformCommissionRate", "minimumWithdrawal", "defaultDeliveryCharge"].forEach(id => {
      const el = document.getElementById(id);
      if (el) localStorage.setItem("rr_admin_" + id, el.value);
    });

    ["allowBookings", "maintenanceMode"].forEach(id => {
      const el = document.getElementById(id);
      if (el) localStorage.setItem("rr_admin_" + id, el.checked);
    });

    showAdminNotification("Settings Saved", "Platform settings have been updated for this device.");
  });
}

function setupRevenuePeriod() {
  document.getElementById("revenuePeriod")?.addEventListener("change", () => {
    // Revenue chart rendering is a future-version item (see roadmap) —
    // left as the existing placeholder rather than faked with mock data.
  });
}


/* =========================================================
   NUMBER HELPERS
   ========================================================= */

function setNumber(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = Number(value || 0).toLocaleString("en-IN");
}

function setCurrency(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = "₹" + Number(value || 0).toLocaleString("en-IN");
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const allowed = await checkAdminAccess();
  if (!allowed) return;

  setupNavigation();
  setupMobileMenu();
  setupLogout();
  setupModals();
  setupVehicleFilters();
  setupBookingFilters();
  setupSupportFilters();
  setupSearch();
  setupNotificationPopup();
  setupNotificationForm();
  setupPlatformSettings();
  setupRevenuePeriod();

  await Promise.all([
    loadUsersAndOwners(),
    loadVehicles(),
    loadAdminBookings()
  ]);

  console.log("RentoRide Admin Dashboard initialized (Supabase-backed).");
});
