/* =========================================================
   RentoRide — Booking JS

   Backend note: bookings are saved to localStorage for now
   (key: "rentoride_bookings") since Supabase is deferred.
   my-bookings.js will need updating later to read from here
   until the real backend is wired in.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const bikeId = params.get("id");

  const bikes = window.RENTORIDE_BIKES || {};
  const bike = bikeId ? bikes[bikeId] : null;

  const notFoundState = document.getElementById("notFoundState");
  const bookingFormWrap = document.getElementById("bookingFormWrap");
  const successState = document.getElementById("successState");


  /* =========================================================
     BAD OR MISSING ID — SHOW NOT-FOUND, STOP HERE
     ========================================================= */

  if (!bike) {

    notFoundState.classList.add("show");
    bookingFormWrap.style.display = "none";

    return;
  }


  /* =========================================================
     ELEMENTS
     ========================================================= */

  const breadcrumbBikeLink = document.getElementById("breadcrumbBikeLink");

  const summaryImage = document.getElementById("summaryImage");
  const summaryName = document.getElementById("summaryName");
  const summaryLocation = document.getElementById("summaryLocation");
  const summaryEngine = document.getElementById("summaryEngine");
  const summaryRating = document.getElementById("summaryRating");
  const summaryPrice36 = document.getElementById("summaryPrice36");
  const summaryPrice1224 = document.getElementById("summaryPrice1224");

  const pickupDate = document.getElementById("pickupDate");
  const pickupTime = document.getElementById("pickupTime");
  const dropDate = document.getElementById("dropDate");
  const dropTime = document.getElementById("dropTime");

  const bookingError = document.getElementById("bookingError");
  const priceBreakdown = document.getElementById("priceBreakdown");
  const durationText = document.getElementById("durationText");
  const rateAppliedText = document.getElementById("rateAppliedText");
  const totalAmountText = document.getElementById("totalAmountText");

  const confirmBtn = document.getElementById("confirmBtn");

  const successText = document.getElementById("successText");
  const successRef = document.getElementById("successRef");


  /* =========================================================
     POPULATE VEHICLE SUMMARY
     ========================================================= */

  breadcrumbBikeLink.href = `bike-details.html?id=${encodeURIComponent(bikeId)}`;
  breadcrumbBikeLink.textContent = bike.name;

  summaryImage.src = bike.image;
  summaryImage.alt = bike.name;
  summaryName.textContent = bike.name;
  summaryLocation.textContent = `📍 ${bike.location}`;
  summaryEngine.textContent = bike.engine;
  summaryRating.textContent = `⭐ ${bike.rating}`;
  summaryPrice36.textContent = `₹${bike.price3} / ₹${bike.price6}`;
  summaryPrice1224.textContent = `₹${bike.price12} / ₹${bike.price24}`;


  /* =========================================================
     DATE DEFAULTS — no picking a pickup date in the past
     ========================================================= */

  const today = new Date().toISOString().split("T")[0];
  pickupDate.min = today;
  dropDate.min = today;


  /* =========================================================
     PRICE CALCULATION
     ========================================================= */

  function getRateLabel(hours) {

    if (hours <= 3) return "3 Hour rate";
    if (hours <= 6) return "6 Hour rate";
    if (hours <= 12) return "12 Hour rate";
    if (hours <= 24) return "24 Hour rate";

    return "24 Hour rate × " + Math.ceil(hours / 24) + " days";
  }

  function showError(message) {

    bookingError.textContent = message;
    bookingError.classList.add("show");

    priceBreakdown.style.display = "none";
    confirmBtn.disabled = true;
  }

  function clearError() {

    bookingError.textContent = "";
    bookingError.classList.remove("show");
  }

  function recalculate() {

    const startValue = pickupDate.value;
    const endValue = dropDate.value;
    const startTime = pickupTime.value;
    const endTime = dropTime.value;

    // Wait until all four fields are filled before validating
    if (!startValue || !endValue || !startTime || !endTime) {

      clearError();
      priceBreakdown.style.display = "none";
      confirmBtn.disabled = true;

      return;
    }

    const start = new Date(`${startValue}T${startTime}`);
    const end = new Date(`${endValue}T${endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {

      showError("Please enter valid dates and times.");

      return;
    }

    const diffMs = end - start;

    if (diffMs <= 0) {

      showError("Drop-off must be after pickup.");

      return;
    }

    const hours = diffMs / (1000 * 60 * 60);

    const amount = rentoRideCalculatePrice(bike, hours);

    if (!amount) {

      showError("Unable to calculate price for this duration.");

      return;
    }

    clearError();

    const roundedHours = Math.round(hours * 10) / 10;

    durationText.textContent = `${roundedHours} hour${roundedHours === 1 ? "" : "s"}`;
    rateAppliedText.textContent = getRateLabel(hours);
    totalAmountText.textContent = `₹${amount}`;

    priceBreakdown.style.display = "block";
    confirmBtn.disabled = false;

    confirmBtn.dataset.amount = amount;
    confirmBtn.dataset.hours = roundedHours;
  }

  [pickupDate, pickupTime, dropDate, dropTime].forEach(input => {

    input.addEventListener("change", recalculate);
  });


  /* =========================================================
     CONFIRM BOOKING — saved to localStorage until Supabase
     is wired in (see file header note)
     ========================================================= */

  function generateBookingId() {

    return "RR" + Date.now().toString().slice(-8);
  }

  function saveBooking(booking) {

    let bookings = [];

    try {

      bookings = JSON.parse(localStorage.getItem("rentoride_bookings")) || [];

    } catch (error) {

      bookings = [];
    }

    bookings.unshift(booking);

    localStorage.setItem("rentoride_bookings", JSON.stringify(bookings));
  }

  confirmBtn.addEventListener("click", () => {

    if (confirmBtn.disabled) return;

    const amount = Number(confirmBtn.dataset.amount || 0);

    if (!amount) return;

    const bookingId = generateBookingId();

    const booking = {

      id: bookingId,
      bikeId: bikeId,
      bikeName: bike.name,
      bikeImage: bike.image,
      location: bike.location,

      startDate: pickupDate.value,
      startTime: pickupTime.value,
      endDate: dropDate.value,
      endTime: dropTime.value,

      amount: amount,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    saveBooking(booking);

    bookingFormWrap.style.display = "none";

    successText.textContent =
      `Your booking for ${bike.name} has been submitted and is awaiting owner confirmation.`;

    successRef.textContent = `Booking ID: ${bookingId}`;

    successState.classList.add("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

});
