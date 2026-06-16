/// <reference path="../pb_data/types.d.ts" />

// Adds Airbnb stay import storage to the subperiods collection:
//   - stayPhotos:   cached listing image files fetched from Airbnb (with on-the-fly thumbs)
//   - stayAirbnbUrl: the source Airbnb listing URL (shown as a "View on Airbnb" link)
//   - stayListing:  scraped listing metadata { price, currency, rating, reviewsCount, checkIn, checkOut }
// Photos are populated by the POST /api/subperiods/{id}/stay-photos hook (see pb_hooks/airbnb_scrape.pb.js);
// the rest is filled by the stay editor after a POST /api/airbnb/scrape. A stay stays embedded on the
// subperiod — these are just extra fields, not a new collection.

migrate(
  (app) => {
    const subperiods = app.findCollectionByNameOrId("subperiods");

    subperiods.fields.add(
      new Field({
        type: "file",
        name: "stayPhotos",
        maxSelect: 5,
        maxSize: 5242880, // 5 MB per file
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["400x300", "1200x900"], // card/popup thumbnail + lightbox size
      })
    );

    subperiods.fields.add(
      new Field({
        type: "url",
        name: "stayAirbnbUrl",
      })
    );

    subperiods.fields.add(
      new Field({
        type: "json",
        name: "stayListing",
        maxSize: 50000,
      })
    );

    app.save(subperiods);
  },
  (app) => {
    const subperiods = app.findCollectionByNameOrId("subperiods");
    subperiods.fields.removeByName("stayPhotos");
    subperiods.fields.removeByName("stayAirbnbUrl");
    subperiods.fields.removeByName("stayListing");
    app.save(subperiods);
  }
);
