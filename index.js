require("dotenv").config();

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;

db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to MongoDB database"));

const usersRouter = require("./api/routes/users");
const scraperRouter = require("./api/routes/scraper");
const stockRouter = require("./api/routes/stock");
const phonesRouter = require("./api/routes/phones");

const port = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/users", usersRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/stock", stockRouter);
app.use("/api/phones", phonesRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(__dirname + "/public"));

  app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));
}

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
