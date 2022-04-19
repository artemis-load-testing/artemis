const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const filepath = path.join(__dirname, "../../uploaded-test-scripts");
const filepathEscaped = filepath.replace(/ /g, "\\ ");
let filename;

// for testing spinners
router.get("/", function (req, res) {
  res.send("you were in the get request");
});

// INFRASTRUCTURE
router.post("/deploy", async function (req, res) {
  await exec(`artemis deploy`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    res.send(stderr);
    console.log("stdout: ", stdout);
  });
  console.log("DEPLOY");
});

router.post("/teardown", async function (req, res) {
  // need to remove confirmation check from cli and add to front end
  await exec(`artemis teardown --yes`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    res.send(stdout);
    console.log("stdout: ", stdout);
  });
  console.log("TEARDOWN");
});

// DELETE TIMESTREAM DATABASE
router.post("/deletedb", async function (req, res) {
  await exec(`artemis destroy-db --yes`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    res.send(stdout);
    console.log("stdout: ", stdout);
  });
  console.log("DESTROY-DB");
});

// GRAFANA START
router.post("/grafanaStart", async function (req, res) {
  await exec(`artemis grafana-start`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    console.log("stdout: ", stdout);
    res.send(stdout);
  });
  console.log("GRAFANA START");
});

// GRAFANA STOP
router.post("/grafanaStop", async function (req, res) {
  await exec(`artemis grafana-stop`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    console.log("stdout: ", stdout);
    res.send(stderr);
  });
  console.log("GRAFANA STOP");
});

// STOP TELEGRAF
router.post("/telegrafStop", async function (req, res) {
  await exec(`artemis sleep`, (error, stdout, stderr) => {
    if (error) {
      console.log("error: ", error);
    }
    if (stderr) {
      console.log("stderr: ", stderr);
    }
    res.send(stderr);
    console.log("stdout: ", stdout);
  });
  console.log("SLEEP");
});

// UPLOAD TEST SCRIPT
router.post("/uploadfile", async function (req, res) {
  const newpath = path.join(__dirname, "../../uploaded-test-scripts/");
  const file = req.files.file;
  filename = file.name;

  file.mv(`${newpath}${filename}`, (err) => {
    if (err) {
      res.status(500).send({ message: "File upload failed", code: 200 });
    }
    res.status(200).send({ message: "File Uploaded", code: 200 });
  });
});

// RUN TEST SCRIPT
router.post("/runtest", async function (req, res) {
  if (filename) {
    await exec(
      `artemis run-test -p ${filepathEscaped}/${filename} -tc ${req.query.taskCount}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log("error: ", error);
        }
        if (stderr) {
          console.log("stderr: ", stderr);
        }
        console.log("stdout: ", stdout);
        console.log("RUN-TEST", filepathEscaped);
        console.log("stdout: ", stdout);
        console.log("stderr: ", stderr);
        res.send(stdout);
      }
    );
  } else {
    res.send("Choose a file to upload.");
  }
});

module.exports = router;
