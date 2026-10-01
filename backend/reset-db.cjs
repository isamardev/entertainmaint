require("./load-env.cjs");
const db = require("./models/index.cjs");

const clearDatabase = async () => {
  console.log("⚠️  WARNING: Dropping ALL tables in 5 seconds... Cancel (Ctrl+C) if not sure!");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("🔄 Dropping all tables (force: true)...");
  await db.sequelize.sync({ force: true });
  console.log("✅ All tables dropped and recreated (empty).");

  console.log("\n🌱 Re-seeding default categories...");
  const Category = require("./models/Category.cjs");
  const categories = [
    { name: "Celebrity", slug: "celebrity", sort_order: 1 },
    { name: "Movies & TV", slug: "movies-tv", sort_order: 2 },
    { name: "Music", slug: "music", sort_order: 3 },
    { name: "Style", slug: "style", sort_order: 4 },
    { name: "Royals", slug: "royals", sort_order: 5 },
    { name: "Sports", slug: "sports", sort_order: 6 },
  ];
  for (const cat of categories) {
    await Category.findOrCreate({ where: { slug: cat.slug }, defaults: cat });
  }
  console.log("✅ Categories re-seeded.");

  console.log("\n🎉 Database cleared completely! Admins table is now empty.");
  console.log("👉 Next step: restart your backend server so `ensureDefaultAdmin()` creates:");
  console.log("   Email: admin@gmail.com");
  console.log("   Password: admin123");

  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error("❌ Error clearing database:", err?.message ?? String(err));
  process.exit(1);
});
