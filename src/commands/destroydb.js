const { startDatabaseDeletion } = require("../utilities/destroydbCommand.js");

function destroydb(options) {
  (async () => {
    await startDatabaseDeletion(options);
  })();
}

module.exports = destroydb;
