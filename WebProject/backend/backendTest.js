
const express = require("express");
const app = express();
const userRouter = require("./4-routes/userRouter");
const { unknownEndpoint, requestLogger, errorHandler } = require("./5-middleware/customMiddleware");
const connectDB = require("./1-config/db");
const cors = require("cors");

// Middleware
app.use(cors());
app.use(express.json());

connectDB();

// Use userRouter for all 'user' routes
app.use("/api/user", userRouter);

// Custom middleware for unknown endpoints
app.use(unknownEndpoint);
app.use(errorHandler);

app.listen(5000, () => {
  console.log("Server is running on port 5000 at " + new Date().toLocaleTimeString());
});