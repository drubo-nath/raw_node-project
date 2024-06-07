const http = require("http");

const { handleReqRes } = require("../helpers/handleReqRes");
const environment = require("../helpers/environment");

const server = {};

server.createServer = () => {
  const createServerVariable = http.createServer(app.handleReqRes);
  createServerVariable.listen(environment.port, () => {
    console.log(`listening to port ${environment.port}`);
  });
};

app.handleReqRes = handleReqRes;

server.init = () => {
  server.createServer();
};

module.exports = server;
