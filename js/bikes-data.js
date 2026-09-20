/* =========================================================
   RentoRide — Shared Pricing Helper

   IMPORTANT CHANGE: this file used to also contain a hardcoded
   RENTORIDE_BIKES catalog. That catalog is now GONE — it was one
   of three disagreeing data sources (hardcoded HTML in bikes.html,
   this object, and the real Supabase `bikes` table). Supabase is
   now the single source of truth; bikes.js, bike-details.js and
   booking.js all fetch from it directly.

   This file keeps only the tier-based price calculation, since
   that's pure logic with no data dependency and is shared by the
   booking summary display and the actual amount calculation.
   ========================================================= */

function rentoRideCalculatePrice(bike, hours) {

  if (!bike || hours <= 0) return null;

  if (hours <= 3) return Number(bike.price_3h);
  if (hours <= 6) return Number(bike.price_6h);
  if (hours <= 12) return Number(bike.price_12h);
  if (hours <= 24) return Number(bike.price_24h);

  // Beyond 24h: charge per extra 24h block at the 24h rate
  const fullDays = Math.ceil(hours / 24);
  return Number(bike.price_24h) * fullDays;
}

function rentoRideGetRateLabel(hours) {

  if (hours <= 3) return "3 Hour rate";
  if (hours <= 6) return "6 Hour rate";
  if (hours <= 12) return "12 Hour rate";
  if (hours <= 24) return "24 Hour rate";

  return "24 Hour rate × " + Math.ceil(hours / 24) + " days";
}

// Central fallback image so a bike with no photo yet doesn't show
// a broken <img> anywhere in the app.
const RENTORIDE_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80";
