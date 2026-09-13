/* =========================================================
   RentoRide — List Your Vehicle JS
   ========================================================= */


/* =========================================================
   PROFILE DROPDOWN
   ========================================================= */

const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

if (profileBtn && profileMenu) {

  profileBtn.addEventListener("click", function (event) {

    event.stopPropagation();

    profileMenu.classList.toggle("show");

  });


  document.addEventListener("click", function () {

    profileMenu.classList.remove("show");

  });

}


/* =========================================================
   LOGOUT
   ========================================================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async function () {

    try {

      /*
       * Supabase logout yahan connect hoga.
       *
       * Agar tumhare project mein:
       * supabaseClient
       * already kisi common JS file mein bana hua hai,
       * to ye automatically use kar sakta hai.
       */

      if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient.auth
      ) {

        const { error } =
          await supabaseClient.auth.signOut();

        if (error) {
          console.error("Logout error:", error);
          return;
        }

      }

      window.location.href = "login.html";

    } catch (error) {

      console.error("Logout failed:", error);

    }

  });

}


/* =========================================================
   PICKUP & DROP TOGGLE
   ========================================================= */

const deliveryEnabled =
  document.getElementById("deliveryEnabled");

const deliveryOptions =
  document.getElementById("deliveryOptions");

const deliveryCharge =
  document.getElementById("deliveryCharge");

const deliveryDistance =
  document.getElementById("deliveryDistance");


function updateDeliverySection() {

  if (!deliveryEnabled || !deliveryOptions) {
    return;
  }


  if (deliveryEnabled.checked) {

    deliveryOptions.classList.add("show");

    if (deliveryCharge) {
      deliveryCharge.required = true;
    }

  } else {

    deliveryOptions.classList.remove("show");

    if (deliveryCharge) {

      deliveryCharge.required = false;

      deliveryCharge.value = "";

    }

    if (deliveryDistance) {
      deliveryDistance.value = "";
    }

  }

}


if (deliveryEnabled) {

  deliveryEnabled.addEventListener(
    "change",
    updateDeliverySection
  );

  updateDeliverySection();

}


/* =========================================================
   MOBILE NUMBER
   ========================================================= */

const ownerPhone =
  document.getElementById("ownerPhone");

if (ownerPhone) {

  ownerPhone.addEventListener("input", function () {

    this.value = this.value
      .replace(/\D/g, "")
      .slice(0, 10);

  });

}


/* =========================================================
   REGISTRATION NUMBER
   ========================================================= */

const registrationNumber =
  document.getElementById("registrationNumber");

if (registrationNumber) {

  registrationNumber.addEventListener("input", function () {

    this.value = this.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  });

}


/* =========================================================
   REGISTRATION YEAR
   ========================================================= */

const registrationYear =
  document.getElementById("registrationYear");

if (registrationYear) {

  registrationYear.addEventListener("input", function () {

    if (this.value.length > 4) {

      this.value =
        this.value.slice(0, 4);

    }

  });

}


/* =========================================================
   PRICE INPUTS
   ========================================================= */

const priceInputs = [
  "price3h",
  "price6h",
  "price12h",
  "price24h",
  "deliveryCharge"
];


priceInputs.forEach(function (id) {

  const input =
    document.getElementById(id);

  if (!input) return;


  input.addEventListener("input", function () {

    if (this.value < 0) {
      this.value = 0;
    }

  });

});


/* =========================================================
   VEHICLE PHOTO PREVIEW / FILE NAME
   ========================================================= */

const vehiclePhotos =
  document.getElementById("vehiclePhotos");

if (vehiclePhotos) {

  vehiclePhotos.addEventListener("change", function () {

    const files = this.files;

    if (!files || files.length === 0) {
      return;
    }


    console.log(
      "Vehicle photos selected:",
      files.length
    );

  });

}


/* =========================================================
   DOCUMENT FILE CHECK
   ========================================================= */

const documentInputs = [
  "rcDocument",
  "insuranceDocument",
  "operatorLicenceDocument",
  "idProofDocument"
];


documentInputs.forEach(function (id) {

  const input =
    document.getElementById(id);

  if (!input) return;


  input.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
      return;
    }


    /*
     * Maximum file size:
     * 10 MB
     */

    const maxSize =
      10 * 1024 * 1024;


    if (file.size > maxSize) {

      alert(
        "File size 10 MB se zyada nahi honi chahiye."
      );

      this.value = "";

    }

  });

});


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

const vehicleForm =
  document.getElementById("vehicleForm");

