const AWS = require('aws-sdk');
const execSync = require('child_process').execSync;
const userRegion = execSync('aws configure get region').toString().trim();
AWS.config.update({ region: userRegion });
const timestreamwrite = new AWS.TimestreamWrite();
const timestreamDbName = 'artemis-db';
const fs = require('fs');
const path = require('path');
const cdkPath = path.join(__dirname, '../aws');
const ora = require('ora-classic');
const chalk = require('chalk');
const readlineSync = require('readline-sync');

const pause = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time)); // in ms
};

const setFirstDeployToTrue = async () => {
  const data = '{"firstDeploy": "true"}';
  fs.writeFile(`${cdkPath}/config.json`, data, (err) => {
    if (err) console.log(err);
    else {
      let firstDeployStatus = JSON.parse(
        fs.readFileSync(`${cdkPath}/config.json`, 'utf8')
      ).firstDeploy;
    }
  });
};

const listTables = async (dbName) => {
  let tables = await timestreamwrite
    .listTables({ DatabaseName: dbName })
    .promise();
  return tables.Tables;
};

const deleteTable = async (dbName, tableName) => {
  await timestreamwrite
    .deleteTable({
      DatabaseName: dbName,
      TableName: tableName,
    })
    .promise();
};

const deleteTables = async (dbName, tables) => {
  let spinner;
  for (const table of tables) {
    spinner = ora(
      chalk.cyan(`Deleting ${table.TableName} table of ${dbName} database...`)
    ).start();
    spinner.color = 'yellow';
    await deleteTable(dbName, table.TableName);
    spinner.succeed(
      chalk.cyan(`${table.TableName} table of ${dbName} has been deleted.`)
    );
  }
};

const deleteDatabase = async (dbName) => {
  const spinner = ora(
    chalk.cyan(`Deleting ${timestreamDbName} database...`)
  ).start();
  spinner.color = 'yellow';

  await timestreamwrite
    .deleteDatabase({
      DatabaseName: dbName,
    })
    .promise();

  spinner.succeed(chalk.cyan(`${timestreamDbName} database has been deleted.`));
};

const doesDatabaseExists = async (dbName) => {
  const databases = await timestreamwrite.listDatabases({}).promise();
  return !!databases.Databases.find((db) => db.DatabaseName === dbName);
};

const deleteTablesAndDatabase = async () => {
  const databaseExists = await doesDatabaseExists(timestreamDbName);

  if (databaseExists) {
    const tables = await listTables(timestreamDbName);
    if (tables.length === 0) {
      return await deleteDatabase(timestreamDbName);
    } else {
      await deleteTables(timestreamDbName, tables);
      return await deleteTablesAndDatabase();
    }
  } else {
    return console.log(
      chalk.green(`Your ${timestreamDbName} database is already deleted.`)
    );
  }
};

const startDatabaseDeletion = async () => {
  const USER_INPUT = ['y', 'n', 'yes', 'no'];
  let confirmDbDelete;

  do {
    confirmDbDelete = readlineSync.question(
      chalk.cyan(
        'Are you sure you want to delete the Artemis database? (y/n)\n'
      )
    );
    confirmDbDelete = confirmDbDelete.toLowerCase().trim();

    if (
      USER_INPUT.includes(confirmDbDelete) &&
      confirmDbDelete.startsWith('y')
    ) {
      await deleteTablesAndDatabase();
      await setFirstDeployToTrue();
    } else if (
      USER_INPUT.includes(confirmDbDelete) &&
      confirmDbDelete.startsWith('n')
    ) {
      console.log(chalk.yellow('Database deletion canceled.'));
    } else {
      console.log(chalk.cyan('Please provide the correct input.'));
      await pause(1500);
      console.clear();
    }
  } while (!USER_INPUT.includes(confirmDbDelete));
};

module.exports = { startDatabaseDeletion };
