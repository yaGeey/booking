import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { onConnection } from "./ws/index";
import { authMiddleware, userActivityMiddleware } from "./ws/middlewares";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import helmet from "helmet";
import "dotenv/config";

import userRoutes from "./routes/user";
import roomRoutes from "./routes/rooms";
import authRoutes from "./routes/auth/auth";
import oauthRoutes from "./routes/auth/oauth";
import resetPasswordRoutes from "./routes/auth/reset-password";
import { errorMiddleware } from "./lib/errors";
import "./jobs/lastSeen.worker";

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
   cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
   },
});

// middlewares
app.use(
   cors({
      origin: "http://localhost:3000", // Домен вашого клієнта
      credentials: true, // Дозволяє передачу cookie
   }),
);
app.use(cookieParser());
app.use(express.json());
// app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(helmet());

app.use(
   morgan("dev", {
      skip: (req, res) => res.statusCode < 400,
      stream: fs.createWriteStream(path.join(__dirname, "logs/error.log"), { flags: "a" }),
   }),
);
app.use(
   morgan("common", {
      stream: fs.createWriteStream(path.join(__dirname, "logs/access.log"), { flags: "a" }),
   }),
);

// routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/auth/reset-password", resetPasswordRoutes);
app.use(errorMiddleware);

// websocket
io.use(authMiddleware);
io.use(userActivityMiddleware);
io.on("connection", onConnection);

app.get("/", (req, res) => {
   res.send("Hello World!");
});

httpServer.listen(8080, () => {
   console.log("Server is running");
});
