import cron from "node-cron";
import { cleanupOldPDFs } from "./cleanUpPDFs";

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled PDF cleanup...");
  try {
    await cleanupOldPDFs(7); // keeps last 3 days
  } catch (err) {
    console.error("Scheduled PDF cleanup failed:", err);
  }
});
