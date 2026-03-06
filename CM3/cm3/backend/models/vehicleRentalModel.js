const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const vehicleRentalSchema = new Schema(
  {
    vehicleModel: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    agency: {
      name: {
        type: String,
        required: true,
      },
      contactEmail: {
        type: String,
        required: true,
      },
      fleetSize: {
        type: Number,
      },
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },
    dailyPrice: {
      type: Number,
      required: true,
    },
    listingDate: {
      type: Date,
      default: Date.now,
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available',
    },
    bookingDeadline: {
      type: Date,
    },
    insurancePolicy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// add virtual field id
vehicleRentalSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    return ret;
  }
});

module.exports = mongoose.model("VehicleRental", vehicleRentalSchema);
