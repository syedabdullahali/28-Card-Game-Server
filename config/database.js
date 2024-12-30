const mongoose = require("mongoose");
require("dotenv").config();
mongoose.set("strictQuery", true);

const databaseConnect = async () =>
  await mongoose
    .connect(`${process.env.MONGO_URL}`)
    .then(() => {
      console.log("Connected to database");
    })
    .catch((err) => {
      console.log("Error connecting to database", err);
    });

module.exports = databaseConnect;
