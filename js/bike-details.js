/* =========================================================
   RentoRide — Bike Details JS  (Supabase-backed)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/bikes-data.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/bike-details.js"></script>
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const bikeId = params.get("id");

  const mainImage = document.getElementById("mainBikeImage");
  const favoriteBtn = document.getElementById("favoriteBtn");
  const shareBtn = document.getElementById("shareBtn");
  const bookNowBtn = document.getElementById("bookNowBtn");
  const contactOwnerBtn = document.getElementById("contactOwnerBtn");

  if (!bikeId) {
    document.querySelector(".details-section").innerHTML =
      `<div class="container"><p>No vehicle specified. <a href="bikes.html">Browse bikes</a></p></div>`;
    return;
  }


  /* =========================================================
     FETCH BIKE
     ========================================================= */

  const { data: bike, error } = await window.supabaseClient
    .from("bikes")
    .select("*")
    .eq("id", bikeId)
    .eq("status", "approved")
    .single();

  if (error || !bike) {
    document.querySelector(".details-section").innerHTML =
      `<div class="container"><p>This vehicle isn't available. <a href="bikes.html">Browse other bikes</a></p></div>`;
    return;
  }


  /* =========================================================
     PAGE TITLE + BASIC INFO
     ========================================================= */

  document.title = `RentoRide | ${bike.name}`;

  document.getElementById("bikeName").textContent = bike.name;
  document.getElementById("bikeSubtitle").textContent = `${bike.brand} · ${bike.model}`;
  document.getElementById("bikeLocation").textContent = bike.location;
  document.getElementById("bikeRating").textContent = Number(bike.rating || 0).toFixed(1);


  /* =========================================================
     PRICES
     ========================================================= */

  document.getElementById("price3").textContent = "₹" + bike.price_3h;
  document.getElementById("price6").textContent = "₹" + bike.price_6h;
  document.getElementById("price12").textContent = "₹" + bike.price_12h;
  document.getElementById("price24").textContent = "₹" + bike.price_24h;


  /* =========================================================
     DETAILS
     ========================================================= */

  document.getElementById("detailBrand").textContent = bike.brand;
  document.getElementById("detailModel").textContent = bike.model;
  document.getElementById("detailEngine").textContent = bike.engine_cc || "—";
  document.getElementById("bikeEngine").textContent = bike.engine_cc || "—";
  document.getElementById("descriptionText").textContent =
    bike.description || "A well-maintained vehicle, inspected before every rental.";

  document.getElementById("breadcrumbBike").textContent = bike.name;

  const availabilityBadge = document.getElementById("availabilityBadge");
  if (availabilityBadge) {
    availabilityBadge.textContent = bike.is_available ? "● Available" : "● Unavailable";
    availabilityBadge.classList.toggle("unavailable", !bike.is_available);
  }


  /* =========================================================
     IMAGES — main + gallery from Supabase Storage URLs
     ========================================================= */

  const images = [bike.image_url, ...(bike.gallery_urls || [])].filter(Boolean);
  const displayImages = images.length ? images : [RENTORIDE_FALLBACK_IMAGE];

  mainImage.src = displayImages[0];
  mainImage.alt = bike.name;

  const thumbnailRow = document.querySelector(".thumbnail-row");
  if (thumbnailRow) {
    thumbnailRow.innerHTML = displayImages.map((src, i) => `
      <button class="thumb ${i === 0 ? "active" : ""}">
        <img src="${src}" alt="">
      </button>
    `).join("");
  }

  document.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const image = thumb.querySelector("img");
      if (!image) return;
      mainImage.src = image.src;
      document.querySelectorAll(".thumb").forEach(item => item.classList.remove("active"));
      thumb.classList.add("active");
    });
  });


  /* =========================================================
     OWNER INFO
     ========================================================= */

  const { data: owner } = await window.supabaseClient
    .from("profiles")
    .select("name")
    .eq("id", bike.owner_id)
    .single();

  const ownerNameEl = document.getElementById("ownerName");
  if (ownerNameEl && owner) ownerNameEl.textContent = owner.name;


  /* =========================================================
     BOOK NOW
     ========================================================= */

  function updateBookNowLink(hours) {
    let url = `booking.html?id=${encodeURIComponent(bikeId)}`;
    if (hours) url += `&hours=${encodeURIComponent(hours)}`;
    bookNowBtn.href = url;
  }

  updateBookNowLink();

  const priceBoxes = document.querySelectorAll("#priceGrid .price-box");

  priceBoxes.forEach(box => {
    box.addEventListener("click", () => {
      priceBoxes.forEach(item => item.classList.remove("selected"));
      box.classList.add("selected");
      updateBookNowLink(box.dataset.hours);
    });
  });

  const defaultBox = document.querySelector('#priceGrid .price-box[data-hours="24"]');
  if (defaultBox) {
    defaultBox.classList.add("selected");
    updateBookNowLink(defaultBox.dataset.hours);
  }

  if (!bike.is_available) {
    bookNowBtn.classList.add("disabled");
    bookNowBtn.textContent = "Currently Unavailable";
    bookNowBtn.addEventListener("click", e => e.preventDefault());
  }


  /* =========================================================
     FAVORITE
     ========================================================= */

  favoriteBtn.addEventListener("click", () => {
    favoriteBtn.classList.toggle("liked");
    favoriteBtn.textContent = favoriteBtn.classList.contains("liked") ? "♥" : "♡";
  });


  /* =========================================================
     SHARE
     ========================================================= */

  shareBtn.addEventListener("click", async () => {

    const shareData = {
      title: bike.name,
      text: `Check out ${bike.name} on RentoRide.`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.textContent = "✓ Copied";
        setTimeout(() => { shareBtn.textContent = "↗ Share"; }, 1600);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  });


  /* =========================================================
     CONTACT OWNER
     ========================================================= */

  if (contactOwnerBtn) {
    contactOwnerBtn.addEventListener("click", async () => {

      const current = await window.RentoRideAuth.getCurrentUser();

      if (!current) {
        window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }

      alert("In-app messaging is coming soon. For now, contact details are shared after booking confirmation.");
    });
  }

});
