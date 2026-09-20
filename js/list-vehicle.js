/* =========================================================
   RentoRide — List Your Vehicle JS  (Supabase-backed)

   REQUIRES (in this order):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="js/supabase.js"></script>
   <script src="js/utils.js"></script>
   <script src="js/list-vehicle.js"></script>

   REPLACES the previous version, which validated the form then
   only console.logged the data with a comment saying Supabase
   would be "connected next" — meaning submitting this form did
   nothing. This version:
     - requires login (redirects to login.html, ?redirect back here)
     - uploads vehicle photos + documents to Supabase Storage
     - inserts a real row into `bikes` with status='pending'
     - promotes the signed-in user to role='owner' if they are
       currently a plain 'customer' (first-time listing)
     - documents (RC/insurance/ID) are uploaded to a PRIVATE bucket,
       not the public vehicle-photos bucket — they must never be
       publicly listable
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
     AUTH — must be logged in to list a vehicle
     ========================================================= */

  const current = await window.RentoRideAuth.requireAuth();
  if (!current) return;

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");

  if (profileName) profileName.textContent = current.profile.name;
  if (profileAvatar) profileAvatar.textContent = (current.profile.name || "U").charAt(0).toUpperCase();

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", event => {
      event.stopPropagation();
      profileMenu.classList.toggle("show");
    });
    document.addEventListener("click", () => profileMenu.classList.remove("show"));
  }

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    window.RentoRideAuth.signOut();
  });


  /* =========================================================
     PRE-FILL OWNER DETAILS FROM PROFILE
     ========================================================= */

  const ownerNameInput = document.getElementById("ownerName");
  const ownerPhoneInput = document.getElementById("ownerPhone");
  const ownerEmailInput = document.getElementById("ownerEmail");

  if (ownerNameInput && !ownerNameInput.value) ownerNameInput.value = current.profile.name || "";
  if (ownerPhoneInput && !ownerPhoneInput.value) ownerPhoneInput.value = current.profile.phone || "";
  if (ownerEmailInput && !ownerEmailInput.value) ownerEmailInput.value = current.profile.email || "";


  /* =========================================================
     PICKUP & DROP TOGGLE
     ========================================================= */

  const deliveryEnabled = document.getElementById("deliveryEnabled");
  const deliveryOptions = document.getElementById("deliveryOptions");
  const deliveryCharge = document.getElementById("deliveryCharge");
  const deliveryDistance = document.getElementById("deliveryDistance");

  function updateDeliverySection() {
    if (!deliveryEnabled || !deliveryOptions) return;

    if (deliveryEnabled.checked) {
      deliveryOptions.classList.add("show");
      if (deliveryCharge) deliveryCharge.required = true;
    } else {
      deliveryOptions.classList.remove("show");
      if (deliveryCharge) { deliveryCharge.required = false; deliveryCharge.value = ""; }
      if (deliveryDistance) deliveryDistance.value = "";
    }
  }

  deliveryEnabled?.addEventListener("change", updateDeliverySection);
  updateDeliverySection();


  /* =========================================================
     INPUT FORMATTING (unchanged from working version)
     ========================================================= */

  document.getElementById("ownerPhone")?.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });

  document.getElementById("registrationNumber")?.addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  document.getElementById("registrationYear")?.addEventListener("input", function () {
    if (this.value.length > 4) this.value = this.value.slice(0, 4);
  });

  ["price3h", "price6h", "price12h", "price24h", "deliveryCharge"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", function () {
      if (this.value < 0) this.value = 0;
    });
  });


  /* =========================================================
     FILE SIZE GUARD (unchanged — 10 MB cap)
     ========================================================= */

  ["rcDocument", "insuranceDocument", "operatorLicenceDocument", "idProofDocument", "vehiclePhotos"]
    .forEach(id => {
      document.getElementById(id)?.addEventListener("change", function () {
        const files = [...(this.files || [])];
        const tooBig = files.find(f => f.size > 10 * 1024 * 1024);
        if (tooBig) {
          alert(`"${tooBig.name}" is over 10 MB. Please choose a smaller file.`);
          this.value = "";
        }
      });
    });


  /* =========================================================
     UPLOAD HELPERS
     ========================================================= */

  async function uploadFile(bucket, file, pathPrefix) {

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${pathPrefix}/${Date.now()}_${safeName}`;

    const { error } = await window.supabaseClient
      .storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    if (bucket === "vehicle-photos") {
      const { data } = window.supabaseClient.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }

    // documents bucket is private — store the path, not a public URL
    return path;
  }


  /* =========================================================
     FORM SUBMISSION
     ========================================================= */

  const vehicleForm = document.getElementById("vehicleForm");
  const submitVehicleBtn = document.getElementById("submitVehicleBtn");

  vehicleForm?.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!vehicleForm.checkValidity()) {
      vehicleForm.reportValidity();
      return;
    }

    const ownerPhone = document.getElementById("ownerPhone");
    if (ownerPhone && ownerPhone.value.trim().length !== 10) {
      alert("Please enter a valid 10 digit mobile number.");
      ownerPhone.focus();
      return;
    }

    if (deliveryEnabled?.checked) {
      if (!deliveryCharge?.value || Number(deliveryCharge.value) < 0) {
        alert("Pickup & Drop is on — please enter a delivery charge.");
        deliveryCharge?.focus();
        return;
      }
    }

    const originalButtonText = submitVehicleBtn ? submitVehicleBtn.innerHTML : "";
    if (submitVehicleBtn) { submitVehicleBtn.disabled = true; submitVehicleBtn.innerHTML = "Submitting..."; }

    try {

      const formData = new FormData(vehicleForm);

      // 1) persist owner-level details onto the profile if changed
      await window.supabaseClient
        .from("profiles")
        .update({
          name: formData.get("ownerName"),
          phone: formData.get("ownerPhone"),
          city: formData.get("ownerCity"),
          role: current.profile.role === "customer" ? "owner" : current.profile.role
        })
        .eq("id", current.authUser.id);

      // 2) upload vehicle photos (public bucket)
      const photoFiles = [...(document.getElementById("vehiclePhotos")?.files || [])];
      const photoUrls = [];

      if (submitVehicleBtn) submitVehicleBtn.innerHTML = "Uploading photos...";

      for (const file of photoFiles) {
        photoUrls.push(await uploadFile("vehicle-photos", file, current.authUser.id));
      }

      // 3) upload verification documents (private bucket) — paths only,
      // never exposed to other users; admin review reads them via a
      // signed URL generated server-side, not directly from the client
      if (submitVehicleBtn) submitVehicleBtn.innerHTML = "Uploading documents...";

      const rcFile = document.getElementById("rcDocument")?.files[0];
      const insuranceFile = document.getElementById("insuranceDocument")?.files[0];
      const licenceFile = document.getElementById("operatorLicenceDocument")?.files[0];
      const idFile = document.getElementById("idProofDocument")?.files[0];

      const docPaths = {};
      if (rcFile) docPaths.rc = await uploadFile("owner-documents", rcFile, current.authUser.id);
      if (insuranceFile) docPaths.insurance = await uploadFile("owner-documents", insuranceFile, current.authUser.id);
      if (licenceFile) docPaths.licence = await uploadFile("owner-documents", licenceFile, current.authUser.id);
      if (idFile) docPaths.idProof = await uploadFile("owner-documents", idFile, current.authUser.id);

      // 4) insert the bike listing — status starts 'pending' until
      // admin approval, matching the admin panel's verification flow
      if (submitVehicleBtn) submitVehicleBtn.innerHTML = "Saving listing...";

      const { error: insertError } = await window.supabaseClient
        .from("bikes")
        .insert({
          owner_id: current.authUser.id,

          name: `${formData.get("brand")} ${formData.get("model")}`,
          brand: formData.get("brand"),
          model: formData.get("model"),
          vehicle_type: formData.get("vehicleType"),
          registration_number: formData.get("registrationNumber"),
          registration_year: Number(formData.get("registrationYear")) || null,
          color: formData.get("vehicleColor"),
          fuel_type: formData.get("fuelType"),

          location: formData.get("vehicleLocation"),

          price_3h: Number(formData.get("price3h")),
          price_6h: Number(formData.get("price6h")),
          price_12h: Number(formData.get("price12h")),
          price_24h: Number(formData.get("price24h")),

          delivery_enabled: !!deliveryEnabled?.checked,
          delivery_charge: deliveryEnabled?.checked ? Number(formData.get("deliveryCharge")) : 0,
          delivery_distance_km: deliveryEnabled?.checked ? Number(formData.get("deliveryDistance") || 0) : 0,

          image_url: photoUrls[0] || null,
          gallery_urls: photoUrls.slice(1),

          status: "pending"
        });

      if (insertError) throw insertError;

      alert(
        "Your vehicle has been submitted for verification! " +
        "You'll be able to see its status on your Owner Dashboard, " +
        "and it goes live once our team approves it."
      );

      window.location.href = "owner-dashboard.html";

    } catch (error) {

      console.error("Vehicle listing error:", error);
      alert("Something went wrong submitting your listing: " + (error.message || "please try again."));

    } finally {

      if (submitVehicleBtn) {
        submitVehicleBtn.disabled = false;
        submitVehicleBtn.innerHTML = originalButtonText;
      }
    }
  });

});
