require("./load-env.cjs");
const mysql = require("mysql2/promise");
const db = require("./models/index.cjs");
const Category = require("./models/Category.cjs");

const createDatabase = async () => {
  const explicitDialect = process.env.DB_DIALECT;
  const useDatabaseUrl = Boolean(process.env.DATABASE_URL) && explicitDialect !== "mysql";

  if (useDatabaseUrl || explicitDialect === "postgres") {
    console.log("Skipping CREATE DATABASE because Neon/Postgres database already exists.");
    return;
  }

  if (process.env.DB_SKIP_CREATE_DATABASE === "true") {
    console.log("Skipping CREATE DATABASE because DB_SKIP_CREATE_DATABASE=true.");
    return;
  }

  const dbName = process.env.DB_NAME || "entertainment";

  // Create connection without specifying database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  try {
    console.log(`Creating database '${dbName}' if it doesn't exist...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log("✅ Database created (or already exists)!");
  } catch (error) {
    console.error("Error creating database:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

const seedCategories = async () => {
  try {
    console.log("Seeding initial categories...");
    const categories = [
      { name: "Celebrity", slug: "celebrity", sort_order: 1 },
      { name: "Movies & TV", slug: "movies-tv", sort_order: 2 },
      { name: "Music", slug: "music", sort_order: 3 },
      { name: "Style", slug: "style", sort_order: 4 },
      { name: "Royals", slug: "royals", sort_order: 5 },
      { name: "Sports", slug: "sports", sort_order: 6 },
    ];

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
      });
    }

    console.log("✅ Categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

const init = async () => {
  await createDatabase();
  await db.sequelize.sync({ alter: true });
  await seedCategories();
  console.log("\n🎉 Database initialization complete!");
  process.exit(0);
};

init();
