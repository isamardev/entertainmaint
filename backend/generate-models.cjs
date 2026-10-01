require("./load-env.cjs");
const SequelizeAuto = require("sequelize-auto");

const databaseUrl = process.env.DATABASE_URL;
const explicitDialect = process.env.DB_DIALECT;
const useDatabaseUrl = Boolean(databaseUrl) && explicitDialect !== "mysql";
const dialect = explicitDialect || (useDatabaseUrl ? "postgres" : "mysql");

const auto = useDatabaseUrl
  ? new SequelizeAuto(databaseUrl, "", "", {
      dialect,
      directory: "./backend/models",
      caseModel: "p",
      caseFile: "p",
      singularize: true,
      lang: "es5",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new SequelizeAuto(
      process.env.DB_NAME || "entertainment",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect,
        directory: "./backend/models",
        caseModel: "p",
        caseFile: "p",
        singularize: true,
        lang: "es5",
      },
    );

auto
  .run()
  .then((data) => {
    console.log("Models generated successfully!");
    console.log("Tables:", Object.keys(data.tables));
  })
  .catch((err) => {
    console.error("Error generating models:", err);
  });
