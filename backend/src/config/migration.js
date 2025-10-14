const sequelize = require("./database");
const logger = require("./logger");

/**
 * Safe database migration function that handles foreign key constraints
 * This function will:
 * 1. Disable foreign key checks
 * 2. Perform the migration
 * 3. Re-enable foreign key checks
 */
async function safeMigration() {
  try {
    logger.info("🔄 Starting safe database migration...");

    // Disable foreign key checks
    await sequelize.query("PRAGMA foreign_keys = OFF;");
    logger.info("✅ Foreign key checks disabled");

    // Perform the sync with alter: true
    await sequelize.sync({ force: false, alter: true });
    logger.info("✅ Database schema updated successfully");

    // Re-enable foreign key checks
    await sequelize.query("PRAGMA foreign_keys = ON;");
    logger.info("✅ Foreign key checks re-enabled");

    // Verify foreign key constraints are working
    const result = await sequelize.query("PRAGMA foreign_key_check;");
    if (result[0].length === 0) {
      logger.info("✅ All foreign key constraints are valid");
    } else {
      logger.warn("⚠️  Some foreign key constraints have issues:", result[0]);
    }

    logger.info("🎉 Database migration completed successfully");
    return true;
  } catch (error) {
    logger.error("❌ Migration failed:", error);

    // Try to re-enable foreign key checks even if migration failed
    try {
      await sequelize.query("PRAGMA foreign_keys = ON;");
      logger.info("✅ Foreign key checks re-enabled after error");
    } catch (fkError) {
      logger.error("❌ Failed to re-enable foreign key checks:", fkError);
    }

    throw error;
  }
}

/**
 * Alternative migration strategy using force sync
 * This will recreate all tables (WARNING: This will delete all data)
 */
async function forceMigration() {
  try {
    logger.warn("⚠️  Starting force migration (THIS WILL DELETE ALL DATA)");

    // Disable foreign key checks
    await sequelize.query("PRAGMA foreign_keys = OFF;");

    // Force sync (recreate all tables)
    await sequelize.sync({ force: true });
    logger.info("✅ Database recreated successfully");

    // Re-enable foreign key checks
    await sequelize.query("PRAGMA foreign_keys = ON;");

    logger.info("🎉 Force migration completed successfully");
    return true;
  } catch (error) {
    logger.error("❌ Force migration failed:", error);
    throw error;
  }
}

/**
 * Check if database needs migration
 */
async function needsMigration() {
  try {
    // Check if all required tables exist
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    const existingTables = tables[0].map((row) => row.name);
    const requiredTables = [
      "users",
      "projects",
      "demo_configs",
      "demo_config_users",
      "project_users",
      "hook_logs",
      "groups",
      "group_users",
      "group_projects",
    ];

    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      logger.info(`📋 Missing tables: ${missingTables.join(", ")}`);
      return true;
    }

    // Check if demo_configs table has the subSiteDisplayName column
    if (existingTables.includes("demo_configs")) {
      const demoConfigsSchema = await sequelize.query(
        "PRAGMA table_info(demo_configs);"
      );
      const columns = demoConfigsSchema[0].map((row) => row.name);

      if (!columns.includes("sub_site_display_name")) {
        logger.info(
          "📋 'subSiteDisplayName' column is missing in 'demo_configs' table"
        );
        return true;
      }
    }

    logger.info("✅ All required tables exist");
    return false;
  } catch (error) {
    logger.error("❌ Error checking migration status:", error);
    return true;
  }
}

module.exports = {
  safeMigration,
  forceMigration,
  needsMigration,
};
