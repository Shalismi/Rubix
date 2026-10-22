import { app } from "./app.js";
import { environment } from "./config/environment.js";
import { purgeExpiredTasks } from "./features/tasks/trashService.js";

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function runTrashCleanup() {
  void purgeExpiredTasks().catch((error: unknown) => {
    console.error("Could not purge expired tasks.", error);
  });
}

app.listen(environment.port, () => {
  console.log(`Rubix API listening on port ${environment.port}`);
  runTrashCleanup();
});

const cleanupInterval = setInterval(runTrashCleanup, CLEANUP_INTERVAL_MS);
cleanupInterval.unref();
