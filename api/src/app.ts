import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimit";
import { adminRouter } from "./modules/admin/admin.routes";
import { alertsRouter } from "./modules/alerts/alerts.routes";
import { authRouter } from "./modules/auth/auth.routes";
import {
  categoriesRouter,
  communesRouter,
} from "./modules/catalog/catalog.routes";
import { conversationsRouter } from "./modules/conversations/conversations.routes";
import { favoritesRouter } from "./modules/favorites/favorites.routes";
import { homeRouter } from "./modules/home/home.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { propertiesRouter } from "./modules/properties/properties.routes";
import { providersRouter } from "./modules/providers/providers.routes";
import { requestsRouter } from "./modules/requests/requests.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";
import { servicesRouter } from "./modules/services/services.routes";
import { usersRouter } from "./modules/users/users.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(apiRateLimiter);
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req, res) => {
    res.status(200).json(swaggerSpec);
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/providers", providersRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/communes", communesRouter);
  app.use("/api/v1/properties", propertiesRouter);
  app.use("/api/v1/services", servicesRouter);
  app.use("/api/v1/home", homeRouter);
  app.use("/api/v1/requests", requestsRouter);
  app.use("/api/v1/conversations", conversationsRouter);
  app.use("/api/v1/favorites", favoritesRouter);
  app.use("/api/v1/alerts", alertsRouter);
  app.use("/api/v1/reviews", reviewsRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(errorHandler);

  return app;
}
