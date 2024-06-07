const http = require("http");
const https = require("https");
const url = require("url");
const { handleReqRes } = require("../helpers/handleReqRes");
const environment = require("../helpers/environment");
const { sendTwilioSms } = require("../helpers/notification");
const data = require("./data");
const { parseJSON } = require("../helpers/utilities");
const worker = {};

worker.gatherAllChecks = () => {
  data.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.foreach((check) => {
        data.read("checks", check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            worker.validateCheckData(parseJSON(originalCheckData));
          } else {
            console.log("Error reading one of the checks data");
          }
        });
      });
    } else {
      console.log("Error could not find any checks to process!");
    }
  });
};

worker.validateCheckData = (originalCheckData) => {
  if (originalCheckData && originalCheckData.id) {
    originalCheckData.state =
      typeof originalCheckData.state === "string" &&
      ["up", "down"].indexOf(originalCheckData.state) > -1
        ? originalCheckData.state
        : "down";

    originalCheckData.lastChecked =
      typeof originalCheckData.lastChecked === "number" &&
      originalCheckData.lastChecked > 0
        ? originalCheckData.lastChecked
        : false;

    worker.performCheck(originalCheckData);
  } else {
    console.log("Error check was invalid or not properly working");
  }
};

worker.performCheck = (originalCheckData) => {
  let checkOutcome = {
    error: false,
    responseCode: false,
  };

  let outcome = false;
  let parsedUrl = url.parse(
    originalCheckData.protocol + "://" + originalCheckData.url,
    true
  );
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path;

  const requestDetails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };
  const protocolToUse = originalCheckData.protocol === "http" ? http : https;

  let req = protocolToUse.request(requestDetails, (res) => {
    const status = res.statusCode;

    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  res.on("error", (err) => {
    checkOutcome = {
      error: true,
      value: err,
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("timeout", (err) => {
    let checkOutcome = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
};

worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
  let state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";

  let alertWanted =
    originalCheckData.lastChecked && originalCheckData.state != state
      ? true
      : false;

  let newCheckData = originalCheckData;

  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  data.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        worker.alerUserToStatusChange(newCheckData);
      } else {
        console.log("Alert is not needed as there is no state changed");
      }
    } else {
      console.log("Error trying to save check data of one of the checks");
    }
  });
};

worker.alerUserToStatusChange = (newCheckData) => {
  let msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;

  sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log(`User was alerted to a status change via sms: ${msg}`);
    } else {
      console.log(`error sending sms to the user`);
    }
  });
};

worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 60000);
};

worker.init = () => {
  worker.gatherAllChecks();

  worker.loop();
};

module.exports = worker;
