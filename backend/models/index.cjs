const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database.cjs");
const Sequelize = require("sequelize");

const db = {
  sequelize,
  Sequelize,
};

// Load all models automatically
const modelsDir = path.join(__dirname);
fs.readdirSync(modelsDir)
  .filter((file) => {
    return file.indexOf(".") !== 0 && file !== "index.cjs" && file.slice(-4) === ".cjs";
  })
  .forEach((file) => {
    const model = require(path.join(modelsDir, file));
    db[model.name] = model;
  });

// Set up associations if needed
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
