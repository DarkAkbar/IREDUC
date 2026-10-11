import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API IREDUC démarrée sur http://0.0.0.0:${env.PORT}`);
});
