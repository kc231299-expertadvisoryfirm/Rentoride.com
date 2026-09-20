/* =========================================================
   RentoRide — Bikes Listing JS  (live Supabase data)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/bikes-data.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/bikes.js"></script>

   REPLACES the previous version, which filtered/sorted 8
   hardcoded <article class="bike-card"> elements already in
   bikes.html. Those static cards are removed from bikes.html;
   this file now builds the grid at runtime from `bikes` where
   status='approved', then applies the same filter/sort/search
   logic as before on the live data.

   bikes.html markup needed for this file:
     <div class="bike-grid" id="bikeGrid"></div>
     (everything else — filter sidebar, sort select, search box —
     is unchanged from the existing markup and IDs)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ================= ELEMENTS ================= */

  const bikeGrid = document.getElementById("bikeGrid");
  const bikeSearch = document.getElementById("bikeSearch");
  const priceRange = document.getElementById("priceRange");
  const availableOnly = document.getElementById("availableOnly");
  const sortSelect = document.getElementById("sortSelect");
  const bikeCount = document.getElementById("bikeCount");
  const noResults = document.getElementById("noResults");
  const locationInput = document.getElementById("locationInput");
  const locationTitle = document.getElementById("locationTitle");
  const pickupDate = document.getElementById("pickupDate");

  let allBikes = [];       // raw data from Supabase, fetched once
  let selectedRating = 0;
  let selectedType = "all";
  let selectedFuel = "all";

  if (pickupDate) {
    pickupDate.min = new Date().toISOString().split("T")[0];
  }


  /* ================= LOADING / EMPTY / ERROR STATES ================= */

  function showLoading() {
    bikeGrid.innerHTML = `
      <div class="grid-loading">
        ${Array(6).fill('<div class="bike-card-skeleton"></div>').join("")}
      </div>`;
  }

  function showLoadError() {
    bikeGrid.innerHTML = `
      <div class="grid-error">
        <p>We couldn't load bikes right now. Please check your connection and try again.</p>
        <button id="retryLoadBikes" class="search-btn">Retry</button>
      </div>`;

    document.getElementById("retryLoadBikes")
      ?.addEventListener("click", loadBikes);
  }


  /* ================= FETCH ================= */

  async function loadBikes() {

    showLoading();

    const { data, error } = await window.supabaseClient
      .from("bikes")
      .select("*")
      .eq("status", "approved")
      .order("rating", { ascending: false });

    if (error) {
      console.error("Bikes fetch error:", error);
      showLoadError();
      return;
    }

    allBikes = data || [];

    renderAndFilter();
  }


  /* ================= CARD TEMPLATE ================= */

  function createBikeCard(bike) {

    const article = document.createElement("article");
    article.className = "bike-card";
    article.dataset.available = bike.is_available;
    article.dataset.fuel = (bike.fuel_type || "").toLowerCase();
    article.dataset.type = bike.vehicle_type || "bike";
    article.dataset.name = bike.name;
    article.dataset.price = bike.price_24h;
    article.dataset.rating = bike.rating || 0;

    const image = bike.image_url || RENTORIDE_FALLBACK_IMAGE;

    article.innerHTML = `
      <div class="bike-image">
        <img loading="lazy" alt="${escapeHtml(bike.name)}" src="${image}">
        <span class="available">${bike.is_available ? "Available" : "Unavailable"}</span>
        <button class="favorite" type="button" aria-label="Add to favourites">♡</button>
      </div>
      <div class="bike-body">
        <div class="bike-title">
          <h3>${escapeHtml(bike.name)}</h3>
          <span class="rating">⭐ ${Number(bike.rating || 0).toFixed(1)}</span>
        </div>
        <p class="bike-location">📍 ${escapeHtml(bike.location)}</p>
        <p class="bike-spec">${escapeHtml(bike.engine_cc || "")} • ${escapeHtml(bike.fuel_type)} • 2 Seater</p>
        <div class="packages">
          <button class="package-btn" data-bike-id="${bike.id}" data-hours="3" type="button"><small>3H</small><b>₹${bike.price_3h}</b></button>
          <button class="package-btn" data-bike-id="${bike.id}" data-hours="6" type="button"><small>6H</small><b>₹${bike.price_6h}</b></button>
          <button class="package-btn" data-bike-id="${bike.id}" data-hours="12" type="button"><small>12H</small><b>₹${bike.price_12h}</b></button>
          <button class="package-btn" data-bike-id="${bike.id}" data-hours="24" type="button"><small>24H</small><b>₹${bike.price_24h}</b></button>
        </div>
        <a class="details-btn" href="bike-details.html?id=${bike.id}">VIEW DETAILS</a>
      </div>
    `;

    return article;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str || "");
    return div.innerHTML;
  }


  /* ================= FILTER + SORT + RENDER ================= */

  function renderAndFilter() {

    const searchValue = bikeSearch ? bikeSearch.value.toLowerCase().trim() : "";
    const maxPrice = priceRange ? Number(priceRange.value) : Infinity;
    const onlyAvailable = availableOnly ? availableOnly.checked : false;
    const sortType = sortSelect ? sortSelect.value : "popular";

    let filtered = allBikes.filter(bike => {

      if (searchValue && !bike.name.toLowerCase().includes(searchValue)) return false;
      if (Number(bike.price_24h) > maxPrice) return false;
      if (Number(bike.rating || 0) < selectedRating) return false;
      if (onlyAvailable && !bike.is_available) return false;
      if (selectedType !== "all" && bike.vehicle_type !== selectedType) return false;
      if (selectedFuel !== "all" && (bike.fuel_type || "").toLowerCase() !== selectedFuel) return false;

      return true;
    });

    filtered.sort((a, b) => {
      if (sortType === "priceLow") return a.price_24h - b.price_24h;
      if (sortType === "priceHigh") return b.price_24h - a.price_24h;
      if (sortType === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0; // popular = server order (by rating desc already)
    });

    bikeGrid.innerHTML = "";

    if (!filtered.length) {
      noResults?.classList.add("show");
    } else {
      noResults?.classList.remove("show");
      filtered.forEach(bike => bikeGrid.appendChild(createBikeCard(bike)));
    }

    if (bikeCount) {
      bikeCount.textContent = `${filtered.length} Bike${filtered.length === 1 ? "" : "s"} available`;
    }

    attachCardListeners();
  }


  /* ================= CARD INTERACTIONS (delegated, re-attached each render) ================= */

  function attachCardListeners() {

    bikeGrid.querySelectorAll(".package-btn").forEach(btn => {

      btn.addEventListener("click", () => {

        const siblingBtns = btn.closest(".packages")?.querySelectorAll(".package-btn") || [];
        siblingBtns.forEach(sib => sib.classList.remove("selected"));
        btn.classList.add("selected");

        const bikeId = btn.dataset.bikeId;
        const hours = btn.dataset.hours;

        window.location.href =
          `booking.html?id=${encodeURIComponent(bikeId)}&hours=${encodeURIComponent(hours)}`;
      });
    });

    bikeGrid.querySelectorAll(".favorite").forEach(button => {

      button.addEventListener("click", () => {
        button.classList.toggle("liked");
        button.textContent = button.classList.contains("liked") ? "♥" : "♡";
      });
    });
  }


  /* ================= FILTER CONTROLS ================= */

  if (bikeSearch) bikeSearch.addEventListener("input", renderAndFilter);
  if (priceRange) priceRange.addEventListener("input", renderAndFilter);
  if (availableOnly) availableOnly.addEventListener("change", renderAndFilter);
  if (sortSelect) sortSelect.addEventListener("change", renderAndFilter);

  document.querySelectorAll(".rating-filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".rating-filter").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      selectedRating = Number(button.dataset.rating);
      renderAndFilter();
    });
  });

  document.querySelectorAll('.filter-group input[type="checkbox"][value]').forEach(checkbox => {
    checkbox.addEventListener("change", () => {

      const group = checkbox.closest(".filter-group");
      const isTypeGroup = group?.querySelector('input[value="sports"], input[value="cruiser"]');
      const siblings = group.querySelectorAll('input[type="checkbox"]');

      if (checkbox.value === "all" && checkbox.checked) {
        siblings.forEach(s => { if (s !== checkbox) s.checked = false; });
      } else if (checkbox.checked) {
        const allBox = [...siblings].find(s => s.value === "all");
        if (allBox) allBox.checked = false;
      }

      const checkedBox = [...siblings].find(s => s.checked) || null;
      const value = checkedBox ? checkedBox.value : "all";

      if (isTypeGroup) selectedType = value;
      else selectedFuel = value;

      renderAndFilter();
    });
  });

  const clearFilters = document.getElementById("clearFilters");
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      if (bikeSearch) bikeSearch.value = "";
      if (priceRange) priceRange.value = priceRange.max;
      if (availableOnly) availableOnly.checked = true;
      selectedRating = 0;
      selectedType = "all";
      selectedFuel = "all";

      document.querySelectorAll(".rating-filter").forEach(b => {
        b.classList.toggle("active", b.dataset.rating === "0");
      });

      document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => {
        cb.checked = cb.value === "all";
      });

      renderAndFilter();
    });
  }


  /* ================= LOCATION SEARCH + URL PARAMS ================= */

  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const location = locationInput ? locationInput.value.trim() : "";
      if (location && locationTitle) locationTitle.textContent = location.split(",")[0];
      renderAndFilter();
      document.querySelector(".listing-section")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const urlLocation = urlParams.get("location");
  if (urlLocation && locationInput) {
    locationInput.value = urlLocation;
    if (locationTitle) locationTitle.textContent = urlLocation.split(",")[0];
  }


  /* ================= INITIAL LOAD ================= */

  loadBikes();

});
