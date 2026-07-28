require("dotenv").config();
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;
const dialect = process.env.DB_DIALECT || (databaseUrl ? "postgres" : "mysql");
const isPostgres = dialect === "postgres";

const commonOptions = {
  dialect,
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  ...(isPostgres
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
      }),
};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || "entertainmaint",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      commonOptions,
    );

module.exports = sequelize;