const submitVehicleBtn =
  document.getElementById("submitVehicleBtn");


if (vehicleForm) {

  vehicleForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      /* -----------------------------------------------
         BASIC VALIDATION
         ----------------------------------------------- */

      if (!vehicleForm.checkValidity()) {

        vehicleForm.reportValidity();

        return;

      }


      /* -----------------------------------------------
         PHONE VALIDATION
         ----------------------------------------------- */

      if (ownerPhone) {

        const phone =
          ownerPhone.value.trim();

        if (phone.length !== 10) {

          alert(
            "Please enter a valid 10 digit mobile number."
          );

          ownerPhone.focus();

          return;

        }

      }


      /* -----------------------------------------------
         DELIVERY VALIDATION
         ----------------------------------------------- */

      if (
        deliveryEnabled &&
        deliveryEnabled.checked
      ) {

        if (
          !deliveryCharge ||
          !deliveryCharge.value ||
          Number(deliveryCharge.value) < 0
        ) {

          alert(
            "Pickup & Drop ON hai, please delivery charge enter karo."
          );

          deliveryCharge.focus();

          return;

        }

      }


      /* -----------------------------------------------
         BUTTON LOADING
         ----------------------------------------------- */

      const originalButtonText =
        submitVehicleBtn
          ? submitVehicleBtn.innerHTML
          : "";


      if (submitVehicleBtn) {

        submitVehicleBtn.disabled = true;

        submitVehicleBtn.innerHTML =
          "Submitting...";

      }


      try {


        /* =============================================
           GET FORM VALUES
           ============================================= */

        const formData =
          new FormData(vehicleForm);


        const vehicleData = {

          ownerName:
            formData.get("ownerName"),

          ownerPhone:
            formData.get("ownerPhone"),

          ownerEmail:
            formData.get("ownerEmail"),

          dob:
            formData.get("dob"),

          ownerAddress:
            formData.get("ownerAddress"),

          ownerCity:
            formData.get("ownerCity"),

          ownerState:
            formData.get("ownerState"),


          vehicleType:
            formData.get("vehicleType"),

          brand:
            formData.get("brand"),

          model:
            formData.get("model"),

          registrationNumber:
            formData.get("registrationNumber"),

          registrationYear:
            formData.get("registrationYear"),

          vehicleColor:
            formData.get("vehicleColor"),

          fuelType:
            formData.get("fuelType"),

          vehicleLocation:
            formData.get("vehicleLocation"),


          price3h:
            Number(formData.get("price3h")),

          price6h:
            Number(formData.get("price6h")),

          price12h:
            Number(formData.get("price12h")),

          price24h:
            Number(formData.get("price24h")),


          deliveryEnabled:
            deliveryEnabled
              ? deliveryEnabled.checked
              : false,

          deliveryCharge:
            deliveryEnabled &&
            deliveryEnabled.checked
              ? Number(
                  formData.get("deliveryCharge")
                )
              : 0,

          deliveryDistance:
            deliveryEnabled &&
            deliveryEnabled.checked
              ? Number(
                  formData.get("deliveryDistance") || 0
                )
              : 0,


          operatorLicenceNumber:
            formData.get(
              "operatorLicenceNumber"
            ) || null,


          idProofType:
            formData.get("idProofType"),

          idProofNumber:
            formData.get("idProofNumber")

        };


        /* =============================================
           TEMPORARY DEBUG
           ============================================= */

        console.log(
          "Vehicle listing data:",
          vehicleData
        );


        /*
         * IMPORTANT:
         *
         * Abhi database mein insert nahi kar rahe.
         *
         * Next step mein isi data ko tumhare existing
         * Supabase tables ke exact columns ke according
         * connect karenge.
         *
         * RC, Insurance aur photos ko bhi Supabase Storage
         * mein upload karke URL database mein save karenge.
         */


        await new Promise(function (resolve) {

          setTimeout(resolve, 700);

        });


        /* =============================================
           SUCCESS
           ============================================= */

        alert(
          "Vehicle details ready hain. Next step mein Supabase verification aur listing submission connect karenge."
        );


      } catch (error) {

        console.error(
          "Vehicle listing error:",
          error
        );

        alert(
          "Something went wrong. Please try again."
        );


      } finally {

        if (submitVehicleBtn) {

          submitVehicleBtn.disabled = false;

          submitVehicleBtn.innerHTML =
            originalButtonText;

        }

      }

    }
  );

}


/* =========================================================
   INITIAL PAGE SETUP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateDeliverySection();

  }
);
