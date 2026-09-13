document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     BASIC ELEMENTS
  ========================= */

  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".dashboard-section");

  const pageTitle = document.getElementById("pageTitle");

  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const menuBtn = document.getElementById("menuBtn");

  const notificationBtn =
    document.getElementById("headerNotificationBtn");

  const notificationPopup =
    document.getElementById("notificationPopup");

  const closeNotificationPopup =
    document.getElementById("closeNotificationPopup");


  /* =========================
     SECTION TITLES
  ========================= */

  const sectionTitles = {
    overview: "Dashboard",
    vehicles: "My Vehicles",
    bookings: "Booking Requests",
    earnings: "Earnings",
    verification: "Verification",
    notifications: "Notifications",
    profile: "My Profile",
    settings: "Settings"
  };


  /* =========================
     OPEN SECTION
  ========================= */

  function openSection(sectionName) {

    if (!sectionName) return;

    sections.forEach(section => {
      section.classList.remove("active");
    });

    const target =
      document.getElementById(
        "section-" + sectionName
      );

    if (target) {
      target.classList.add("active");
    }

    navItems.forEach(item => {
      item.classList.remove("active");

      if (
        item.dataset.section === sectionName
      ) {
        item.classList.add("active");
      }
    });

    if (pageTitle) {
      pageTitle.textContent =
        sectionTitles[sectionName] ||
        "Dashboard";
    }

    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =========================
     SIDEBAR NAVIGATION
  ========================= */

  navItems.forEach(item => {

    item.addEventListener("click", () => {

      openSection(
        item.dataset.section
      );

    });

  });


  /* =========================
     VIEW ALL / MANAGE BUTTONS
  ========================= */

  document.addEventListener("click", event => {

    const sectionButton =
      event.target.closest(
        "[data-section-link]"
      );

    if (!sectionButton) return;

    event.preventDefault();

    openSection(
      sectionButton.dataset.sectionLink
    );

  });


  /* =========================
     MOBILE SIDEBAR
  ========================= */

  function openSidebar() {

    if (sidebar) {
      sidebar.classList.add("open");
    }

    if (sidebarOverlay) {
      sidebarOverlay.classList.add("show");
    }

  }


  function closeSidebar() {

    if (sidebar) {
      sidebar.classList.remove("open");
    }

    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("show");
    }

  }


  if (menuBtn) {
    menuBtn.addEventListener(
      "click",
      openSidebar
    );
  }


  if (sidebarOverlay) {
    sidebarOverlay.addEventListener(
      "click",
      closeSidebar
    );
  }


  /* =========================
     NOTIFICATION POPUP
  ========================= */

  if (notificationBtn) {

    notificationBtn.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        if (notificationPopup) {
          notificationPopup.classList.toggle(
            "show"
          );
        }

      }
    );

  }


  if (closeNotificationPopup) {

    closeNotificationPopup.addEventListener(
      "click",
      () => {

        if (notificationPopup) {
          notificationPopup.classList.remove(
            "show"
          );
        }

      }
    );

  }


  document.addEventListener(
    "click",
    event => {

      if (!notificationPopup) return;

      if (
        !notificationPopup.contains(
          event.target
        ) &&
        !notificationBtn?.contains(
          event.target
        )
      ) {

        notificationPopup.classList.remove(
          "show"
        );

      }

    }
  );


  /* =========================
     BOOKING FILTERS
  ========================= */

  const bookingFilters =
    document.querySelectorAll(
      ".booking-filter"
    );

  bookingFilters.forEach(filter => {

    filter.addEventListener(
      "click",
      () => {

        bookingFilters.forEach(button => {
          button.classList.remove("active");
        });

        filter.classList.add("active");

        const selected =
          filter.dataset.bookingFilter;

        filterBookings(selected);

      }
    );

  });


  function filterBookings(filter) {

    const rows =
      document.querySelectorAll(
        ".booking-row"
      );

    rows.forEach(row => {

      if (filter === "all") {

        row.style.display = "";

        return;

      }

      const status =
        (
          row.dataset.status || ""
        ).toLowerCase();

      if (status === filter) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }

    });

  }


  /* =========================
     WITHDRAW MODAL
  ========================= */

  const withdrawModal =
    document.getElementById(
      "withdrawModal"
    );

  const openWithdrawBtn =
    document.getElementById(
      "openWithdrawBtn"
    );

  const closeWithdrawModal =
    document.getElementById(
      "closeWithdrawModal"
    );


  function openWithdrawModal() {

    if (!withdrawModal) return;

    withdrawModal.classList.add("show");

    document.body.style.overflow =
      "hidden";

  }


  function closeWithdraw() {

    if (!withdrawModal) return;

    withdrawModal.classList.remove("show");

    document.body.style.overflow = "";

  }


  if (openWithdrawBtn) {
    openWithdrawBtn.addEventListener(
      "click",
      openWithdrawModal
    );
  }


  if (closeWithdrawModal) {
    closeWithdrawModal.addEventListener(
      "click",
      closeWithdraw
    );
  }


  const withdrawOverlay =
    withdrawModal?.querySelector(
      ".modal-overlay"
    );

  if (withdrawOverlay) {

    withdrawOverlay.addEventListener(
      "click",
      closeWithdraw
    );

  }


  /* =========================
     BANK MODAL
  ========================= */

  const bankModal =
    document.getElementById(
      "bankModal"
    );

  const manageBankBtn =
    document.getElementById(
      "manageBankBtn"
    );

  const settingsBankBtn =
    document.getElementById(
      "settingsBankBtn"
    );

  const closeBankModal =
    document.getElementById(
      "closeBankModal"
    );


  function openBankModal() {

    if (!bankModal) return;

    bankModal.classList.add("show");

    document.body.style.overflow =
      "hidden";

  }


  function closeBank() {

    if (!bankModal) return;

    bankModal.classList.remove("show");

    document.body.style.overflow = "";

  }


  if (manageBankBtn) {

    manageBankBtn.addEventListener(
      "click",
      openBankModal
    );

  }


  if (settingsBankBtn) {

    settingsBankBtn.addEventListener(
      "click",
      openBankModal
    );

  }


  if (closeBankModal) {

    closeBankModal.addEventListener(
      "click",
      closeBank
    );

  }


  const bankOverlay =
    bankModal?.querySelector(
      ".modal-overlay"
    );

  if (bankOverlay) {

    bankOverlay.addEventListener(
      "click",
      closeBank
    );

  }


  /* =========================
     BANK FORM
  ========================= */

  const bankForm =
    document.getElementById(
      "bankForm"
    );

  if (bankForm) {

    bankForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const holder =
          document.getElementById(
            "bankHolderName"
          )?.value.trim();

        const account =
          document.getElementById(
            "bankAccountNumber"
          )?.value.trim();

        const confirmAccount =
          document.getElementById(
            "confirmBankAccount"
          )?.value.trim();

        const ifsc =
          document.getElementById(
            "bankIfsc"
          )?.value.trim();

        const bankName =
          document.getElementById(
            "bankName"
          )?.value.trim();


        if (
          !holder ||
          !account ||
          !confirmAccount ||
          !ifsc ||
          !bankName
        ) {

          showToast(
            "Please fill all bank details."
          );

          return;

        }


        if (account !== confirmAccount) {

          showToast(
            "Account numbers do not match."
          );

          return;

        }


        localStorage.setItem(
          "rr_bank_holder",
          holder
        );

        localStorage.setItem(
          "rr_bank_account",
          account
        );

        localStorage.setItem(
          "rr_bank_ifsc",
          ifsc
        );

        localStorage.setItem(
          "rr_bank_name",
          bankName
        );


        updateBankDisplay();

        closeBank();

        showToast(
          "Bank account saved successfully."
        );

      }
    );

  }


  /* =========================
     BANK DISPLAY
  ========================= */

  function updateBankDisplay() {

    const holder =
      localStorage.getItem(
        "rr_bank_holder"
      );

    const account =
      localStorage.getItem(
        "rr_bank_account"
      );

    const ifsc =
      localStorage.getItem(
        "rr_bank_ifsc"
      );

    const bankName =
      localStorage.getItem(
        "rr_bank_name"
      );


    const display =
      document.getElementById(
        "bankAccountDisplay"
      );

    const withdrawBank =
      document.getElementById(
        "withdrawBankNumber"
      );


    if (!holder || !account) {

      if (withdrawBank) {
        withdrawBank.textContent =
          "No bank account added";
      }

      return;

    }


    const masked =
      "•••• •••• " +
      account.slice(-4);


    if (display) {

      display.innerHTML = `
        <div class="bank-icon">🏦</div>

        <div>
          <strong>${bankName}</strong>

          <p>
            ${holder} • ${masked}
          </p>

          <small>
            IFSC: ${ifsc}
          </small>
        </div>
      `;

    }


    if (withdrawBank) {

      withdrawBank.textContent =
        `${bankName} • ${masked}`;

    }

  }


  updateBankDisplay();


  /* =========================
     CONFIRM WITHDRAWAL
  ========================= */

  const confirmWithdrawBtn =
    document.getElementById(
      "confirmWithdrawBtn"
    );

  if (confirmWithdrawBtn) {

    confirmWithdrawBtn.addEventListener(
      "click",
      () => {

        const amountInput =
          document.getElementById(
            "withdrawAmount"
          );

        const amount =
          Number(
            amountInput?.value
          );


        const availableText =
          document.getElementById(
            "availableBalance"
          )?.textContent || "₹0";


        const available =
          Number(
            availableText
              .replace(/[₹,\s]/g, "")
          ) || 0;


        if (amount < 500) {

          showToast(
            "Minimum withdrawal is ₹500."
          );

          return;

        }


        if (amount > available) {

          showToast(
            "Insufficient available balance."
          );

          return;

        }


        if (
          !localStorage.getItem(
            "rr_bank_account"
          )
        ) {

          showToast(
            "Please add a bank account first."
          );

          closeWithdraw();

          openBankModal();

          return;

        }


        showToast(
          "Withdrawal request submitted."
        );

        if (amountInput) {
          amountInput.value = "";
        }

        closeWithdraw();

      }
    );

  }


  /* =========================
     TEST NOTIFICATION SOUND
  ========================= */

  const testSoundBtn =
    document.getElementById(
      "testNotificationSound"
    );

  if (testSoundBtn) {

    testSoundBtn.addEventListener(
      "click",
      () => {

        const selected =
          document.querySelector(
            'input[name="notificationSound"]:checked'
          );

        playSound(
          selected?.value ||
          "rentoride-alert"
        );

      }
    );

  }


  /* =========================
     SOUND PREVIEW
  ========================= */

  document
    .querySelectorAll(".sound-preview")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          playSound(
            button.dataset.sound ||
            "rentoride-alert"
          );

        }
      );

    });


  function playSound(type) {

    try {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return;

      const ctx =
        new AudioContext();


      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();


      const frequencies = {

        "rentoride-alert": 880,

        "ride-bell": 660,

        "yellow-pulse": 990,

        "quick-chime": 760,

        "booking-ring": 1100

      };


      oscillator.frequency.value =
        frequencies[type] || 880;


      oscillator.type =
        "sine";


      gain.gain.setValueAtTime(
        0.0001,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        ctx.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.4
      );


      oscillator.connect(gain);

      gain.connect(
        ctx.destination
      );


      oscillator.start();

      oscillator.stop(
        ctx.currentTime + 0.4
      );

    } catch (error) {

      console.log(
        "Sound could not play."
      );

    }

  }


  /* =========================
     SAVE SOUND
  ========================= */

  document
    .querySelectorAll(
      'input[name="notificationSound"]'
    )
    .forEach(radio => {

      radio.addEventListener(
        "change",
        () => {

          localStorage.setItem(
            "rr_notification_sound",
            radio.value
          );

          showToast(
            "Notification sound selected."
          );

        }
      );

    });


  const savedSound =
    localStorage.getItem(
      "rr_notification_sound"
    );


  if (savedSound) {

    const radio =
      document.querySelector(
        `input[name="notificationSound"][value="${savedSound}"]`
      );

    if (radio) {
      radio.checked = true;
    }

  }


  /* =========================
     NOTIFICATION SETTINGS
  ========================= */

  const notificationSettings = [
    "notifyNewBooking",
    "notifyAccepted",
    "notifyCancelled",
    "notifyPickup",
    "notifyPayment",
    "notifyDelivery"
  ];


  notificationSettings.forEach(id => {

    const checkbox =
      document.getElementById(id);

    if (!checkbox) return;


    const saved =
      localStorage.getItem(
        "rr_" + id
      );


    if (saved !== null) {

      checkbox.checked =
        saved === "true";

    }


    checkbox.addEventListener(
      "change",
      () => {

        localStorage.setItem(
          "rr_" + id,
          checkbox.checked
        );

      }
    );

  });


  /* =========================
     ESCAPE KEY
  ========================= */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") return;

      closeSidebar();
      closeWithdraw();
      closeBank();

      document
        .querySelectorAll(".modal")
        .forEach(modal => {
          modal.classList.remove("show");
        });

      if (notificationPopup) {
        notificationPopup.classList.remove(
          "show"
        );
      }

      document.body.style.overflow = "";

    }
  );


  /* =========================
     TOAST
  ========================= */

  function showToast(message) {

    let toast =
      document.getElementById(
        "rrToast"
      );


    if (!toast) {

      toast =
        document.createElement(
          "div"
        );

      toast.id = "rrToast";

      toast.style.position =
        "fixed";

      toast.style.right =
        "25px";

      toast.style.bottom =
        "25px";

      toast.style.zIndex =
        "99999";

      toast.style.padding =
        "14px 20px";

      toast.style.borderRadius =
        "12px";

      toast.style.background =
        "#111";

      toast.style.color =
        "#fff";

      toast.style.border =
        "1px solid #f5c400";

      toast.style.fontSize =
        "14px";

      toast.style.fontWeight =
        "600";

      toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.4)";

      document.body.appendChild(
        toast
      );

    }


    toast.textContent =
      message;

    toast.style.display =
      "block";


    clearTimeout(
      window.rrToastTimer
    );


    window.rrToastTimer =
      setTimeout(() => {

        toast.style.display =
          "none";

      }, 3000);

  }


  /* =========================
     INITIAL STATE
  ========================= */

  openSection("overview");


  console.log(
    "RentoRide Owner Dashboard JS loaded."
  );

});
