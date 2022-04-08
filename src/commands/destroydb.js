const { startDatabaseDeletion } = require("../utilities/destroydbCommand.js");

function destroydb() {
  (async () => {
    await startDatabaseDeletion();
  })();
}

module.exports = destroydb;
