/* ================= MOBILE MENU ================= */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {

  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  navMenu.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });

  });

}


/* ================= FILTER TOGGLE ================= */

const filterBox = document.querySelector(".filter-box");

if (filterBox) {

  /* Create Filter Button */

  const filterButton = document.createElement("button");

  filterButton.className = "filter-toggle";

  filterButton.innerHTML = `
    <span>⚙ FILTER OPTIONS</span>
    <span>▲</span>
  `;

  /* Put button at top */

  filterBox.insertBefore(
    filterButton,
    filterBox.firstChild
  );


  /* Put all existing filter content inside wrapper */

  const filterContent = document.createElement("div");

  filterContent.className = "filter-content";


  while (filterBox.children.length > 1) {

    filterContent.appendChild(
      filterBox.children[1]
    );

  }


  filterBox.appendChild(filterContent);


  /* Toggle */

  filterButton.addEventListener("click", () => {

    filterBox.classList.toggle("collapsed");

    const arrow =
      filterButton.querySelector("span:last-child");

    if (filterBox.classList.contains("collapsed")) {

      arrow.textContent = "▼";

    } else {

      arrow.textContent = "▲";

    }

  });

}


/* ================= DATE ================= */

const pickupDate =
  document.getElementById("pickupDate");

if (pickupDate) {

  const today =
    new Date().toISOString().split("T")[0];

  pickupDate.min = today;

}


/* ================= ELEMENTS ================= */

const bikeGrid =
  document.getElementById("bikeGrid");

const bikeCards =
  Array.from(
    document.querySelectorAll(".bike-card")
  );

const bikeSearch =
  document.getElementById("bikeSearch");

const priceRange =
  document.getElementById("priceRange");

const availableOnly =
  document.getElementById("availableOnly");

const sortSelect =
  document.getElementById("sortSelect");

const bikeCount =
  document.getElementById("bikeCount");

const noResults =
  document.getElementById("noResults");

const locationInput =
  document.getElementById("locationInput");

const locationTitle =
  document.getElementById("locationTitle");

let selectedRating = 0;


/* ================= FILTER FUNCTION ================= */

function filterBikes() {

  const searchValue =
    bikeSearch
      ? bikeSearch.value.toLowerCase().trim()
      : "";

  const maxPrice =
    priceRange
      ? Number(priceRange.value)
      : 2000;

  const onlyAvailable =
    availableOnly
      ? availableOnly.checked
      : false;


  let visibleCards = [];


  bikeCards.forEach(card => {

    const name =
      (card.dataset.name || "").toLowerCase();

    const price =
      Number(card.dataset.price || 0);

    const rating =
      Number(card.dataset.rating || 0);

    const available =
      card.dataset.available === "true";


    let show = true;


    /* SEARCH */

    if (
      searchValue &&
      !name.includes(searchValue)
    ) {
      show = false;
    }


    /* PRICE */

    if (price > maxPrice) {
      show = false;
    }


    /* RATING */

    if (rating < selectedRating) {
      show = false;
    }


    /* AVAILABILITY */

    if (
      onlyAvailable &&
      !available
    ) {
      show = false;
    }


    card.style.display =
      show ? "" : "none";


    if (show) {
      visibleCards.push(card);
    }

  });


  /* COUNT */

  if (bikeCount) {

    bikeCount.textContent =
      `${visibleCards.length} Bikes available`;

  }


  /* NO RESULTS */

  if (noResults) {

    noResults.classList.toggle(
      "show",
      visibleCards.length === 0
    );

  }

}


/* ================= SEARCH ================= */

if (bikeSearch) {

  bikeSearch.addEventListener(
    "input",
    filterBikes
  );

}


/* ================= PRICE ================= */

if (priceRange) {

  priceRange.addEventListener(
    "input",
    filterBikes
  );

}


/* ================= AVAILABILITY ================= */

if (availableOnly) {

  availableOnly.addEventListener(
    "change",
    filterBikes
  );

}


/* ================= RATING ================= */

document
  .querySelectorAll(".rating-filter")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".rating-filter")
        .forEach(btn => {

          btn.classList.remove("active");

        });


      button.classList.add("active");


      selectedRating =
        Number(button.dataset.rating);


      filterBikes();

    });

  });


/* ================= SORT ================= */

if (sortSelect && bikeGrid) {

  sortSelect.addEventListener(
    "change",
    () => {

      const cards =
        Array.from(
          document.querySelectorAll(".bike-card")
        );


      const type =
        sortSelect.value;


      cards.sort((a, b) => {

        const priceA =
          Number(a.dataset.price || 0);

        const priceB =
          Number(b.dataset.price || 0);

        const ratingA =
          Number(a.dataset.rating || 0);

        const ratingB =
          Number(b.dataset.rating || 0);


        if (type === "priceLow") {
          return priceA - priceB;
        }


        if (type === "priceHigh") {
          return priceB - priceA;
        }


        if (type === "rating") {
          return ratingB - ratingA;
        }


        return 0;

      });


      cards.forEach(card => {

        bikeGrid.appendChild(card);

      });


      filterBikes();

    }
  );

}


/* ================= LOCATION SEARCH ================= */

const searchBtn =
  document.getElementById("searchBtn");

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const location =
        locationInput
          ? locationInput.value.trim()
          : "";


      if (location && locationTitle) {

        locationTitle.textContent =
          location.split(",")[0];

      }


      filterBikes();


      document
        .querySelector(".listing-section")
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );

}


/* ================= CLEAR FILTERS ================= */

const clearFilters =
  document.getElementById("clearFilters");

if (clearFilters) {

  clearFilters.addEventListener(
    "click",
    () => {

      if (bikeSearch) {
        bikeSearch.value = "";
      }


      if (priceRange) {
        priceRange.value = 2000;
      }


      if (availableOnly) {
        availableOnly.checked = true;
      }


      selectedRating = 0;


      document
        .querySelectorAll(".rating-filter")
        .forEach(button => {

          button.classList.remove("active");

          if (
            button.dataset.rating === "0"
          ) {

            button.classList.add("active");

          }

        });


      document
        .querySelectorAll(
          '.filter-group input[type="checkbox"]'
        )
        .forEach(checkbox => {

          if (checkbox.value === "all") {
            checkbox.checked = true;
          }

        });


      filterBikes();

    }
  );

}


/* ================= FAVORITES ================= */

document
  .querySelectorAll(".favorite")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        button.classList.toggle("liked");

        button.textContent =
          button.classList.contains("liked")
            ? "♥"
            : "♡";

      }
    );

  });


/* ================= URL PARAMETERS ================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const urlLocation =
  urlParams.get("location");

const urlDate =
  urlParams.get("date");

const urlTime =
  urlParams.get("time");


if (urlLocation && locationInput) {

  locationInput.value =
    urlLocation;

  if (locationTitle) {

    locationTitle.textContent =
      urlLocation.split(",")[0];

  }

}


if (urlDate && pickupDate) {

  pickupDate.value =
    urlDate;

}


if (urlTime) {

  const pickupTime =
    document.getElementById("pickupTime");

  if (pickupTime) {

    pickupTime.value =
      urlTime;

  }

}


/* ================= INITIAL LOAD ================= */

filterBikes();

console.log(
  "RentoRide Bikes Page Loaded Successfully"
);
