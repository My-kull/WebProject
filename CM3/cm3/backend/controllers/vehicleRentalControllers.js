const VehicleRental = require('../models/vehicleRentalModel');
const mongoose = require('mongoose');

// GET /api/vehicleRentals
const getAllVehicleRentals = async (req, res) => {
  res.send("getAllVehicleRentals");
};

// POST /api/vehicleRentals
const createVehicleRental = async (req, res) => {
  res.send("createVehicleRental");
};

// GET /api/vehicleRentals/:vehicleRentalId
const getVehicleRentalById = async (req, res) => {
  res.send("getVehicleRentalById");
};

// PUT /api/vehicleRentals/:vehicleRentalId
const updateVehicleRental = async (req, res) => {
  res.send("updateVehicleRental");
};

// DELETE /api/vehicleRentals/:vehicleRentalId
const deleteVehicleRental = async (req, res) => {
  res.send("deleteVehicleRental");
};

module.exports = {
  getAllVehicleRentals,
  createVehicleRental,
  getVehicleRentalById,
  updateVehicleRental,
  deleteVehicleRental,
};
