const fs = require("fs");
const httpntlm = require("httpntlm");
const express = require("express");
const https = require("https");

const companyId = "74e35bd0-2590-eb11-bb66-000d3abcddd1";
const baseUrl = "http://localhost:7048/BC180";
const defaults = {
  username: "USER-NAME",
  password: "PASSWORD",
  workstation: "",
  domain: "DOMAIN-NAME",
};

const app = express();
const port = 3000;

const key = fs.readFileSync("./ssl/key.pem");
const cert = fs.readFileSync("./ssl/cert.pem");
const server = https.createServer({ key: key, cert: cert }, app);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

server.listen(port, () => {
  console.log(`Example app listening at https://localhost:${port}`);
});

app.get("/", (req, res) => {
  const html = fs.readFileSync("./home.html");
  res.setHeader("content-type", "text/html");
  res.send(html);
});

app.post("/customer-notification", function (req, res) {
  // response to validation requests
  if (req.query.validationToken) {
    res.send(req.query.validationToken);
    return;
  }

  console.log("Customer entity updates:");
  console.log(req.body);
  res.send("");
});

app.get("/register-webhook", function (req, res) {
  const body = {
    notificationUrl: `https://localhost:${port}/customer-notification`,
    resource: `/api/v2.0/companies(${companyId})/customers`,
    clientState: "state123",
  };

  const options = {
    ...defaults,
    headers: {
      "Content-Type": "application/json",
    },
    url: `${baseUrl}/api/v2.0/subscriptions`,
    body: JSON.stringify(body),
  };

  httpntlm.post(options, function (err, response) {
    if (err) {
      return err;
    }

    res.setHeader("content-type", "application/json");
    res.send(response.body);
  });
});

app.get("/get-subscriptions", function (req, res) {
  const options = {
    ...defaults,
    url: `${baseUrl}/api/v2.0/subscriptions`,
  };

  httpntlm.get(options, function (err, response) {
    if (err) {
      return err;
    }

    res.setHeader("content-type", "application/json");
    res.send(response.body);
  });
});

app.post("/delete-subscription", function (req, res) {
  const subscriptionId = req.body.subscriptionId;
  const eTag = req.body.eTag;

  const options = {
    ...defaults,
    url: `${baseUrl}/api/v2.0/subscriptions('${subscriptionId}')`,
    headers: {
      "If-Match": eTag,
    },
  };

  httpntlm.delete(options, function (err, response) {
    if (err) {
      return err;
    }

    res.setHeader("content-type", "application/json");
    if (response.statusCode == 204) {
      res.send("subscription deleted");
    } else {
      res.send(response.body);
    }
  });
});

app.post("/renew-subscription", function (req, res) {
  const subscriptionId = req.body.subscriptionId;
  const eTag = req.body.eTag;

  const body = {
    notificationUrl: `https://localhost:${port}/customer-notification`,
    resource: `/api/v2.0/companies(${companyId})/customers`,
    clientState: "state123",
  };

  const options = {
    ...defaults,
    url: `${baseUrl}/api/v2.0/subscriptions('${subscriptionId}')`,
    headers: {
      "Content-Type": "application/json",
      "If-Match": eTag,
    },
    body: JSON.stringify(body),
  };

  httpntlm.patch(options, function (err, response) {
    if (err) {
      return err;
    }

    res.setHeader("content-type", "application/json");
    res.send(response.body);
  });
});
