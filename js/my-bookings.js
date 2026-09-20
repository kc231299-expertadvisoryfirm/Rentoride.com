/* =========================================================
   RentoRide — My Bookings JS  (Supabase-backed)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/my-bookings.js"></script>

   CHANGE FROM PREVIOUS VERSION: no longer creates its own
   Supabase client with placeholder "YOUR_SUPABASE_URL" strings
   (which meant this page silently never worked). Uses the shared
   window.supabaseClient from supabase.js, and RentoRideAuth for
   the login check/redirect instead of a hand-rolled one.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     ELEMENTS
     ========================================================= */

  const bookingList = document.getElementById("bookingList");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const bookingTemplate = document.getElementById("bookingTemplate");

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  const allCount = document.getElementById("allCount");
  const upcomingCount = document.getElementById("upcomingCount");
  const activeCount = document.getElementById("activeCount");
  const completedCount = document.getElementById("completedCount");
  const cancelledCount = document.getElementById("cancelledCount");

  const bookingModal = document.getElementById("bookingModal");
  const cancelModal = document.getElementById("cancelModal");
  const modalClose = document.getElementById("modalClose");
  const keepBookingBtn = document.getElementById("keepBookingBtn");
  const confirmCancelBtn = document.getElementById("confirmCancelBtn");

  let allBookings = [];
  let selectedBooking = null;
  let currentFilter = "all";


  /* =========================================================
     PROFILE MENU
     ========================================================= */

  if (profileBtn) {
    profileBtn.addEventListener("click", event => {
      event.stopPropagation();
      profileMenu.classList.toggle("show");
    });
  }

  document.addEventListener("click", () => {
    profileMenu?.classList.remove("show");
  });


  /* =========================================================
     AUTH + LOAD
     ========================================================= */

  const current = await window.RentoRideAuth.requireAuth();
  if (!current) return; // already redirected to login

  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");
  if (profileName) profileName.textContent = current.profile.name;
  if (profileAvatar) profileAvatar.textContent = (current.profile.name || "U").charAt(0).toUpperCase();


  async function loadMyBookings() {

    loadingState.style.display = "flex";
    emptyState.style.display = "none";
    bookingList.innerHTML = "";

    const { data, error } = await window.supabaseClient
      .from("bookings")
      .select(`
        id,
        booking_ref,
        start_date,
        end_date,
        start_time,
        end_time,
        status,
        amount,
        bikes ( id, name, image_url, location )
      `)
      .eq("customer_id", current.authUser.id)
      .order("created_at", { ascending: false });

    loadingState.style.display = "none";

    if (error) {
      console.error("Bookings error:", error);
      showError("Unable to load your bookings. Please try again.");
      return;
    }

    allBookings = data || [];

    updateCounts();
    renderBookings();
  }


  function showError(message) {
    loadingState.style.display = "none";
    emptyState.style.display = "flex";
    emptyState.innerHTML = `
      <div class="empty-icon">!</div>
      <h2>Something went wrong</h2>
      <p>${message}</p>
      <a href="bikes.html">Explore Rides</a>
    `;
  }


  /* =========================================================
     COUNTS
     ========================================================= */

  function updateCounts() {

    const now = new Date();
    let upcoming = 0, active = 0, completed = 0, cancelled = 0;

    allBookings.forEach(booking => {

      const status = normalizeStatus(booking.status);

      if (status === "cancelled" || status === "rejected") { cancelled++; return; }
      if (status === "completed") { completed++; return; }

      const start = getDateTime(booking.start_date, booking.start_time);
      const end = getDateTime(booking.end_date, booking.end_time);

      if (start && end && now >= start && now <= end) {
        active++;
      } else if (start && start > now) {
        upcoming++;
      }
    });

    allCount.textContent = allBookings.length;
    upcomingCount.textContent = upcoming;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    cancelledCount.textContent = cancelled;
  }


  /* =========================================================
     FILTER TABS
     ========================================================= */

  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.status || "all";
      renderBookings();
    });
  });


  function renderBookings() {

    bookingList.innerHTML = "";

    const filtered = allBookings.filter(booking => matchesFilter(booking, currentFilter));

    if (!filtered.length) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    filtered.forEach(booking => bookingList.appendChild(createBookingCard(booking)));
  }


  function matchesFilter(booking, filter) {

    if (filter === "all") return true;

    const status = normalizeStatus(booking.status);

    if (filter === "cancelled") return status === "cancelled" || status === "rejected";
    if (filter === "completed") return status === "completed";

    const now = new Date();
    const start = getDateTime(booking.start_date, booking.start_time);
    const end = getDateTime(booking.end_date, booking.end_time);

    if (filter === "active") return start && end && now >= start && now <= end;

    if (filter === "upcoming") {
      return start && start > now && status !== "cancelled" && status !== "rejected" && status !== "completed";
    }

    return true;
  }


  /* =========================================================
     CARD
     ========================================================= */

  function createBookingCard(booking) {

    const fragment = bookingTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".booking-card");
    const bike = booking.bikes || {};

    const image = fragment.querySelector(".booking-image");
    const vehicleName = fragment.querySelector(".booking-vehicle-name");
    const bookingIdEl = fragment.querySelector(".booking-id strong");
    const pickupDateEl = fragment.querySelector(".pickup-date");
    const pickupTimeEl = fragment.querySelector(".pickup-time");
    const dropDateEl = fragment.querySelector(".drop-date");
    const dropTimeEl = fragment.querySelector(".drop-time");
    const locationEl = fragment.querySelector(".booking-location");
    const statusEl = fragment.querySelector(".booking-status");
    const amountEl = fragment.querySelector(".booking-price strong");

    vehicleName.textContent = bike.name || "RentoRide Vehicle";
    image.src = bike.image_url || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80";
    image.alt = vehicleName.textContent;

    bookingIdEl.textContent = booking.booking_ref;

    pickupDateEl.textContent = formatDate(booking.start_date);
    pickupTimeEl.textContent = formatTime(booking.start_time);
    dropDateEl.textContent = formatDate(booking.end_date);
    dropTimeEl.textContent = formatTime(booking.end_time);

    locationEl.textContent = bike.location || "—";

    const displayStatus = getDisplayStatus(booking);
    statusEl.textContent = displayStatus;
    statusEl.className = "booking-status " + getStatusClass(displayStatus);

    amountEl.textContent = formatMoney(booking.amount);

    fragment.querySelector(".view-booking-btn")
      .addEventListener("click", () => openBookingDetails(booking));

    const cancelButton = fragment.querySelector(".cancel-booking-btn");
    const status = normalizeStatus(booking.status);

    if (status === "cancelled" || status === "rejected" || status === "completed") {
      cancelButton.style.display = "none";
    } else {
      cancelButton.addEventListener("click", () => openCancelModal(booking));
    }

    return card;
  }


  /* =========================================================
     STATUS HELPERS
     ========================================================= */

  function getDisplayStatus(booking) {

    const status = normalizeStatus(booking.status);

    if (status === "cancelled") return "Cancelled";
    if (status === "rejected") return "Rejected";
    if (status === "completed") return "Completed";

    const now = new Date();
    const start = getDateTime(booking.start_date, booking.start_time);
    const end = getDateTime(booking.end_date, booking.end_time);

    if (start && end && now >= start && now <= end) return "Active";
    if (start && start > now) return status === "accepted" ? "Confirmed" : "Pending";

    return capitalize(booking.status || "Pending");
  }

  function getStatusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  function normalizeStatus(status) {
    return String(status || "").trim().toLowerCase();
  }


  /* =========================================================
     VIEW DETAILS MODAL
     ========================================================= */

  function openBookingDetails(booking) {

    selectedBooking = booking;
    const bike = booking.bikes || {};

    document.getElementById("modalVehicleName").textContent = bike.name || "RentoRide Vehicle";
    document.getElementById("modalBookingId").textContent = booking.booking_ref;
    document.getElementById("modalAmount").textContent = formatMoney(booking.amount);
    document.getElementById("modalPickup").textContent =
      `${formatDate(booking.start_date)} • ${formatTime(booking.start_time)}`;
    document.getElementById("modalDrop").textContent =
      `${formatDate(booking.end_date)} • ${formatTime(booking.end_time)}`;
    document.getElementById("modalLocation").textContent = bike.location || "—";
    document.getElementById("modalStatus").textContent = getDisplayStatus(booking);

    bookingModal.classList.add("show");
  }


  /* =========================================================
     CANCEL
     ========================================================= */

  function openCancelModal(booking) {
    selectedBooking = booking;
    cancelModal.classList.add("show");
  }

  function closeCancelModal() {
    cancelModal.classList.remove("show");
  }

  confirmCancelBtn.addEventListener("click", async () => {

    if (!selectedBooking) return;

    confirmCancelBtn.disabled = true;
    confirmCancelBtn.textContent = "Cancelling...";

    const { error } = await window.supabaseClient
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", selectedBooking.id);

    confirmCancelBtn.disabled = false;
    confirmCancelBtn.textContent = "Yes, Cancel";

    if (error) {
      console.error("Cancel booking error:", error);
      alert("Could not cancel the booking. Please try again.");
      return;
    }

    closeCancelModal();

    const booking = allBookings.find(item => item.id === selectedBooking.id);
    if (booking) booking.status = "cancelled";

    selectedBooking = null;

    updateCounts();
    renderBookings();
  });


  /* =========================================================
     CLOSE MODALS
     ========================================================= */

  modalClose.addEventListener("click", () => bookingModal.classList.remove("show"));
  keepBookingBtn.addEventListener("click", closeCancelModal);

  bookingModal.addEventListener("click", event => {
    if (event.target === bookingModal) bookingModal.classList.remove("show");
  });

  cancelModal.addEventListener("click", event => {
    if (event.target === cancelModal) closeCancelModal();
  });


  /* =========================================================
     LOGOUT
     ========================================================= */

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => window.RentoRideAuth.signOut());
  }


  /* =========================================================
     FORMAT HELPERS
     ========================================================= */

  function formatMoney(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatTime(timeString) {
    if (!timeString) return "—";
    const parts = String(timeString).split(":");
    const hour = Number(parts[0]);
    const minute = parts[1] || "00";
    if (Number.isNaN(hour)) return timeString;
    const displayHour = hour % 12 || 12;
    const period = hour < 12 ? "AM" : "PM";
    return `${displayHour}:${minute} ${period}`;
  }

  function getDateTime(date, time) {
    if (!date) return null;
    const cleanTime = time ? String(time).substring(0, 8) : "00:00:00";
    const value = new Date(`${date}T${cleanTime}`);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  function capitalize(text) {
    const value = String(text || "");
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }


  /* =========================================================
     START
     ========================================================= */

  loadMyBookings();

});
