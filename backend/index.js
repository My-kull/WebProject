require("dotenv").config();
const app = require("./app");
const connectDB = require("./1-config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server is running on port ${PORT} at ${new Date().toLocaleTimeString()}`
    );
  });
});
