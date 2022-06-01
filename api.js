const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const express = require("express");
const app = express();

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", express.static("public"));

module.exports = app;
