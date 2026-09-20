/* =========================================================
   RentoRide — Owner Dashboard JS  (Supabase-backed)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/owner-dashboard.js"></script>

   REPLACES the previous version, which had no data layer at all —
   every stat was hardcoded "0", vehicles/bookings lists never
   populated, and bank account details were saved to plaintext
   localStorage. This version:
     - requires an "owner" (or admin) session
     - loads the owner's own bikes + bookings from Supabase
     - lets the owner accept/reject/mark-active/complete bookings
     - computes earnings from completed+active+accepted bookings
     - saves bank details to the `bank_accounts` table (never
       localStorage), only ever displaying last-4 digits back
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     AUTH — must be an owner (admins may also view)
     ========================================================= */

  const current = await window.RentoRideAuth.requireAuth("owner");
  if (!current) return;

  const ownerId = current.authUser.id;

  ["sidebarOwnerName", "headerOwnerName", "welcomeOwnerName", "profileName"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = current.profile.name;
  });

  ["ownerAvatar", "headerAvatar", "profileLargeAvatar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = (current.profile.name || "O").charAt(0).toUpperCase();
  });

  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const profileLocation = document.getElementById("profileLocation");
  if (profileEmail) profileEmail.textContent = current.profile.email || "—";
  if (profilePhone) profilePhone.textContent = current.profile.phone || "—";
  if (profileLocation) profileLocation.textContent = current.profile.city || "—";


  /* =========================================================
     BASIC ELEMENTS / NAVIGATION (unchanged behaviour)
     ========================================================= */

  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".dashboard-section");
  const pageTitle = document.getElementById("pageTitle");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const menuBtn = document.getElementById("menuBtn");

  const sectionTitles = {
    overview: "Dashboard", vehicles: "My Vehicles", bookings: "Booking Requests",
    earnings: "Earnings", verification: "Verification", notifications: "Notifications",
    profile: "My Profile", settings: "Settings"
  };

  function openSection(sectionName) {
    if (!sectionName) return;
    sections.forEach(s => s.classList.remove("active"));
    document.getElementById("section-" + sectionName)?.classList.add("active");
    navItems.forEach(item => item.classList.toggle("active", item.dataset.section === sectionName));
    if (pageTitle) pageTitle.textContent = sectionTitles[sectionName] || "Dashboard";
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navItems.forEach(item => item.addEventListener("click", () => openSection(item.dataset.section)));

  document.addEventListener("click", event => {
    const link = event.target.closest("[data-section-link]");
    if (!link) return;
    event.preventDefault();
    openSection(link.dataset.sectionLink);
  });

  function openSidebar() { sidebar?.classList.add("open"); sidebarOverlay?.classList.add("show"); }
  function closeSidebar() { sidebar?.classList.remove("open"); sidebarOverlay?.classList.remove("show"); }

  menuBtn?.addEventListener("click", openSidebar);
  sidebarOverlay?.addEventListener("click", closeSidebar);


  /* =========================================================
     DATA STATE
     ========================================================= */

  let myBikes = [];
  let myBookings = [];


  /* =========================================================
     LOAD VEHICLES
     ========================================================= */

  async function loadVehicles() {

    const { data, error } = await window.supabaseClient
      .from("bikes")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Owner vehicles error:", error);
      return;
    }

    myBikes = data || [];
    renderVehicles();
  }

  function statusBadge(status) {
    return `<span class="admin-badge ${status === "approved" ? "" : status === "rejected" ? "danger" : "warning"}">${status}</span>`;
  }

  function renderVehicles() {

    document.getElementById("totalVehicles").textContent = myBikes.length;

    const overviewList = document.getElementById("overviewVehicleList");
    const fullList = document.getElementById("fullVehicleList");

    if (!myBikes.length) {
      const emptyHtml = `
        <div class="empty-state">
          <div>🏍</div>
          <p>No vehicles listed yet.</p>
          <a href="list-vehicle.html">List Your First Vehicle</a>
        </div>`;
      if (overviewList) overviewList.innerHTML = emptyHtml;
      if (fullList) fullList.innerHTML = `
        <div class="large-empty-state">
          <div>🏍</div><h3>No vehicles yet</h3>
          <p>List your first vehicle and start earning.</p>
          <a href="list-vehicle.html" class="primary-btn">List Your Vehicle</a>
        </div>`;
      return;
    }

    const cardHtml = bike => `
      <div class="admin-vehicle-card" data-status="${bike.status}">
        <img src="${bike.image_url || RENTORIDE_FALLBACK_IMAGE_FALLBACK}" alt="${bike.name}">
        <div>
          <strong>${bike.name}</strong>
          <p>${bike.location}</p>
          ${statusBadge(bike.status)}
          <label class="switch" style="margin-top:8px;display:inline-flex;">
            <input type="checkbox" data-bike-id="${bike.id}" class="availability-toggle" ${bike.is_available ? "checked" : ""}>
            <span></span>
          </label>
        </div>
      </div>`;

    if (overviewList) overviewList.innerHTML = myBikes.slice(0, 4).map(cardHtml).join("");
    if (fullList) fullList.innerHTML = myBikes.map(cardHtml).join("");

    document.querySelectorAll(".availability-toggle").forEach(toggle => {
      toggle.addEventListener("change", async () => {

        const { error } = await window.supabaseClient
          .from("bikes")
          .update({ is_available: toggle.checked })
          .eq("id", toggle.dataset.bikeId);

        if (error) {
          showToast("Could not update availability.");
          toggle.checked = !toggle.checked;
        }
      });
    });
  }


  /* =========================================================
     LOAD BOOKINGS
     ========================================================= */

  async function loadBookings() {

    const { data, error } = await window.supabaseClient
      .from("bookings")
      .select(`
        id, booking_ref, start_date, end_date, start_time, end_time,
        status, amount, customer_id,
        bikes ( id, name, image_url ),
        profiles:customer_id ( name, phone )
      `)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Owner bookings error:", error);
      return;
    }

    myBookings = data || [];
    renderBookings();
    renderEarnings();
  }

  function renderBookings(filter = "all") {

    const pendingCount = myBookings.filter(b => b.status === "pending").length;
    document.getElementById("bookingBadge").textContent = pendingCount;
    document.getElementById("totalBookings").textContent = myBookings.length;
    document.getElementById("activeBookings").textContent =
      myBookings.filter(b => b.status === "active").length;

    const filtered = filter === "all" ? myBookings : myBookings.filter(b => b.status === filter);

    const rowHtml = booking => `
      <div class="booking-row" data-status="${booking.status}" style="display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--border,#2a2a2a);gap:12px;flex-wrap:wrap;">
        <div>
          <strong>${booking.booking_ref}</strong> — ${booking.bikes?.name || "Vehicle"}
          <p style="margin:2px 0 0;opacity:.7;font-size:13px;">
            ${booking.profiles?.name || "Customer"} • ${formatDate(booking.start_date)} → ${formatDate(booking.end_date)} • ₹${booking.amount}
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="admin-badge">${booking.status}</span>
          ${bookingActionButtons(booking)}
        </div>
      </div>`;

    const overviewList = document.getElementById("overviewBookingList");
    const fullList = document.getElementById("fullBookingList");

    if (!filtered.length) {
      const emptyHtml = `<div class="empty-state"><div>📋</div><p>No booking requests.</p></div>`;
      if (overviewList) overviewList.innerHTML = emptyHtml;
      if (fullList) fullList.innerHTML = `
        <div class="large-empty-state"><div>📋</div><h3>No bookings found</h3>
        <p>New customer booking requests will appear here.</p></div>`;
    } else {
      if (overviewList) overviewList.innerHTML = myBookings.filter(b => b.status === "pending").slice(0, 4).map(rowHtml).join("") || `<div class="empty-state"><div>📋</div><p>No new booking requests.</p></div>`;
      if (fullList) fullList.innerHTML = filtered.map(rowHtml).join("");
    }

    attachBookingActionListeners();
  }

  function bookingActionButtons(booking) {
    if (booking.status === "pending") {
      return `
        <button class="outline-btn" data-action="accept" data-id="${booking.id}">Accept</button>
        <button class="outline-btn" data-action="reject" data-id="${booking.id}">Reject</button>`;
    }
    if (booking.status === "accepted") {
      return `<button class="outline-btn" data-action="activate" data-id="${booking.id}">Mark Active</button>`;
    }
    if (booking.status === "active") {
      return `<button class="outline-btn" data-action="complete" data-id="${booking.id}">Mark Completed</button>`;
    }
    return "";
  }

  function attachBookingActionListeners() {
    document.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {

        const bookingId = btn.dataset.id;
        const action = btn.dataset.action;

        const nextStatus = {
          accept: "accepted", reject: "rejected",
          activate: "active", complete: "completed"
        }[action];

        if (!nextStatus) return;

        btn.disabled = true;

        const { error } = await window.supabaseClient
          .from("bookings")
          .update({ status: nextStatus })
          .eq("id", bookingId);

        if (error) {
          showToast("Could not update booking.");
          btn.disabled = false;
          return;
        }

        const booking = myBookings.find(b => b.id === bookingId);
        if (booking) booking.status = nextStatus;

        renderBookings();
        renderEarnings();
        showToast("Booking updated.");
      });
    });
  }

  document.querySelectorAll(".booking-filter").forEach(filter => {
    filter.addEventListener("click", () => {
      document.querySelectorAll(".booking-filter").forEach(b => b.classList.remove("active"));
      filter.classList.add("active");
      renderBookings(filter.dataset.bookingFilter);
    });
  });


  /* =========================================================
     EARNINGS
     ========================================================= */

  function renderEarnings() {

    const completed = myBookings.filter(b => b.status === "completed");
    const pendingLike = myBookings.filter(b => ["accepted", "active"].includes(b.status));

    const totalEarnings = completed.reduce((sum, b) => sum + Number(b.amount), 0);
    const pendingEarnings = pendingLike.reduce((sum, b) => sum + Number(b.amount), 0);

    document.getElementById("totalEarnings").textContent = "₹" + totalEarnings.toLocaleString("en-IN");
    document.getElementById("earningsTotal").textContent = "₹" + totalEarnings.toLocaleString("en-IN");
    document.getElementById("pendingEarnings").textContent = "₹" + pendingEarnings.toLocaleString("en-IN");

    // available balance = completed earnings minus already-withdrawn amounts
    const withdrawnTotal = withdrawalHistoryCache
      .filter(w => w.status === "paid")
      .reduce((sum, w) => sum + Number(w.amount), 0);

    document.getElementById("withdrawnAmount").textContent = "₹" + withdrawnTotal.toLocaleString("en-IN");

    const available = Math.max(0, totalEarnings - withdrawnTotal);
    document.getElementById("availableBalance").textContent = "₹" + available.toLocaleString("en-IN");
    document.getElementById("modalAvailableBalance").textContent = "₹" + available.toLocaleString("en-IN");
  }


  /* =========================================================
     WITHDRAWALS
     ========================================================= */

  let withdrawalHistoryCache = [];

  async function loadWithdrawals() {

    const { data, error } = await window.supabaseClient
      .from("withdrawals")
      .select("*")
      .eq("owner_id", ownerId)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Withdrawals error:", error);
      return;
    }

    withdrawalHistoryCache = data || [];
    renderWithdrawalHistory();
    renderEarnings();
  }

  function renderWithdrawalHistory() {

    const container = document.getElementById("withdrawalHistory");
    if (!container) return;

    if (!withdrawalHistoryCache.length) {
      container.innerHTML = `<div class="empty-state">No withdrawal history yet.</div>`;
      return;
    }

    container.innerHTML = withdrawalHistoryCache.map(w => `
      <div class="withdrawal-row" style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border,#2a2a2a);">
        <span>${new Date(w.requested_at).toLocaleDateString("en-IN")}</span>
        <strong>₹${Number(w.amount).toLocaleString("en-IN")}</strong>
        <span class="admin-badge">${w.status}</span>
      </div>
    `).join("");
  }

  const withdrawModal = document.getElementById("withdrawModal");
  const openWithdrawBtn = document.getElementById("openWithdrawBtn");
  const closeWithdrawModal = document.getElementById("closeWithdrawModal");

  function openWithdraw() { withdrawModal?.classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeWithdraw() { withdrawModal?.classList.remove("show"); document.body.style.overflow = ""; }

  openWithdrawBtn?.addEventListener("click", openWithdraw);
  closeWithdrawModal?.addEventListener("click", closeWithdraw);
  withdrawModal?.querySelector(".modal-overlay")?.addEventListener("click", closeWithdraw);

  document.getElementById("confirmWithdrawBtn")?.addEventListener("click", async () => {

    const amountInput = document.getElementById("withdrawAmount");
    const amount = Number(amountInput?.value);

    const availableText = document.getElementById("availableBalance")?.textContent || "₹0";
    const available = Number(availableText.replace(/[₹,\s]/g, "")) || 0;

    if (amount < 500) return showToast("Minimum withdrawal is ₹500.");
    if (amount > available) return showToast("Insufficient available balance.");

    const { data: bank } = await window.supabaseClient
      .from("bank_accounts").select("id").eq("owner_id", ownerId).maybeSingle();

    if (!bank) {
      showToast("Please add a bank account first.");
      closeWithdraw();
      openBankModal();
      return;
    }

    const { error } = await window.supabaseClient
      .from("withdrawals")
      .insert({ owner_id: ownerId, amount });

    if (error) {
      showToast("Could not submit withdrawal request.");
      return;
    }

    showToast("Withdrawal request submitted.");
    if (amountInput) amountInput.value = "";
    closeWithdraw();
    loadWithdrawals();
  });


  /* =========================================================
     BANK ACCOUNT
     ========================================================= */

  const bankModal = document.getElementById("bankModal");

  function openBankModal() { bankModal?.classList.add("show"); document.body.style.overflow = "hidden"; }
  function closeBank() { bankModal?.classList.remove("show"); document.body.style.overflow = ""; }

  document.getElementById("manageBankBtn")?.addEventListener("click", openBankModal);
  document.getElementById("settingsBankBtn")?.addEventListener("click", openBankModal);
  document.getElementById("closeBankModal")?.addEventListener("click", closeBank);
  bankModal?.querySelector(".modal-overlay")?.addEventListener("click", closeBank);

  async function loadBankAccount() {

    const { data: bank } = await window.supabaseClient
      .from("bank_accounts")
      .select("holder_name, account_number_last4, ifsc, bank_name")
      .eq("owner_id", ownerId)
      .maybeSingle();

    const display = document.getElementById("bankAccountDisplay");
    const withdrawBank = document.getElementById("withdrawBankNumber");

    if (!bank) {
      if (withdrawBank) withdrawBank.textContent = "No bank account added";
      return;
    }

    const masked = "•••• •••• " + bank.account_number_last4;

    if (display) {
      display.innerHTML = `
        <div class="bank-icon">🏦</div>
        <div>
          <strong>${bank.bank_name}</strong>
          <p>${bank.holder_name} • ${masked}</p>
          <small>IFSC: ${bank.ifsc}</small>
        </div>`;
    }

    if (withdrawBank) withdrawBank.textContent = `${bank.bank_name} • ${masked}`;
  }

  const bankForm = document.getElementById("bankForm");

  bankForm?.addEventListener("submit", async event => {

    event.preventDefault();

    const holder = document.getElementById("bankHolderName")?.value.trim();
    const account = document.getElementById("bankAccountNumber")?.value.trim();
    const confirmAccount = document.getElementById("confirmBankAccount")?.value.trim();
    const ifsc = document.getElementById("bankIfsc")?.value.trim();
    const bankName = document.getElementById("bankName")?.value.trim();

    if (!holder || !account || !confirmAccount || !ifsc || !bankName) {
      return showToast("Please fill all bank details.");
    }

    if (account !== confirmAccount) {
      return showToast("Account numbers do not match.");
    }

    // NOTE: in production, encrypt `account` server-side (e.g. via a
    // Supabase Edge Function using pgsodium/Vault) before it ever
    // reaches account_number_encrypted. This client-side call sends
    // it over TLS to Supabase directly as an interim measure — do not
    // treat this column as safe to read back to the client.
    const { error } = await window.supabaseClient
      .from("bank_accounts")
      .upsert({
        owner_id: ownerId,
        holder_name: holder,
        account_number_last4: account.slice(-4),
        account_number_encrypted: account,
        ifsc,
        bank_name: bankName
      }, { onConflict: "owner_id" });

    if (error) {
      console.error("Bank account save error:", error);
      return showToast("Could not save bank account.");
    }

    await loadBankAccount();
    closeBank();
    showToast("Bank account saved successfully.");
  });


  /* =========================================================
     NOTIFICATION SETTINGS (local UI preference — not sensitive,
     kept in localStorage intentionally, unlike bank details)
     ========================================================= */

  const notificationSettings = [
    "notifyNewBooking", "notifyAccepted", "notifyCancelled",
    "notifyPickup", "notifyPayment", "notifyDelivery"
  ];

  notificationSettings.forEach(id => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;

    const saved = localStorage.getItem("rr_" + id);
    if (saved !== null) checkbox.checked = saved === "true";

    checkbox.addEventListener("change", () => {
      localStorage.setItem("rr_" + id, checkbox.checked);
    });
  });


  /* =========================================================
     ESCAPE KEY
     ========================================================= */

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeSidebar();
    closeWithdraw();
    closeBank();
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("show"));
    document.body.style.overflow = "";
  });


  /* =========================================================
     LOGOUT
     ========================================================= */

  document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => {
    window.RentoRideAuth.signOut();
  });


  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message) {

    let toast = document.getElementById("rrToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rrToast";
      Object.assign(toast.style, {
        position: "fixed", right: "25px", bottom: "25px", zIndex: "99999",
        padding: "14px 20px", borderRadius: "12px", background: "#111",
        color: "#fff", border: "1px solid #f5c400", fontSize: "14px",
        fontWeight: "600", boxShadow: "0 10px 30px rgba(0,0,0,.4)"
      });
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(window.rrToastTimer);
    window.rrToastTimer = setTimeout(() => { toast.style.display = "none"; }, 3000);
  }


  /* =========================================================
     FORMAT HELPER
     ========================================================= */

  function formatDate(dateString) {
    if (!dateString) return "—";
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit", month: "short"
    });
  }

  const RENTORIDE_FALLBACK_IMAGE_FALLBACK =
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80";


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  openSection("overview");

  await Promise.all([
    loadVehicles(),
    loadBookings(),
    loadWithdrawals(),
    loadBankAccount()
  ]);

  console.log("RentoRide Owner Dashboard loaded (Supabase-backed).");

});
