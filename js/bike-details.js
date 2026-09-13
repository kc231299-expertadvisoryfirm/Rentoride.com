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
     BIKE DATA
     ========================================================= */

  const bikes = {

    "classic-350": {
      name: "Royal Enfield Classic 350",
      subtitle: "Royal Enfield · Classic 350",
      brand: "Royal Enfield",
      model: "Classic 350",
      location: "Kota, Rajasthan",
      rating: "4.8",

      price3: "₹299",
      price6: "₹499",
      price12: "₹799",
      price24: "₹1,199",

      image:
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85",

      description:
        "A clean and well-maintained Royal Enfield Classic 350 available for comfortable city rides, weekend trips and daily travel. Vehicle condition is checked before every booking."
    },


    "pulsar-ns200": {
      name: "Bajaj Pulsar NS200",
      subtitle: "Bajaj · Pulsar NS200",
      brand: "Bajaj",
      model: "Pulsar NS200",
      location: "Kota, Rajasthan",
      rating: "4.7",

      price3: "₹249",
      price6: "₹449",
      price12: "₹699",
      price24: "₹999",

      image:
        "https://images.unsplash.com/photo-1558980394-0c7b6e3c2a4a?auto=format&fit=crop&w=1200&q=85",

      description:
        "A sporty and responsive bike suitable for city commuting and longer rides. The vehicle is inspected before handover."
    },


    "ktm-duke-250": {
      name: "KTM Duke 250",
      subtitle: "KTM · Duke 250",
      brand: "KTM",
      model: "Duke 250",
      location: "Kota, Rajasthan",
      rating: "4.9",

      price3: "₹299",
      price6: "₹549",
      price12: "₹849",
      price24: "₹1,299",

      image:
        "https://images.unsplash.com/photo-1558980664-10ea6b7e4a2c?auto=format&fit=crop&w=1200&q=85",

      description:
        "A premium street bike for customers looking for a fun and comfortable riding experience."
    }

  };


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
    bike.price3;

  document.getElementById("price6").textContent =
    bike.price6;

  document.getElementById("price12").textContent =
    bike.price12;

  document.getElementById("price24").textContent =
    bike.price24;


  /* =========================================================
     DETAILS
     ========================================================= */

  document.getElementById("detailBrand").textContent =
    bike.brand;

  document.getElementById("detailModel").textContent =
    bike.model;

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

  bookNowBtn.href =
    `booking.html?id=${encodeURIComponent(
      bikeId || "classic-350"
    )}`;


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

      else {

        alert(
          "Copy this page URL to share it."
        );

      }

    }

    catch (error) {

      // User cancelled sharing.

    }

  });


  /* =========================================================
     CONTACT OWNER
     ========================================================= */

  contactOwnerBtn.addEventListener(
    "click",
    () => {

      alert(
        "Owner contact/chat will be connected after login."
      );

    }
  );


});
