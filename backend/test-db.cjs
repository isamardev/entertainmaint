require("dotenv").config();
const db = require("./models/index.cjs");

const testConnection = async () => {
  try {
    console.log("Testing database connection...");
    await db.sequelize.authenticate();
    console.log("✅ Database connection successful!");

    const dialect = db.sequelize.getDialect();
    console.log(`Connected using dialect: ${dialect}`);

    const [results] =
      dialect === "postgres"
        ? await db.sequelize.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
          )
        : await db.sequelize.query("SHOW TABLES");

    console.log("✅ Database tables found:", results);

    process.exit(0);
  } catch (error) {
    console.error("❌ Database error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

testConnection();
