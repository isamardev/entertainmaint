require("../load-env.cjs");
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;
const explicitDialect = process.env.DB_DIALECT;

let dialect = explicitDialect || "mysql";

// If DATABASE_URL is provided, we use it no matter the dialect (Sequelize
// accepts mysql://, postgres://, mariadb:// etc.). Only in the explicit
// case where a user provided DB_DIALECT without also providing a URL do
// we consult the explicitDialect to pick postgres SSL options.
const useDatabaseUrl = Boolean(databaseUrl);

if (useDatabaseUrl) {
  try {
    const u = new URL(databaseUrl);
    const proto = (u.protocol || "").replace(/:$/, "").toLowerCase();
    if (proto === "postgres" || proto === "postgresql") dialect = "postgres";
    else if (proto === "mysql" || proto === "mysql2") dialect = "mysql";
    else if (proto === "mariadb") dialect = "mariadb";
  } catch {
    // Keep explicitDialect default if URL parse fails
  }
}

const isPostgres = dialect === "postgres";

let commonOptions = {
  dialect,
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
};

if (isPostgres) {
  commonOptions = {
    ...commonOptions,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  };
} else {
  // MySQL / MariaDB — host/port from env only when NOT using DATABASE_URL.
  if (!useDatabaseUrl) {
    commonOptions.host = process.env.DB_HOST || "localhost";
    commonOptions.port = Number(process.env.DB_PORT || 3306);
    // Some Hostinger MySQL plans also require SSL but not CA pinning:
    const wantSsl =
      String(process.env.DB_SSL || "").toLowerCase() === "true" ||
      String(process.env.MYSQL_ATTR_SSL_CA || "").length > 0;
    if (wantSsl) {
      commonOptions.dialectOptions = {
        ssl: { rejectUnauthorized: false },
      };
    }
    const poolSize = Number(process.env.DB_POOL_MAX) || 10;
    commonOptions.pool = {
      max: poolSize,
      min: 0,
      acquire: 60000,
      idle: 10000,
    };
  } else {
    // DATABASE_URL based MySQL — still allow SSL via env.
    const wantSsl =
      String(process.env.DB_SSL || "").toLowerCase() === "true" ||
      String(process.env.MYSQL_ATTR_SSL_CA || "").length > 0;
    if (wantSsl) {
      commonOptions.dialectOptions = {
        ssl: { rejectUnauthorized: false },
      };
    }
    const poolSize = Number(process.env.DB_POOL_MAX) || 10;
    commonOptions.pool = {
      max: poolSize,
      min: 0,
      acquire: 60000,
      idle: 10000,
    };
  }
}

const sequelize = useDatabaseUrl
  ? new Sequelize(databaseUrl, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || "entertainment",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      commonOptions,
    );

module.exports = sequelize;

