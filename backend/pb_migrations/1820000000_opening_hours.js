/// <reference path="../pb_data/types.d.ts" />

// Adds openingHours (JSON) to the places collection.
// Populated by the POST /api/places/{id}/photos hook alongside photo caching —
// it reads regularOpeningHours.weekdayDescriptions from the Google Places API response
// and stores it as a string[] (7 entries, Monday-first).

migrate(
  (app) => {
    const places = app.findCollectionByNameOrId("places");
    places.fields.add(new Field({ type: "json", name: "openingHours", maxSize: 5000 }));
    app.save(places);
  },
  (app) => {
    const places = app.findCollectionByNameOrId("places");
    places.fields.removeByName("openingHours");
    app.save(places);
  }
);
