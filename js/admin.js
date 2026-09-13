```javascript
/* =========================================================
   RentoRide Admin Dashboard
   File: js/admin.js
   ========================================================= */

/* ---------------------------------------------------------
   SUPABASE
--------------------------------------------------------- */

// IMPORTANT:
// Agar tumhare project me supabaseClient kisi aur JS file
// se already create ho raha hai, usko yahan dobara mat banao.
//
// Example:
// const supabaseClient = window.supabaseClient;

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabaseClient;

try {
  if (window.supabase && SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
} catch (error) {
  console.error("Supabase initialization error:", error);
}


/* ---------------------------------------------------------
   GLOBAL STATE
--------------------------------------------------------- */

let currentAdmin = null;
let currentProfile = null;


/* =========================================================
   ADMIN SECURITY
========================================================= */

async function checkAdminAccess() {

  try {

    if (!supabaseClient) {
      console.error("Supabase client not initialized.");

      // Temporary:
      // Agar tumhare HTML me Supabase client kisi aur script
      // se aa raha hai, is block ko uske according adjust karna.
      return false;
    }

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();


    // USER LOGIN CHECK

    if (userError || !user) {

      window.location.replace("login.html");

      return false;
    }


    currentAdmin = user;


    // PROFILE + ROLE CHECK

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select("id, name, email, phone, role")
      .eq("id", user.id)
      .single();


    if (profileError || !profile) {

      console.error("Profile error:", profileError);

      alert("Admin profile not found.");

      await supabaseClient.auth.signOut();

      window.location.replace("login.html");

      return false;
    }


    currentProfile = profile;


    // ADMIN ROLE CHECK

    if (String(profile.role).toLowerCase() !== "admin") {

      alert("Access denied. Admin account required.");

      window.location.replace("index.html");

      return false;
    }


    // ADMIN DETAILS LOAD

    updateAdminProfile(profile);

    return true;

  } catch (error) {

    console.error("Admin security error:", error);

    window.location.replace("login.html");

    return false;
  }
}


/* =========================================================
   ADMIN PROFILE UI
========================================================= */

function updateAdminProfile(profile) {

  const name =
    profile.name ||
    profile.email?.split("@")[0] ||
    "Administrator";


  const initials =
    name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();


  const elements = [

    "adminName",
    "adminHeaderName",
    "welcomeAdminName"

  ];


  elements.forEach(id => {

    const element = document.getElementById(id);

    if (element) {
      element.textContent = name;
    }

  });


  const avatarElements = [

    "adminAvatar",
    "adminHeaderAvatar"

  ];


  avatarElements.forEach(id => {

    const element = document.getElementById(id);

    if (element) {
      element.textContent = initials || "A";
    }

  });

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  const navItems =
    document.querySelectorAll(".admin-nav-item");


  const sections =
    document.querySelectorAll(".admin-section");


  const pageTitle =
    document.getElementById("adminPageTitle");


  navItems.forEach(button => {

    button.addEventListener("click", () => {

      const sectionName =
        button.dataset.section;


      if (!sectionName) return;


      // Remove active

      navItems.forEach(item => {

        item.classList.remove("active");

      });


      // Add active

      button.classList.add("active");


      // Hide all sections

      sections.forEach(section => {

        section.classList.remove("active");

      });


      // Show selected section

      const target =
        document.getElementById(
          `admin-section-${sectionName}`
        );


      if (target) {

        target.classList.add("active");

      } else {

        console.warn(
          `Section not found: admin-section-${sectionName}`
        );

        return;
      }


      // Page titles

      const titles = {

        overview: "Command Center",
        users: "Users",
        owners: "Owners",
        vehicles: "Vehicles",
        verification: "Verification Center",
        bookings: "Bookings",
        finance: "Finance Center",
        analytics: "Analytics",
        support: "Support & Complaints",
        notifications: "Notifications",
        settings: "Platform Settings"

      };


      if (pageTitle) {

        pageTitle.textContent =
          titles[sectionName] ||
          "Command Center";

      }


      // Close mobile sidebar

      closeMobileSidebar();

    });

  });


  // Internal section buttons

  document
    .querySelectorAll("[data-section-link]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const targetSection =
          button.dataset.sectionLink;

        const targetNav =
          document.querySelector(
            `.admin-nav-item[data-section="${targetSection}"]`
          );


        if (targetNav) {

          targetNav.click();

        }

      });

    });

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setupMobileMenu() {

  const menuBtn =
    document.getElementById("adminMenuBtn");

  const sidebar =
    document.getElementById("adminSidebar");

  const overlay =
    document.getElementById("adminSidebarOverlay");


  if (menuBtn) {

    menuBtn.addEventListener("click", () => {

      sidebar?.classList.toggle("open");

      overlay?.classList.toggle("active");

    });

  }


  if (overlay) {

    overlay.addEventListener("click", () => {

      closeMobileSidebar();

    });

  }

}


function closeMobileSidebar() {

  document
    .getElementById("adminSidebar")
    ?.classList.remove("open");


  document
    .getElementById("adminSidebarOverlay")
    ?.classList.remove("active");

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

  const logoutBtn =
    document.getElementById("adminLogoutBtn");


  if (!logoutBtn) return;


  logoutBtn.addEventListener("click", async () => {

    const confirmLogout =
      confirm("Are you sure you want to logout?");


    if (!confirmLogout) return;


    try {

      if (supabaseClient) {

        await supabaseClient.auth.signOut();

      }

    } catch (error) {

      console.error("Logout error:", error);

    }


    window.location.replace("login.html");

  });

}


/* =========================================================
   MODAL SYSTEM
========================================================= */

function setupModals() {

  const modal =
    document.getElementById("adminDetailModal");

  const closeBtn =
    document.getElementById("closeAdminDetailModal");

  const overlay =
    modal?.querySelector(".admin-modal-overlay");


  function closeModal() {

    modal?.classList.remove("active");

  }


  if (closeBtn) {

    closeBtn.addEventListener(
      "click",
      closeModal
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeModal
    );

  }


  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

      closeModal();

    }

  });

}


/* =========================================================
   SHOW ADMIN DETAIL MODAL
========================================================= */

function showAdminDetail(title, content) {

  const modal =
    document.getElementById("adminDetailModal");

  const titleElement =
    document.getElementById("adminDetailModalTitle");

  const contentElement =
    document.getElementById("adminDetailModalContent");


  if (!modal) return;


  if (titleElement) {

    titleElement.textContent =
      title || "Details";

  }


  if (contentElement) {

    contentElement.innerHTML =
      content || "";

  }


  modal.classList.add("active");

}


/* =========================================================
   VEHICLE FILTERS
========================================================= */

function setupVehicleFilters() {

  const buttons =
    document.querySelectorAll(
      "[data-vehicle-filter]"
    );


  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn =>
        btn.classList.remove("active")
      );


      button.classList.add("active");


      const filter =
        button.dataset.vehicleFilter;


      console.log(
        "Vehicle filter:",
        filter
      );


      filterVehicleCards(filter);

    });

  });

}


function filterVehicleCards(filter) {

  const cards =
    document.querySelectorAll(
      ".admin-vehicle-card"
    );


  cards.forEach(card => {

    if (filter === "all") {

      card.style.display = "";

      return;

    }


    const status =
      card.dataset.status;


    card.style.display =
      status === filter
        ? ""
        : "none";

  });

}


/* =========================================================
   BOOKING FILTERS
========================================================= */

function setupBookingFilters() {

  const buttons =
    document.querySelectorAll(
      ".admin-booking-filter"
    );


  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn =>
        btn.classList.remove("active")
      );


      button.classList.add("active");


      const filter =
        button.dataset.bookingFilter;


      filterBookingRows(filter);

    });

  });

}


function filterBookingRows(filter) {

  const rows =
    document.querySelectorAll(
      ".admin-booking-row"
    );


  rows.forEach(row => {

    if (filter === "all") {

      row.style.display = "";

      return;

    }


    const status =
      row.dataset.status;


    row.style.display =
      status === filter
        ? ""
        : "none";

  });

}


/* =========================================================
   SUPPORT FILTERS
========================================================= */

function setupSupportFilters() {

  const buttons =
    document.querySelectorAll(
      ".support-filter"
    );


  buttons.forEach(button => {

    button.addEventListener("click", () => {

      buttons.forEach(btn =>
        btn.classList.remove("active")
      );


      button.classList.add("active");


      const filter =
        button.dataset.supportFilter;


      filterSupportCases(filter);

    });

  });

}


function filterSupportCases(filter) {

  const cards =
    document.querySelectorAll(
      ".support-case"
    );


  cards.forEach(card => {

    if (filter === "all") {

      card.style.display = "";

      return;

    }


    const status =
      card.dataset.status;


    card.style.display =
      status === filter
        ? ""
        : "none";

  });

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

  const userSearch =
    document.getElementById("userSearch");

  const ownerSearch =
    document.getElementById("ownerSearch");


  if (userSearch) {

    userSearch.addEventListener(
      "input",
      () => {

        searchTable(
          userSearch.value,
          "#usersTable .admin-table-row"
        );

      }
    );

  }


  if (ownerSearch) {

    ownerSearch.addEventListener(
      "input",
      () => {

        searchTable(
          ownerSearch.value,
          "#ownersTable .admin-table-row"
        );

      }
    );

  }

}


function searchTable(query, selector) {

  const rows =
    document.querySelectorAll(selector);


  const search =
    query.trim().toLowerCase();


  rows.forEach(row => {

    const text =
      row.textContent.toLowerCase();


    row.style.display =
      text.includes(search)
        ? ""
        : "none";

  });

}


/* =========================================================
   NOTIFICATION POPUP
========================================================= */

function showAdminNotification(title, message) {

  const popup =
    document.getElementById(
      "adminNotificationPopup"
    );


  const titleElement =
    document.getElementById(
      "adminPopupTitle"
    );


  const messageElement =
    document.getElementById(
      "adminPopupMessage"
    );


  if (!popup) return;


  if (titleElement) {

    titleElement.textContent =
      title || "System Notification";

  }


  if (messageElement) {

    messageElement.textContent =
      message || "";

  }


  popup.classList.add("active");


  setTimeout(() => {

    popup.classList.remove("active");

  }, 5000);

}


/* =========================================================
   NOTIFICATION POPUP CLOSE
========================================================= */

function setupNotificationPopup() {

  const popup =
    document.getElementById(
      "adminNotificationPopup"
    );


  const close =
    document.getElementById(
      "closeAdminNotificationPopup"
    );


  if (close) {

    close.addEventListener("click", () => {

      popup?.classList.remove("active");

    });

  }


  const notificationButton =
    document.getElementById(
      "adminNotificationBtn"
    );


  if (notificationButton) {

    notificationButton.addEventListener(
      "click",
      () => {

        const section =
          document.querySelector(
            '.admin-nav-item[data-section="notifications"]'
          );


        section?.click();

      }
    );

  }

}


/* =========================================================
   ADMIN NOTIFICATION FORM
========================================================= */

function setupNotificationForm() {

  const form =
    document.getElementById(
      "adminNotificationForm"
    );


  if (!form) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const audience =
        document.getElementById(
          "notificationAudience"
        )?.value;


      const title =
        document.getElementById(
          "notificationTitle"
        )?.value.trim();


      const message =
        document.getElementById(
          "notificationMessage"
        )?.value.trim();


      if (!title || !message) {

        alert(
          "Please enter notification title and message."
        );

        return;

      }


      /*
       * Abhi database table ka exact schema
       * define nahi hua hai, isliye yahan fake
       * database insert nahi kar rahe.
       *
       * Form working rahega aur validation karega.
       */

      console.log({
        audience,
        title,
        message
      });


      showAdminNotification(
        "Notification Ready",
        "Notification details validated successfully."
      );


      form.reset();

    }
  );

}


/* =========================================================
   PLATFORM SETTINGS
========================================================= */

function setupPlatformSettings() {

  const saveBtn =
    document.getElementById(
      "saveAdminSettings"
    );


  if (!saveBtn) return;


  saveBtn.addEventListener(
    "click",
    () => {

      const commission =
        document.getElementById(
          "platformCommissionRate"
        )?.value;


      const minimumWithdrawal =
        document.getElementById(
          "minimumWithdrawal"
        )?.value;


      const deliveryCharge =
        document.getElementById(
          "defaultDeliveryCharge"
        )?.value;


      const allowBookings =
        document.getElementById(
          "allowBookings"
        )?.checked;


      const maintenanceMode =
        document.getElementById(
          "maintenanceMode"
        )?.checked;


      console.log(
        "Platform settings:",
        {
          commission,
          minimumWithdrawal,
          deliveryCharge,
          allowBookings,
          maintenanceMode
        }
      );


      showAdminNotification(
        "Settings Saved",
        "Platform settings have been updated."
      );

    }
  );

}


/* =========================================================
   REVENUE PERIOD
========================================================= */

function setupRevenuePeriod() {

  const select =
    document.getElementById(
      "revenuePeriod"
    );


  if (!select) return;


  select.addEventListener(
    "change",
    () => {

      console.log(
        "Revenue period:",
        select.value
      );

    }
  );

}


/* =========================================================
   BASIC DASHBOARD DATA
========================================================= */

function setNumber(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      Number(value || 0).toLocaleString("en-IN");

  }

}


function setCurrency(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      "₹" +
      Number(value || 0).toLocaleString("en-IN");

  }

}


/* =========================================================
   LOAD DASHBOARD COUNTS
========================================================= */

async function loadDashboardStats() {

  if (!supabaseClient) return;


  try {

    // USERS

    const usersResult =
      await supabaseClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true
        });


    if (!usersResult.error) {

      setNumber(
        "adminTotalUsers",
        usersResult.count
      );

      setNumber(
        "userBadge",
        usersResult.count
      );

    }


    // OWNERS

    const ownersResult =
      await supabaseClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true
        })
        .eq("role", "owner");


    if (!ownersResult.error) {

      setNumber(
        "adminTotalOwners",
        ownersResult.count
      );

      setNumber(
        "ownerBadge",
        ownersResult.count
      );

    }


    // VEHICLES

    const vehiclesResult =
      await supabaseClient
        .from("bikes")
        .select("id", {
          count: "exact",
          head: true
        });


    if (!vehiclesResult.error) {

      setNumber(
        "adminTotalVehicles",
        vehiclesResult.count
      );

      setNumber(
        "vehicleBadge",
        vehiclesResult.count
      );

    }


    // BOOKINGS

    const bookingsResult =
      await supabaseClient
        .from("bookings")
        .select("id", {
          count: "exact",
          head: true
        });


    if (!bookingsResult.error) {

      setNumber(
        "adminTotalBookings",
        bookingsResult.count
      );

    }


  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error
    );

  }

}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
     * SECURITY FIRST
     *
     * Admin check fail hua toh dashboard
     * ka baaki JS execute nahi hoga.
     */

    const allowed =
      await checkAdminAccess();


    if (!allowed) {

      return;

    }


    // UI

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


    // DATA

    await loadDashboardStats();


    console.log(
      "RentoRide Admin Dashboard initialized."
    );

  }
);
```
