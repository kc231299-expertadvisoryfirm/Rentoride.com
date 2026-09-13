/* =========================================================
   RentoRide — My Bookings JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     SUPABASE
     ========================================================= */

  const SUPABASE_URL =
    "YOUR_SUPABASE_URL";

  const SUPABASE_ANON_KEY =
    "YOUR_SUPABASE_ANON_KEY";

  let supabaseClient = null;

  if (
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
    typeof supabase !== "undefined"
  ) {
    supabaseClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }


  /* =========================================================
     ELEMENTS
     ========================================================= */

  const bookingList =
    document.getElementById("bookingList");

  const loadingState =
    document.getElementById("loadingState");

  const emptyState =
    document.getElementById("emptyState");

  const bookingTemplate =
    document.getElementById("bookingTemplate");

  const profileBtn =
    document.getElementById("profileBtn");

  const profileMenu =
    document.getElementById("profileMenu");

  const logoutBtn =
    document.getElementById("logoutBtn");

  const allCount =
    document.getElementById("allCount");

  const upcomingCount =
    document.getElementById("upcomingCount");

  const activeCount =
    document.getElementById("activeCount");

  const completedCount =
    document.getElementById("completedCount");

  const cancelledCount =
    document.getElementById("cancelledCount");

  const bookingModal =
    document.getElementById("bookingModal");

  const cancelModal =
    document.getElementById("cancelModal");

  const modalClose =
    document.getElementById("modalClose");

  const keepBookingBtn =
    document.getElementById("keepBookingBtn");

  const confirmCancelBtn =
    document.getElementById("confirmCancelBtn");


  let allBookings = [];
  let selectedBooking = null;
  let currentFilter = "all";


  /* =========================================================
     PROFILE MENU
     ========================================================= */

  if (profileBtn) {

    profileBtn.addEventListener("click", (event) => {

      event.stopPropagation();

      profileMenu.classList.toggle("show");

    });

  }


  document.addEventListener("click", () => {

    if (profileMenu) {
      profileMenu.classList.remove("show");
    }

  });


  /* =========================================================
     LOAD USER
     ========================================================= */

  async function loadUser() {

    if (!supabaseClient) {

      showDemoMessage();

      return null;
    }


    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();


    if (error || !data.user) {

      window.location.href =
        "login.html";

      return null;
    }


    updateProfile(data.user);

    return data.user;
  }


  /* =========================================================
     PROFILE UI
     ========================================================= */

  function updateProfile(user) {

    const profileName =
      document.getElementById("profileName");

    const profileAvatar =
      document.getElementById("profileAvatar");


    const name =
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";


    if (profileName) {
      profileName.textContent = name;
    }


    if (profileAvatar) {

      profileAvatar.textContent =
        name.charAt(0).toUpperCase();

    }

  }


  /* =========================================================
     LOAD BOOKINGS
     ========================================================= */

  async function loadMyBookings() {

    loadingState.style.display =
      "flex";

    emptyState.style.display =
      "none";

    bookingList.innerHTML = "";


    const user =
      await loadUser();


    if (!user) return;


    if (!supabaseClient) return;


    /*
     * Existing RentoRide bookings structure:
     *
     * id
     * created_at
     * bike_id
     * start_date
     * end_date
     * pickup_time
     * dropoff_time
     * status
     * amount
     * user_id
     */


    const {
      data,
      error
    } =
      await supabaseClient
        .from("bookings")
        .select(`
          id,
          created_at,
          bike_id,
          start_date,
          end_date,
          pickup_time,
          dropoff_time,
          status,
          amount,
          user_id,
          bikes (
            id,
            bike_name,
            brand,
            image_url,
            location
          )
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    loadingState.style.display =
      "none";


    if (error) {

      console.error(
        "Bookings error:",
        error
      );

      showError(
        "Unable to load bookings. Please check your Supabase connection."
      );

      return;
    }


    allBookings =
      data || [];


    updateCounts();

    renderBookings();

  }


  /* =========================================================
     DEMO / CONNECTION MESSAGE
     ========================================================= */

  function showDemoMessage() {

    loadingState.style.display =
      "none";

    emptyState.style.display =
      "flex";

    bookingList.innerHTML = "";

  }


  /* =========================================================
     ERROR
     ========================================================= */

  function showError(message) {

    loadingState.style.display =
      "none";

    emptyState.style.display =
      "flex";

    emptyState.innerHTML = `
      <div class="empty-icon">!</div>

      <h2>
        Something went wrong
      </h2>

      <p>
        ${message}
      </p>

      <a href="bikes.html">
        Explore Rides
      </a>
    `;

  }


  /* =========================================================
     COUNT BOOKINGS
     ========================================================= */

  function updateCounts() {

    const now =
      new Date();


    let upcoming = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;


    allBookings.forEach(booking => {

      const status =
        normalizeStatus(
          booking.status
        );


      if (
        status === "cancelled" ||
        status === "canceled"
      ) {

        cancelled++;

        return;
      }


      if (status === "completed") {

        completed++;

        return;
      }


      const start =
        getDateTime(
          booking.start_date,
          booking.pickup_time
        );

      const end =
        getDateTime(
          booking.end_date,
          booking.dropoff_time
        );


      if (
        start &&
        end &&
        now >= start &&
        now <= end
      ) {

        active++;

      } else if (
        start &&
        start > now
      ) {

        upcoming++;

      }

    });


    allCount.textContent =
      allBookings.length;

    upcomingCount.textContent =
      upcoming;

    activeCount.textContent =
      active;

    completedCount.textContent =
      completed;

    cancelledCount.textContent =
      cancelled;

  }


  /* =========================================================
     FILTER TABS
     ========================================================= */

  document
    .querySelectorAll(".tab-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".tab-btn")
            .forEach(btn => {

              btn.classList.remove(
                "active"
              );

            });


          button.classList.add(
            "active"
          );


          currentFilter =
            button.dataset.status ||
            "all";


          renderBookings();

        }
      );

    });


  /* =========================================================
     RENDER BOOKINGS
     ========================================================= */

  function renderBookings() {

    bookingList.innerHTML = "";


    const filtered =
      allBookings.filter(
        booking =>
          matchesFilter(
            booking,
            currentFilter
          )
      );


    if (!filtered.length) {

      emptyState.style.display =
        "flex";

      return;
    }


    emptyState.style.display =
      "none";


    filtered.forEach(
      booking => {

        const card =
          createBookingCard(
            booking
          );

        bookingList.appendChild(
          card
        );

      }
    );

  }


  /* =========================================================
     FILTER LOGIC
     ========================================================= */

  function matchesFilter(
    booking,
    filter
  ) {

    if (filter === "all") {
      return true;
    }


    const status =
      normalizeStatus(
        booking.status
      );


    if (
      filter === "cancelled"
    ) {

      return (
        status === "cancelled" ||
        status === "canceled"
      );

    }


    if (
      filter === "completed"
    ) {

      return status === "completed";

    }


    const now =
      new Date();


    const start =
      getDateTime(
        booking.start_date,
        booking.pickup_time
      );

    const end =
      getDateTime(
        booking.end_date,
        booking.dropoff_time
      );


    if (
      filter === "active"
    ) {

      return (
        start &&
        end &&
        now >= start &&
        now <= end
      );

    }


    if (
      filter === "upcoming"
    ) {

      return (
        start &&
        start > now &&
        status !== "cancelled" &&
        status !== "canceled" &&
        status !== "completed"
      );

    }


    return true;

  }


  /* =========================================================
     CREATE BOOKING CARD
     ========================================================= */

  function createBookingCard(
    booking
  ) {

    const fragment =
      bookingTemplate.content
        .cloneNode(true);


    const card =
      fragment.querySelector(
        ".booking-card"
      );


    const bike =
      booking.bikes || {};


    const image =
      fragment.querySelector(
        ".booking-image"
      );

    const vehicleName =
      fragment.querySelector(
        ".booking-vehicle-name"
      );

    const bookingId =
      fragment.querySelector(
        ".booking-id strong"
      );

    const pickupDate =
      fragment.querySelector(
        ".pickup-date"
      );

    const pickupTime =
      fragment.querySelector(
        ".pickup-time"
      );

    const dropDate =
      fragment.querySelector(
        ".drop-date"
      );

    const dropTime =
      fragment.querySelector(
        ".drop-time"
      );

    const location =
      fragment.querySelector(
        ".booking-location"
      );

    const status =
      fragment.querySelector(
        ".booking-status"
      );

    const amount =
      fragment.querySelector(
        ".booking-price strong"
      );


    /* VEHICLE */

    vehicleName.textContent =
      bike.bike_name ||
      "RentoRide Vehicle";


    image.src =
      bike.image_url ||
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80";


    image.alt =
      vehicleName.textContent;


    /* BOOKING ID */

    bookingId.textContent =
      formatBookingId(
        booking.id
      );


    /* DATES */

    pickupDate.textContent =
      formatDate(
        booking.start_date
      );

    pickupTime.textContent =
      formatTime(
        booking.pickup_time
      );


    dropDate.textContent =
      formatDate(
        booking.end_date
      );

    dropTime.textContent =
      formatTime(
        booking.dropoff_time
      );


    /* LOCATION */

    location.textContent =
      bike.location ||
      "Kota, Rajasthan";


    /* STATUS */

    const displayStatus =
      getDisplayStatus(
        booking
      );


    status.textContent =
      displayStatus;


    status.className =
      "booking-status " +
      getStatusClass(
        displayStatus
      );


    /* AMOUNT */

    amount.textContent =
      formatMoney(
        booking.amount
      );


    /* VIEW */

    const viewButton =
      fragment.querySelector(
        ".view-booking-btn"
      );


    viewButton.addEventListener(
      "click",
      () => {

        openBookingDetails(
          booking
        );

      }
    );


    /* CANCEL */

    const cancelButton =
      fragment.querySelector(
        ".cancel-booking-btn"
      );


    const currentStatus =
      normalizeStatus(
        booking.status
      );


    if (
      currentStatus === "cancelled" ||
      currentStatus === "canceled" ||
      currentStatus === "completed"
    ) {

      cancelButton.style.display =
        "none";

    } else {

      cancelButton.addEventListener(
        "click",
        () => {

          openCancelModal(
            booking
          );

        }
      );

    }


    return card;

  }


  /* =========================================================
     STATUS
     ========================================================= */

  function getDisplayStatus(
    booking
  ) {

    const status =
      normalizeStatus(
        booking.status
      );


    if (
      status === "cancelled" ||
      status === "canceled"
    ) {

      return "Cancelled";

    }


    if (
      status === "completed"
    ) {

      return "Completed";

    }


    const now =
      new Date();


    const start =
      getDateTime(
        booking.start_date,
        booking.pickup_time
      );

    const end =
      getDateTime(
        booking.end_date,
        booking.dropoff_time
      );


    if (
      start &&
      end &&
      now >= start &&
      now <= end
    ) {

      return "Active";

    }


    if (
      start &&
      start > now
    ) {

      if (
        status === "confirmed"
      ) {

        return "Confirmed";

      }

      return "Pending";

    }


    return capitalize(
      booking.status ||
      "Pending"
    );

  }


  function getStatusClass(
    status
  ) {

    return status
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      );

  }


  function normalizeStatus(
    status
  ) {

    return String(
      status || ""
    )
      .trim()
      .toLowerCase();

  }


  /* =========================================================
     VIEW DETAILS MODAL
     ========================================================= */

  function openBookingDetails(
    booking
  ) {

    selectedBooking =
      booking;


    const bike =
      booking.bikes || {};


    document.getElementById(
      "modalVehicleName"
    ).textContent =
      bike.bike_name ||
      "RentoRide Vehicle";


    document.getElementById(
      "modalBookingId"
    ).textContent =
      formatBookingId(
        booking.id
      );


    document.getElementById(
      "modalAmount"
    ).textContent =
      formatMoney(
        booking.amount
      );


    document.getElementById(
      "modalPickup"
    ).textContent =
      `${formatDate(
        booking.start_date
      )} • ${formatTime(
        booking.pickup_time
      )}`;


    document.getElementById(
      "modalDrop"
    ).textContent =
      `${formatDate(
        booking.end_date
      )} • ${formatTime(
        booking.dropoff_time
      )}`;


    document.getElementById(
      "modalLocation"
    ).textContent =
      bike.location ||
      "Kota, Rajasthan";


    const modalStatus =
      document.getElementById(
        "modalStatus"
      );


    const displayStatus =
      getDisplayStatus(
        booking
      );


    modalStatus.textContent =
      displayStatus;


    bookingModal.classList.add(
      "show"
    );

  }


  /* =========================================================
     CANCEL MODAL
     ========================================================= */

  function openCancelModal(
    booking
  ) {

    selectedBooking =
      booking;

    cancelModal.classList.add(
      "show"
    );

  }


  function closeCancelModal() {

    cancelModal.classList.remove(
      "show"
    );

  }


  /* =========================================================
     CONFIRM CANCEL
     ========================================================= */

  confirmCancelBtn.addEventListener(
    "click",
    async () => {

      if (
        !selectedBooking
      ) {
        return;
      }


      confirmCancelBtn.disabled =
        true;

      confirmCancelBtn.textContent =
        "Cancelling...";


      if (!supabaseClient) {

        confirmCancelBtn.disabled =
          false;

        confirmCancelBtn.textContent =
          "Yes, Cancel";

        closeCancelModal();

        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from("bookings")
          .update({
            status: "cancelled"
          })
          .eq(
            "id",
            selectedBooking.id
          );


      confirmCancelBtn.disabled =
        false;

      confirmCancelBtn.textContent =
        "Yes, Cancel";


      if (error) {

        console.error(
          "Cancel booking error:",
          error
        );

        alert(
          "Booking cancel nahi hui. Please try again."
        );

        return;
      }


      closeCancelModal();


      /*
       * Update local data
       * immediately.
       */

      const booking =
        allBookings.find(
          item =>
            item.id ===
            selectedBooking.id
        );


      if (booking) {

        booking.status =
          "cancelled";

      }


      selectedBooking =
        null;


      updateCounts();
      renderBookings();

    }
  );


  /* =========================================================
     CLOSE MODALS
     ========================================================= */

  modalClose.addEventListener(
    "click",
    () => {

      bookingModal.classList.remove(
        "show"
      );

    }
  );


  keepBookingBtn.addEventListener(
    "click",
    closeCancelModal
  );


  bookingModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        bookingModal
      ) {

        bookingModal.classList.remove(
          "show"
        );

      }

    }
  );


  cancelModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        cancelModal
      ) {

        closeCancelModal();

      }

    }
  );


  /* =========================================================
     LOGOUT
     ========================================================= */

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        if (
          supabaseClient
        ) {

          await supabaseClient.auth.signOut();

        }

        window.location.href =
          "login.html";

      }
    );

  }


  /* =========================================================
     HELPERS
     ========================================================= */

  function formatMoney(
    amount
  ) {

    const value =
      Number(amount || 0);

    return (
      "₹" +
      value.toLocaleString(
        "en-IN"
      )
    );

  }


  function formatBookingId(
    id
  ) {

    return (
      "RR" +
      String(id)
        .padStart(
          6,
          "0"
        )
    );

  }


  function formatDate(
    dateString
  ) {

    if (!dateString) {
      return "—";
    }


    const date =
      new Date(
        dateString +
        "T00:00:00"
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return dateString;

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  }


  function formatTime(
    timeString
  ) {

    if (!timeString) {
      return "—";
    }


    const parts =
      String(
        timeString
      ).split(":");


    const hour =
      Number(parts[0]);


    const minute =
      parts[1] || "00";


    if (
      Number.isNaN(hour)
    ) {

      return timeString;

    }


    const displayHour =
      hour % 12 || 12;


    const period =
      hour < 12
        ? "AM"
        : "PM";


    return (
      `${displayHour}:` +
      `${minute} ${period}`
    );

  }


  function getDateTime(
    date,
    time
  ) {

    if (!date) {
      return null;
    }


    const cleanTime =
      time
        ? String(time)
            .substring(0, 8)
        : "00:00:00";


    const value =
      new Date(
        `${date}T${cleanTime}`
      );


    if (
      Number.isNaN(
        value.getTime()
      )
    ) {

      return null;

    }


    return value;

  }


  function capitalize(
    text
  ) {

    const value =
      String(text || "");


    if (!value) {
      return "";
    }


    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );

  }


  /* =========================================================
     START
     ========================================================= */

  loadMyBookings();

});
