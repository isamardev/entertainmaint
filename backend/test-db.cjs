require("dotenv").config();
const db = require("./models/index.cjs");

const testConnection = async () => {
  try {
    console.log("Testing database connection...");
    await db.sequelize.authenticate();
    console.log("✅ Database connection successful!");

    console.log("Checking if 'entertainment' database exists...");
    // Try to list tables to confirm the database is there
    const [results] = await db.sequelize.query("SHOW TABLES");
    console.log("✅ Database tables found:", results);

    process.exit(0);
  } catch (error) {
    console.error("❌ Database error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

testConnection();
