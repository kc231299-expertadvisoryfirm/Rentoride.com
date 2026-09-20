/* =========================================================
   RentoRide — Booking JS  (Supabase-backed, auth-required)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/bikes-data.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/booking.js"></script>

   THIS IS THE FIX for the core bug in the project: the old
   booking.js saved to localStorage ("rentoride_bookings") while
   my-bookings.js and the owner dashboard both read from Supabase.
   A customer could "successfully" book and never see it anywhere.
   Bookings now write directly to the `bookings` table, which is
   the same table every other page reads from.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const bikeId = params.get("id");

  const notFoundState = document.getElementById("notFoundState");
  const bookingFormWrap = document.getElementById("bookingFormWrap");
  const successState = document.getElementById("successState");


  /* =========================================================
     MUST BE LOGGED IN TO BOOK — bounce to login, then back here
     ========================================================= */

  const current = await window.RentoRideAuth.requireAuth();
  if (!current) return; // requireAuth already redirected


  /* =========================================================
     MISSING ID — SHOW NOT-FOUND, STOP HERE
     ========================================================= */

  if (!bikeId) {
    notFoundState.classList.add("show");
    bookingFormWrap.style.display = "none";
    return;
  }


  /* =========================================================
     FETCH BIKE FROM SUPABASE
     ========================================================= */

  bookingFormWrap.style.display = "none";

  const { data: bike, error: bikeError } = await window.supabaseClient
    .from("bikes")
    .select("*")
    .eq("id", bikeId)
    .eq("status", "approved")
    .single();

  if (bikeError || !bike) {
    notFoundState.classList.add("show");
    return;
  }

  bookingFormWrap.style.display = "";


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

  summaryImage.src = bike.image_url || RENTORIDE_FALLBACK_IMAGE;
  summaryImage.alt = bike.name;
  summaryName.textContent = bike.name;
  summaryLocation.textContent = `📍 ${bike.location}`;
  summaryEngine.textContent = bike.engine_cc || "—";
  summaryRating.textContent = `⭐ ${Number(bike.rating || 0).toFixed(1)}`;
  summaryPrice36.textContent = `₹${bike.price_3h} / ₹${bike.price_6h}`;
  summaryPrice1224.textContent = `₹${bike.price_12h} / ₹${bike.price_24h}`;


  /* =========================================================
     DATE DEFAULTS
     ========================================================= */

  const today = new Date().toISOString().split("T")[0];
  pickupDate.min = today;
  dropDate.min = today;


  /* =========================================================
     AVAILABILITY CHECK — reject overlapping bookings
     ========================================================= */

  async function hasConflict(startDate, startTime, endDate, endTime) {

    const { data: existing, error } = await window.supabaseClient
      .from("bookings")
      .select("start_date, start_time, end_date, end_time, status")
      .eq("bike_id", bikeId)
      .in("status", ["pending", "accepted", "active"]);

    if (error) {
      console.error("Availability check error:", error);
      return false; // fail open on check errors rather than blocking a booking
    }

    const newStart = new Date(`${startDate}T${startTime}`);
    const newEnd = new Date(`${endDate}T${endTime}`);

    return (existing || []).some(b => {
      const existingStart = new Date(`${b.start_date}T${b.start_time}`);
      const existingEnd = new Date(`${b.end_date}T${b.end_time}`);
      return newStart < existingEnd && newEnd > existingStart;
    });
  }


  /* =========================================================
     PRICE CALCULATION
     ========================================================= */

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

  async function recalculate() {

    const startValue = pickupDate.value;
    const endValue = dropDate.value;
    const startTime = pickupTime.value;
    const endTime = dropTime.value;

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

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Checking availability...";

    const conflict = await hasConflict(startValue, startTime, endValue, endTime);

    confirmBtn.textContent = "Confirm Booking →";

    if (conflict) {
      showError("This vehicle is already booked for part of that time range. Please choose different dates.");
      return;
    }

    clearError();

    const roundedHours = Math.round(hours * 10) / 10;

    durationText.textContent = `${roundedHours} hour${roundedHours === 1 ? "" : "s"}`;
    rateAppliedText.textContent = rentoRideGetRateLabel(hours);
    totalAmountText.textContent = `₹${amount}`;

    priceBreakdown.style.display = "block";
    confirmBtn.disabled = false;

    confirmBtn.dataset.amount = amount;
    confirmBtn.dataset.hours = roundedHours;
  }


  /* =========================================================
     PRE-FILL FROM BIKE DETAILS PAGE (?hours=)
     ========================================================= */

  const requestedHours = Number(params.get("hours"));

  if (requestedHours > 0) {

    const now = new Date();
    now.setMinutes(now.getMinutes() + (30 - (now.getMinutes() % 30 || 30)));

    const dropDateTime = new Date(now.getTime() + requestedHours * 60 * 60 * 1000);

    const toDateInput = d => d.toISOString().split("T")[0];
    const toTimeInput = d => d.toTimeString().slice(0, 5);

    pickupDate.value = toDateInput(now);
    pickupTime.value = toTimeInput(now);
    dropDate.value = toDateInput(dropDateTime);
    dropTime.value = toTimeInput(dropDateTime);
  }

  [pickupDate, pickupTime, dropDate, dropTime].forEach(input => {
    input.addEventListener("change", recalculate);
  });

  if (requestedHours > 0) recalculate();


  /* =========================================================
     CONFIRM BOOKING — writes to Supabase `bookings`
     ========================================================= */

  confirmBtn.addEventListener("click", async () => {

    if (confirmBtn.disabled) return;

    const amount = Number(confirmBtn.dataset.amount || 0);
    if (!amount) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Confirming...";

    // re-check availability right before insert to close the race
    // window between the last recalculate() and the click
    const conflict = await hasConflict(
      pickupDate.value, pickupTime.value, dropDate.value, dropTime.value
    );

    if (conflict) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Booking →";
      showError("This vehicle was just booked for that time. Please pick different dates.");
      return;
    }

    const { data: booking, error } = await window.supabaseClient
      .from("bookings")
      .insert({
        bike_id: bikeId,
        customer_id: current.authUser.id,
        start_date: pickupDate.value,
        start_time: pickupTime.value,
        end_date: dropDate.value,
        end_time: dropTime.value,
        duration_hours: Number(confirmBtn.dataset.hours),
        rate_applied: rateAppliedText.textContent,
        amount: amount,
        status: "pending"
      })
      .select("booking_ref")
      .single();

    if (error) {
      console.error("Booking insert error:", error);
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Booking →";
      showError("Could not confirm your booking. Please try again.");
      return;
    }

    bookingFormWrap.style.display = "none";

    successText.textContent =
      `Your booking for ${bike.name} has been submitted and is awaiting owner confirmation.`;

    successRef.textContent = `Booking ID: ${booking.booking_ref}`;

    successState.classList.add("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

});
