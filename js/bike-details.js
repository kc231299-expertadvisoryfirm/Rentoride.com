/* =========================================================
   RentoRide — Bike Details JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const bikeId = params.get("id");

  const mainImage = document.getElementById("mainBikeImage");
  const favoriteBtn = document.getElementById("favoriteBtn");
  const shareBtn = document.getElementById("shareBtn");
  const bookNowBtn = document.getElementById("bookNowBtn");
  const contactOwnerBtn = document.getElementById("contactOwnerBtn");


  /* =========================================================
     BIKE DATA — shared with booking.js via js/bikes-data.js
     ========================================================= */

  const bikes = window.RENTORIDE_BIKES || {};



  /* =========================================================
     SELECT BIKE
     ========================================================= */

  const bike =
    bikes[bikeId] || bikes["classic-350"];


  /* =========================================================
     PAGE TITLE
     ========================================================= */

  document.title =
    `RentoRide | ${bike.name}`;


  /* =========================================================
     BASIC BIKE INFORMATION
     ========================================================= */

  document.getElementById("bikeName").textContent =
    bike.name;

  document.getElementById("bikeSubtitle").textContent =
    bike.subtitle;

  document.getElementById("bikeLocation").textContent =
    bike.location;

  document.getElementById("bikeRating").textContent =
    bike.rating;


  /* =========================================================
     PRICES
     ========================================================= */

  document.getElementById("price3").textContent =
    "₹" + bike.price3;

  document.getElementById("price6").textContent =
    "₹" + bike.price6;

  document.getElementById("price12").textContent =
    "₹" + bike.price12;

  document.getElementById("price24").textContent =
    "₹" + bike.price24;


  /* =========================================================
     DETAILS
     ========================================================= */

  document.getElementById("detailBrand").textContent =
    bike.brand;

  document.getElementById("detailModel").textContent =
    bike.model;

  document.getElementById("detailEngine").textContent =
    bike.engine;

  document.getElementById("bikeEngine").textContent =
    bike.engine;

  document.getElementById("descriptionText").textContent =
    bike.description;


  /* =========================================================
     BREADCRUMB
     ========================================================= */

  document.getElementById("breadcrumbBike").textContent =
    bike.name;


  /* =========================================================
     MAIN IMAGE
     ========================================================= */

  mainImage.src = bike.image;
  mainImage.alt = bike.name;


  /* =========================================================
     BOOK NOW
     ========================================================= */

  const finalBikeId = bikeId || "classic-350";

  function updateBookNowLink(hours) {

    let url = `booking.html?id=${encodeURIComponent(finalBikeId)}`;

    if (hours) {
      url += `&hours=${encodeURIComponent(hours)}`;
    }

    bookNowBtn.href = url;
  }

  updateBookNowLink();


  /* =========================================================
     RENTAL DURATION SELECTION (price boxes)
     ========================================================= */

  const priceBoxes =
    document.querySelectorAll("#priceGrid .price-box");

  priceBoxes.forEach(box => {

    box.addEventListener("click", () => {

      priceBoxes.forEach(item => {
        item.classList.remove("selected");
      });

      box.classList.add("selected");

      updateBookNowLink(box.dataset.hours);

    });

  });

  // Default selection: the "Popular" 24-hour package
  const defaultBox =
    document.querySelector('#priceGrid .price-box[data-hours="24"]');

  if (defaultBox) {
    defaultBox.classList.add("selected");
    updateBookNowLink(defaultBox.dataset.hours);
  }


  /* =========================================================
     IMAGE THUMBNAILS
     ========================================================= */

  document.querySelectorAll(".thumb").forEach((thumb) => {

    thumb.addEventListener("click", () => {

      const image =
        thumb.querySelector("img");

      if (!image) return;


      mainImage.src =
        image.src;


      document
        .querySelectorAll(".thumb")
        .forEach(item => {

          item.classList.remove("active");

        });


      thumb.classList.add("active");

    });

  });


  /* =========================================================
     FAVORITE BUTTON
     ========================================================= */

  favoriteBtn.addEventListener("click", () => {

    favoriteBtn.classList.toggle("liked");


    if (
      favoriteBtn.classList.contains("liked")
    ) {

      favoriteBtn.textContent = "♥";

    } else {

      favoriteBtn.textContent = "♡";

    }

  });


  /* =========================================================
     SHARE BUTTON
     ========================================================= */

  shareBtn.addEventListener("click", async () => {

    const shareData = {

      title: bike.name,

      text:
        `Check out ${bike.name} on RentoRide.`,

      url:
        window.location.href

    };


    try {

      if (navigator.share) {

        await navigator.share(
          shareData
        );

      }

      else if (navigator.clipboard) {

        await navigator.clipboard.writeText(
          window.location.href
        );


        shareBtn.textContent =
          "✓ Copied";


        setTimeout(() => {

          shareBtn.textContent =
            "↗ Share";

        }, 1600);

      }

    } catch (error) {

      console.error(
        "Share failed:",
        error
      );

    }

  });


  /* =========================================================
     CONTACT OWNER BUTTON
     ========================================================= */

  if (contactOwnerBtn) {

    contactOwnerBtn.addEventListener("click", () => {

      alert(
        "Owner contact will be connected once messaging is live."
      );

    });

  }

});
