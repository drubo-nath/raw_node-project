const crypto = require("crypto");
const utilities = {};
const environments = require("./environment");

utilities.parseJSON = (jsonString) => {
  let output;

  try {
    output = JSON.parse(jsonString);
  } catch (error) {
    output = {};
  }

  return output;
};

utilities.hash = (str) => {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", environments.secretKey)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

utilities.createRandomString = (strLen) => {
  let length = strLen;
  length = typeof strLen === "number" && strLen > 0 ? strLen : false;

  if (length) {
    let possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let output = "";
    for (let i = 0; i < length; i++) {
      let randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      output += randomCharacter;
    }

    return output;
  }
};

module.exports = utilities;
