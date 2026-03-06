const express = require('express');
const cors = require('cors');
const vehicleRentalRouter = require('./routes/vehicleRentalRouter');
const { unknownEndpoint, errorHandler, requestLogger } = require('./middleware/customMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/vehicleRentals', vehicleRentalRouter);

// Error handling
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
