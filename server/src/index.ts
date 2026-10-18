import { app } from "./app.js";
import { environment } from "./config/environment.js";

app.listen(environment.port, () => {
  console.log(`Rubix API listening on port ${environment.port}`);
});
