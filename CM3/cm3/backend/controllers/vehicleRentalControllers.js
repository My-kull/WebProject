const VehicleRental = require("../models/vehicleRentalModel");
const mongoose = require("mongoose");

// GET /api/vehicleRentals
const getAllVehicleRentals = async (req, res) => {
  const vehicleRentals = await VehicleRental.find({});
  res.json(vehicleRentals);
};

// POST /api/vehicleRentals
const createVehicleRental = async (req, res) => {
  const vehicleRental = new VehicleRental(req.body);
  const savedVehicleRental = await vehicleRental.save();
  res.status(201).json(savedVehicleRental);
};

// GET /api/vehicleRentals/:vehicleRentalId
const getVehicleRentalById = async (req, res) => {
  const vehicleRental = await VehicleRental.findById(
    req.params.vehicleRentalId,
  );
  if (!vehicleRental) {
    return res.status(404).json({ error: "Vehicle rental not found" });
  }
  res.json(vehicleRental);
};

// PUT /api/vehicleRentals/:vehicleRentalId
const updateVehicleRental = async (req, res) => {
  const vehicleRental = await VehicleRental.findByIdAndUpdate(
    req.params.vehicleRentalId,
    req.body,
    { new: true, runValidators: true },
  );
  if (!vehicleRental) {
    return res.status(404).json({ error: "Vehicle rental not found" });
  }
  res.json(vehicleRental);
};

// DELETE /api/vehicleRentals/:vehicleRentalId
const deleteVehicleRental = async (req, res) => {
  const vehicleRental = await VehicleRental.findByIdAndDelete(
    req.params.vehicleRentalId,
  );
  if (!vehicleRental) {
    return res.status(404).json({ error: "Vehicle rental not found" });
  }
  res.status(204).end();
};

module.exports = {
  getAllVehicleRentals,
  createVehicleRental,
  getVehicleRentalById,
  updateVehicleRental,
  deleteVehicleRental,
};
