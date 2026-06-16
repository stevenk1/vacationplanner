/// <reference path="../pb_data/types.d.ts" />

// Adds photo storage to the places collection:
//   - photos:           cached image files fetched from Google Places (with on-the-fly thumbs)
//   - photoAttribution: Google's authorAttributions, shown in the lightbox (required by Google's terms)
// Photos are populated by the POST /api/places/{id}/photos hook (see pb_hooks/places_photos.pb.js).

migrate(
  (app) => {
    const places = app.findCollectionByNameOrId("places");

    places.fields.add(
      new Field({
        type: "file",
        name: "photos",
        maxSelect: 3,
        maxSize: 5242880, // 5 MB per file
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["400x300", "1200x900"], // popup thumbnail + lightbox size
      })
    );

    places.fields.add(
      new Field({
        type: "json",
        name: "photoAttribution",
        maxSize: 2000000,
      })
    );

    app.save(places);
  },
  (app) => {
    const places = app.findCollectionByNameOrId("places");
    places.fields.removeByName("photos");
    places.fields.removeByName("photoAttribution");
    app.save(places);
  }
);
