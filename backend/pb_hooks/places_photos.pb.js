/// <reference path="../pb_data/types.d.ts" />

// POST /api/places/{id}/photos
//
// Server-side photo fetch for a place. Uses the Google Places API (New) — the API key lives
// only here (GOOGLE_PLACES_API_KEY env), never in the browser. It resolves the place by name +
// address (+ location bias), downloads the top photos, and caches them as file attachments on
// the record so the frontend serves them from PocketBase (zero recurring Google cost).
//
// The frontend fires this in the background after a place is created or moved (see
// frontend/src/hooks/data.ts -> useFetchPlacePhotos). The body is ignored by the caller.

routerAdd("POST", "/api/places/{id}/photos", (e) => {
  const id = e.request.pathValue("id");

  const apiKey = $os.getenv("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    return e.json(200, { count: 0, skipped: "no_api_key" });
  }

  let record;
  try {
    record = e.app.findRecordById("places", id);
  } catch (_) {
    return e.json(404, { error: "place not found" });
  }

  const name = record.getString("name");
  const address = record.getString("address");
  const lat = record.getFloat("lat");
  const lng = record.getFloat("lng");
  const textQuery = [name, address].filter(Boolean).join(", ");
  if (!textQuery) {
    return e.json(200, { count: 0, skipped: "no_query" });
  }

  const MAX_PHOTOS = 3;

  try {
    // 1) Resolve the place + its photo references via Text Search.
    const searchBody = { textQuery: textQuery, maxResultCount: 1 };
    if (lat || lng) {
      searchBody.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 } };
    }

    const searchRes = $http.send({
      url: "https://places.googleapis.com/v1/places:searchText",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos,places.regularOpeningHours",
      },
      body: JSON.stringify(searchBody),
      timeout: 20,
    });

    if (searchRes.statusCode !== 200) {
      return e.json(200, { count: 0, error: "search_failed", status: searchRes.statusCode });
    }

    const place = (searchRes.json && searchRes.json.places && searchRes.json.places[0]) || null;
    const photos = (place && place.photos) || [];
    if (photos.length === 0) {
      return e.json(200, { count: 0, matched: !!place });
    }

    // 2) Download the top photos and collect attributions (required by Google's terms).
    const files = [];
    const attributions = [];
    for (const photo of photos.slice(0, MAX_PHOTOS)) {
      const mediaUrl =
        "https://places.googleapis.com/v1/" + photo.name + "/media?maxWidthPx=1200&key=" + apiKey;
      try {
        files.push($filesystem.fileFromURL(mediaUrl));
        for (const a of photo.authorAttributions || []) {
          attributions.push({ displayName: a.displayName || "", uri: a.uri || "" });
        }
      } catch (err) {
        // skip a single failed photo, keep the rest
        e.app.logger().warn("place photo download failed", "place", id, "error", String(err));
      }
    }

    if (files.length === 0) {
      return e.json(200, { count: 0, error: "download_failed" });
    }

    // 3) Cache on the record (replaces any previous photos + refreshes hours).
    record.set("photos", files);
    record.set("photoAttribution", attributions);
    const hours = (place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions) || null;
    if (hours) record.set("openingHours", hours);
    e.app.save(record);

    return e.json(200, { count: files.length });
  } catch (err) {
    e.app.logger().error("place photo fetch failed", "place", id, "error", String(err));
    return e.json(200, { count: 0, error: "exception" });
  }
});
