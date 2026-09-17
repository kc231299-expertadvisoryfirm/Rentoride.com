/* =========================================================
   RentoRide — Shared Bike Data
   Single source of truth for bike specs/pricing used by
   bike-details.js and booking.js. Keyed by the same ?id=
   slug used in bikes.html's "VIEW DETAILS" links.

   Include this BEFORE bike-details.js / booking.js:
   <script src="js/bikes-data.js"></script>
   <script src="js/bike-details.js"></script>
   ========================================================= */

window.RENTORIDE_BIKES = {

  "classic-350": {
    name: "Royal Enfield Classic 350",
    subtitle: "Royal Enfield · Classic 350",
    brand: "Royal Enfield",
    model: "Classic 350",
    location: "Kota, Rajasthan",
    rating: "4.8",
    engine: "350 cc",

    price3: 299,
    price6: 399,
    price12: 599,
    price24: 799,

    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85",

    description:
      "A clean and well-maintained Royal Enfield Classic 350 available for comfortable city rides, weekend trips and daily travel. Vehicle condition is checked before every booking."
  },


  "ktm-duke-250": {
    name: "KTM Duke 250",
    subtitle: "KTM · Duke 250",
    brand: "KTM",
    model: "Duke 250",
    location: "Kota, Rajasthan",
    rating: "4.7",
    engine: "250 cc",

    price3: 299,
    price6: 549,
    price12: 799,
    price24: 899,

    image:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=85",

    description:
      "A premium street bike for customers looking for a fun and comfortable riding experience."
  },


  "pulsar-ns200": {
    name: "Bajaj Pulsar NS200",
    subtitle: "Bajaj · Pulsar NS200",
    brand: "Bajaj",
    model: "Pulsar NS200",
    location: "Kota, Rajasthan",
    rating: "4.6",
    engine: "200 cc",

    price3: 249,
    price6: 349,
    price12: 499,
    price24: 699,

    image:
      "https://images.unsplash.com/photo-1558980664-10ea56b2f1f7?auto=format&fit=crop&w=1200&q=85",

    description:
      "A sporty and responsive bike suitable for city commuting and longer rides. The vehicle is inspected before handover."
  },


  "yamaha-r15": {
    name: "Yamaha R15 V4",
    subtitle: "Yamaha · R15 V4",
    brand: "Yamaha",
    model: "R15 V4",
    location: "Kota, Rajasthan",
    rating: "4.8",
    engine: "155 cc",

    price3: 399,
    price6: 549,
    price12: 799,
    price24: 999,

    image:
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=85",

    description:
      "A sharp, sporty ride built for riders who want performance and comfort together. Inspected and ready before every rental."
  },


  "activa-6g": {
    name: "Honda Activa 6G",
    subtitle: "Honda · Activa 6G",
    brand: "Honda",
    model: "Activa 6G",
    location: "Kota, Rajasthan",
    rating: "4.7",
    engine: "110 cc",

    price3: 199,
    price6: 249,
    price12: 349,
    price24: 449,

    image:
      "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1200&q=85",

    description:
      "A reliable, easy-to-ride scooter ideal for daily commutes and quick city trips. Well-maintained and checked before handover."
  },


  "splendor-plus": {
    name: "Hero Splendor Plus",
    subtitle: "Hero · Splendor Plus",
    brand: "Hero",
    model: "Splendor Plus",
    location: "Kota, Rajasthan",
    rating: "4.5",
    engine: "100 cc",

    price3: 199,
    price6: 249,
    price12: 349,
    price24: 449,

    image:
      "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=1200&q=85",

    description:
      "A fuel-efficient, dependable commuter bike, perfect for everyday city riding. Vehicle condition is checked before every booking."
  },


  "meteor-350": {
    name: "Royal Enfield Meteor 350",
    subtitle: "Royal Enfield · Meteor 350",
    brand: "Royal Enfield",
    model: "Meteor 350",
    location: "Kota, Rajasthan",
    rating: "4.9",
    engine: "350 cc",

    price3: 399,
    price6: 549,
    price12: 799,
    price24: 999,

    image:
      "https://images.unsplash.com/photo-1558980394-0c6c8f6d7d5b?auto=format&fit=crop&w=1200&q=85",

    description:
      "A relaxed, cruiser-style ride built for comfortable long trips as well as everyday use. Vehicle condition is checked before every booking."
  },


  "ntorq-125": {
    name: "TVS Ntorq 125",
    subtitle: "TVS · Ntorq 125",
    brand: "TVS",
    model: "Ntorq 125",
    location: "Kota, Rajasthan",
    rating: "4.6",
    engine: "125 cc",

    price3: 199,
    price6: 249,
    price12: 349,
    price24: 449,

    image:
      "https://images.unsplash.com/photo-1558980664-10ea56b2f1f7?auto=format&fit=crop&w=1200&q=85",

    description:
      "A peppy, feature-packed scooter suited for quick city rides and daily errands. Inspected and ready before every rental."
  }

};


/* =========================================================
   HELPER — hour-tier price lookup, shared by bike-details.js
   (display only) and booking.js (actual calculation)
   ========================================================= */

function rentoRideCalculatePrice(bike, hours) {

  if (!bike || hours <= 0) return null;

  if (hours <= 3) return bike.price3;
  if (hours <= 6) return bike.price6;
  if (hours <= 12) return bike.price12;
  if (hours <= 24) return bike.price24;

  // Beyond 24h: charge per extra 24h block at the 24h rate
  const fullDays = Math.ceil(hours / 24);
  return bike.price24 * fullDays;
}
