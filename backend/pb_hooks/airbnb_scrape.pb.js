/// <reference path="../pb_data/types.d.ts" />

// Airbnb stay import — server-side, two routes (the Apify token lives only here, never in the browser):
//
//   POST /api/airbnb/scrape            body { url, checkIn?, checkOut?, adults? }
//     Runs the Apify "tri_angle/airbnb-rooms-urls-scraper" actor ONCE for the given listing URL and
//     returns normalized listing data + photo URLs. No record needed, so the stay editor can preview
//     and auto-fill before the sub-period is saved. This is the call that costs Apify credits.
//
//   POST /api/subperiods/{id}/stay-photos   body { photoUrls: [] }
//     Downloads the already-known photo URLs (no Apify call) and caches them as file attachments on the
//     sub-period's stayPhotos field. Fired in the background after save — mirrors the place-photo flow
//     (see pb_hooks/places_photos.pb.js, frontend useFetchStayPhotos).
//
// The actor's output field names are not publicly documented, so the parser tries common variants per
// field and degrades gracefully (blank/0/null) when a field is absent.

routerAdd("POST", "/api/airbnb/scrape", (e) => {
  // NB: PocketBase runs each route handler in an isolated JS runtime, so helpers must be defined
  // inside the handler (module-scope functions are not visible here).
  const num = (v) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return typeof n === "number" && isFinite(n) ? n : undefined;
  };
  const firstStr = (...vals) => {
    for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
    return "";
  };
  const firstNum = (...vals) => {
    for (const v of vals) {
      const n = num(v);
      if (n !== undefined) return n;
    }
    return undefined;
  };

  const token = $os.getenv("APIFY_TOKEN");
  if (!token) {
    return e.json(200, { ok: false, error: "no_api_key" });
  }

  let body = {};
  try {
    body = e.requestInfo().body || {};
  } catch (_) {}

  const url = (body.url || "").toString().trim();
  if (!url || !/airbnb\./i.test(url)) {
    return e.json(200, { ok: false, error: "bad_url" });
  }

  const input = {
    startUrls: [{ url: url }],
    locale: "en-US",
    currency: "EUR",
    adults: num(body.adults) || 2,
  };
  if (body.checkIn) input.checkIn = body.checkIn.toString();
  if (body.checkOut) input.checkOut = body.checkOut.toString();

  try {
    const res = $http.send({
      url:
        "https://api.apify.com/v2/acts/tri_angle~airbnb-rooms-urls-scraper/run-sync-get-dataset-items?token=" +
        token,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      timeout: 150, // the actor run takes ~40s
    });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
      return e.json(200, { ok: false, error: "apify_failed", status: res.statusCode });
    }

    const items = res.json;
    if (!items || !items.length) {
      return e.json(200, { ok: false, error: "empty_dataset" });
    }
    const it = items[0];

    // --- defensive normalize (actor field names are not publicly documented) ---
    const coords = it.coordinates || {};
    const loc = it.location && typeof it.location === "object" ? it.location : {};
    const lat = firstNum(it.lat, it.latitude, coords.latitude, coords.lat, loc.lat, loc.latitude);
    const lng = firstNum(it.lng, it.longitude, coords.longitude, coords.lng, loc.lng, loc.longitude);

    const address = firstStr(
      it.address,
      it.locationSubtitle,
      typeof it.location === "string" ? it.location : "",
      loc.address,
      it.subtitle
    );
    const countryCode = firstStr(it.countryCode, it.country_code, loc.countryCode);

    // images: array of strings, or array of objects with a url-ish field
    const rawImages = it.images || it.photos || it.pictures || [];
    const photoUrls = [];
    for (let i = 0; i < rawImages.length && photoUrls.length < 5; i++) {
      const img = rawImages[i];
      let u = "";
      if (typeof img === "string") u = img;
      else if (img) u = firstStr(img.url, img.imageUrl, img.src, img.picture, img.large, img.baseUrl);
      if (u) photoUrls.push(u);
    }

    const ratingObj = it.rating && typeof it.rating === "object" ? it.rating : {};
    const rating = firstNum(
      typeof it.rating === "number" ? it.rating : undefined,
      ratingObj.guestSatisfaction,
      ratingObj.value,
      ratingObj.accuracy,
      it.stars
    );
    const reviewsCount = firstNum(
      ratingObj.reviewsCount,
      ratingObj.reviewCount,
      it.reviewsCount,
      it.numberOfReviews
    );

    const pricing = it.pricing && typeof it.pricing === "object" ? it.pricing : {};
    const priceObj = it.price && typeof it.price === "object" ? it.price : {};
    const price = firstNum(
      typeof it.price === "number" ? it.price : undefined,
      pricing.rate,
      pricing.amount,
      pricing.price,
      priceObj.amount,
      priceObj.rate
    );

    return e.json(200, {
      ok: true,
      stayName: firstStr(it.title, it.name, it.listingName),
      stayAddress: address,
      stayLat: lat !== undefined ? lat : 0,
      stayLng: lng !== undefined ? lng : 0,
      stayCountryCode: countryCode,
      photoUrls: photoUrls,
      price: price !== undefined ? price : null,
      currency: "EUR",
      rating: rating !== undefined ? rating : null,
      reviewsCount: reviewsCount !== undefined ? reviewsCount : null,
      sourceUrl: url,
    });
  } catch (err) {
    e.app.logger().error("airbnb scrape failed", "url", url, "error", String(err));
    return e.json(200, { ok: false, error: "exception" });
  }
});

routerAdd("POST", "/api/subperiods/{id}/stay-photos", (e) => {
  const id = e.request.pathValue("id");

  let record;
  try {
    record = e.app.findRecordById("subperiods", id);
  } catch (_) {
    return e.json(404, { error: "subperiod not found" });
  }

  let body = {};
  try {
    body = e.requestInfo().body || {};
  } catch (_) {}

  const urls = body.photoUrls || [];
  if (!urls.length) {
    return e.json(200, { count: 0, skipped: "no_urls" });
  }

  const MAX_PHOTOS = 5;
  const files = [];
  for (let i = 0; i < urls.length && files.length < MAX_PHOTOS; i++) {
    const u = (urls[i] || "").toString();
    if (!u) continue;
    try {
      files.push($filesystem.fileFromURL(u));
    } catch (err) {
      // skip a single failed photo, keep the rest
      e.app.logger().warn("stay photo download failed", "subperiod", id, "error", String(err));
    }
  }

  if (files.length === 0) {
    return e.json(200, { count: 0, error: "download_failed" });
  }

  // Cache on the record (replaces any previous stay photos).
  record.set("stayPhotos", files);
  e.app.save(record);

  return e.json(200, { count: files.length });
});
