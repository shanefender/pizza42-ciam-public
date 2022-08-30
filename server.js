const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
// const { auth } = require('express-openid-connect');

const app = express();

if (!authConfig.domain || !authConfig.audience) {
  throw "Please make sure that auth_config.json is in place and populated";
}

app.set('trust proxy', 'loopback')

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

// const checkJwt = auth({
//   audience: 'https://pizza-42-ciam.herokuapp.com',
//   issuerBaseURL: `https://dev-9tvm962i.us.auth0.com/`,
// });


// const checkJwt = auth({
//     issuerBaseURL: 'https://dev-9tvm962i.us.auth0.com',
//     baseURL: 'https://localhost',
//     clientID: 'WVcKWJK1BtA1jv2syWHRpRAMwse731cL',
//     secret: '2iUVdGbpq9NDEdaChY_IJc7jNTExfc3O-Vep7VVWtbgqjztQKq4pa3ht6pG2rDLn',
//     audience: authConfig.audience,
//     tokenSigningAlg: "RS256",
//     idpLogout: true,
//   });

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
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
