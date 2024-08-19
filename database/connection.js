const mongoose = require("mongoose");
const url = "mongodb://127.0.0.1:27017/mehers";

mongoose
  .connect(url)
  .then(() => {
    console.log("database ready...");
  })
  .catch((err) => {
    console.log(err);
  });
