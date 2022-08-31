const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
// const { auth, requiredScopes, requiresAuth } = require('express-openid-connect');

const app = express();

if (!authConfig.domain || !authConfig.audience) {
  throw "Please make sure that auth_config.json is in place and populated";
}

app.set('trust proxy', 'loopback')

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

const checkJwt = auth({
  audience: 'https://pizza-42-ciam.herokuapp.com',
  issuerBaseURL: `https://dev-9tvm962i.us.auth0.com/`,
});

app.get("/api/external", checkJwt, requiredScopes('update:order'), (req, res) => {
  res.send({
    Order_Status: "Your order has been placed!"
  });
});

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
