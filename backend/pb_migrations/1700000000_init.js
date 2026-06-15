/// <reference path="../pb_data/types.d.ts" />

// Initial schema for the Holiday Idea Planner.
// Three collections: holidays -> subperiods -> places (cascade delete down the chain).
// API rules are public ("") because this is a personal, no-login app. See README "Security".

migrate(
  (app) => {
    // ── holidays ──────────────────────────────────────────────────────────
    const holidays = new Collection({
      id: "holiday00000001",
      type: "base",
      name: "holidays",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { type: "text", name: "title", required: true, max: 200 },
        { type: "date", name: "startDate" },
        { type: "date", name: "endDate" },
        { type: "text", name: "locationName", max: 200 },
        { type: "text", name: "countryCode", max: 8 },
        { type: "text", name: "accentOverride", max: 16 },
        { type: "text", name: "emoji", max: 16 },
        { type: "text", name: "notes", max: 5000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
    });
    app.save(holidays);

    // ── subperiods ────────────────────────────────────────────────────────
    const subperiods = new Collection({
      id: "subperiod000001",
      type: "base",
      name: "subperiods",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          type: "relation",
          name: "holiday",
          required: true,
          collectionId: "holiday00000001",
          cascadeDelete: true,
          minSelect: 0,
          maxSelect: 1,
        },
        { type: "text", name: "name", required: true, max: 200 },
        { type: "date", name: "startDate" },
        { type: "date", name: "endDate" },
        { type: "text", name: "color", max: 16 },
        { type: "text", name: "stayName", max: 200 },
        { type: "text", name: "stayAddress", max: 300 },
        { type: "number", name: "stayLat" },
        { type: "number", name: "stayLng" },
        { type: "text", name: "stayCountryCode", max: 8 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
    });
    app.save(subperiods);

    // ── places ────────────────────────────────────────────────────────────
    const places = new Collection({
      id: "place0000000001",
      type: "base",
      name: "places",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        {
          type: "relation",
          name: "subperiod",
          required: true,
          collectionId: "subperiod000001",
          cascadeDelete: true,
          minSelect: 0,
          maxSelect: 1,
        },
        { type: "text", name: "name", required: true, max: 200 },
        { type: "text", name: "address", max: 300 },
        { type: "number", name: "lat" },
        { type: "number", name: "lng" },
        {
          type: "select",
          name: "category",
          maxSelect: 1,
          values: ["sightseeing", "food", "nature", "culture", "activity", "landmark", "beach", "other"],
        },
        { type: "text", name: "notes", max: 2000 },
        { type: "number", name: "driveSeconds" },
        { type: "number", name: "driveMeters" },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
    });
    app.save(places);
  },
  (app) => {
    // down — delete in reverse dependency order
    for (const name of ["places", "subperiods", "holidays"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // already gone
      }
    }
  }
);
