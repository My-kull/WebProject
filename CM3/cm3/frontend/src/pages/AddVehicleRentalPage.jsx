const AddVehicleRentalPage = () => {
  const submitForm = (e) => {
    e.preventDefault();
    console.log("Form submitted");
  };

  return (
    <div className="create">
      <h2>Add a New Vehicle Rental</h2>
      <form onSubmit={submitForm}>
        <label>Vehicle Model:</label>
        <input type="text" required />
        <label>Category:</label>
        <select>
          <option value="Economy">Economy</option>
          <option value="Luxury">Luxury</option>
          <option value="SUV">SUV</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
        </select>
        <label>Description:</label>
        <textarea required></textarea>
        <label>Agency Name:</label>
        <input type="text" required />
        <label>Agency Email:</label>
        <input type="email" required />
        <label>Fleet Size:</label>
        <input type="number" min="0" />
        <label>City:</label>
        <input type="text" required />
        <label>State:</label>
        <input type="text" required />
        <label>Daily Price:</label>
        <input type="number" step="0.01" min="0" required />
        <label>Availability Status:</label>
        <select>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <label>Booking Deadline:</label>
        <input type="date" />
        <label>Insurance Policy:</label>
        <input type="text" required />
        <button>Add Vehicle Rental</button>
      </form>
    </div>
  );
};

export default AddVehicleRentalPage;
