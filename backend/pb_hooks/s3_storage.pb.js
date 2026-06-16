/// <reference path="../pb_data/types.d.ts" />

// Configures PocketBase file storage to use an S3-compatible bucket when S3_ENABLED=true.
// This is a global file-storage setting (it covers the place `photos` attachments + thumbs).
// Reading from env keeps credentials out of the committed DB and lets Aspire / docker-compose
// inject them. Wrapped defensively: a misconfiguration is logged but never blocks startup —
// PocketBase simply keeps storing files on the local pb_data volume.
//
// Equivalent manual setup: PocketBase dashboard (/_/) → Settings → Files storage.

onBootstrap((e) => {
  e.next(); // let the app finish bootstrapping before we touch settings

  if ($os.getenv("S3_ENABLED") !== "true") {
    return;
  }

  try {
    const settings = e.app.settings();
    settings.s3.enabled = true;
    settings.s3.bucket = $os.getenv("S3_BUCKET");
    settings.s3.region = $os.getenv("S3_REGION");
    settings.s3.endpoint = $os.getenv("S3_ENDPOINT");
    settings.s3.accessKey = $os.getenv("S3_ACCESS_KEY");
    settings.s3.secret = $os.getenv("S3_SECRET");
    settings.s3.forcePathStyle = $os.getenv("S3_FORCE_PATH_STYLE") === "true";

    e.app.save(settings);
    e.app.logger().info("S3 file storage enabled", "bucket", settings.s3.bucket);
  } catch (err) {
    e.app.logger().error(
      "failed to apply S3 storage settings from env; configure via dashboard instead",
      "error",
      String(err)
    );
  }
});
