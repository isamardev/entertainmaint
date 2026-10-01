require("../load-env.cjs");
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;
const explicitDialect = process.env.DB_DIALECT;
const useDatabaseUrl = Boolean(databaseUrl) && explicitDialect !== "mysql";
const dialect = explicitDialect || (useDatabaseUrl ? "postgres" : "mysql");
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

const sequelize = useDatabaseUrl
  ? new Sequelize(databaseUrl, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || "entertainment",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      commonOptions,
    );

module.exports = sequelize;
