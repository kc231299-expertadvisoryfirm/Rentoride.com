/* ================= MOBILE MENU ================= */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  navMenu.querySelectorAll("a").forEach((link) => {

    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });

  });

}


/* ================= DATE ================= */

const pickupDate = document.getElementById("pickupDate");

if (pickupDate) {

  const today =
    new Date().toISOString().split("T")[0];

  pickupDate.min = today;

}


/* ================= SEARCH ================= */

const searchBtn = document.getElementById("searchBtn");

if (searchBtn) {

  searchBtn.addEventListener("click", () => {

    const location =
      document.getElementById("locationInput").value.trim();

    const date =
      document.getElementById("pickupDate").value;

    const time =
      document.getElementById("pickupTime").value;

    const vehicle =
      document.getElementById("vehicleType").value;


    const params = new URLSearchParams();


    if (location) {
      params.set("location", location);
    }

    if (date) {
      params.set("date", date);
    }

    if (time) {
      params.set("time", time);
    }


    if (vehicle !== "all") {
      params.set("vehicle", vehicle);
    }


    if (vehicle === "car") {

      window.location.href =
        "cars.html" +
        (params.toString()
          ? "?" + params.toString()
          : "");

      return;
    }


    window.location.href =
      "bikes.html" +
      (params.toString()
        ? "?" + params.toString()
        : "");

  });

}


/* ================= NEWSLETTER ================= */

const subscribeBtn =
  document.getElementById("subscribeBtn");

if (subscribeBtn) {

  subscribeBtn.addEventListener("click", () => {

    const emailInput =
      document.getElementById("newsletterEmail");

    const message =
      document.getElementById("subscribeMessage");

    const email =
      emailInput.value.trim();


    if (!email) {

      message.innerText =
        "Please enter your email.";

      return;
    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

      message.innerText =
        "Please enter a valid email.";

      return;
    }


    message.innerText =
      "Thanks! You're subscribed.";

    emailInput.value = "";

  });

}


/* ================= FOOTER YEAR ================= */

const footerBottom =
  document.querySelector(".footer-bottom");

if (footerBottom) {

  footerBottom.innerHTML =
    footerBottom.innerHTML.replace(
      "2026",
      new Date().getFullYear()
    );

}


/* ================= PAGE LOAD ================= */

console.log(
  "RentoRide Premium Home Loaded Successfully"
);
