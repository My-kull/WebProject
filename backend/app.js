const express = require("express");
const cors = require("cors");
const userRouter = require("./4-routes/userRouter");
const authRouter = require("./4-routes/authRouter");
const {
  unknownEndpoint,
  requestLogger,
  errorHandler,
} = require("./5-middleware/customMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Error handling
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
