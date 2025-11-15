/**
 * Script: generateCascadeAlters.js
 * Purpose: Scan information_schema for foreign keys referencing Customers or Orders
 *          and generate ALTER TABLE statements to re-create them with ON DELETE CASCADE.
 * Usage:
 *   - Generate SQL only:
 *       node generateCascadeAlters.js
 *   - Generate and apply immediately (runs the ALTER statements):
 *       node generateCascadeAlters.js --apply
 *
 * IMPORTANT: Review `backend/scripts/cascade-alters.sql` before applying in production.
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

async function main() {
  const dbName = sequelize.config.database;
  console.log('Using database:', dbName);

  // Find FKs that reference Customers or Orders
  const [rows] = await sequelize.query(
    `SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE KCU
     WHERE KCU.REFERENCED_TABLE_SCHEMA = :db
       AND KCU.REFERENCED_TABLE_NAME IN ('Customers', 'Orders')
       AND KCU.REFERENCED_COLUMN_NAME IS NOT NULL`,
    { replacements: { db: dbName }, type: sequelize.QueryTypes.SELECT }
  );

  if (!rows || rows.length === 0) {
    console.log('No foreign keys referencing Customers or Orders found.');
    process.exit(0);
  }

  const statements = [];

  for (const r of rows) {
    // Check current delete rule
    const [[ref]] = await sequelize.query(
      `SELECT DELETE_RULE, UPDATE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = :db AND CONSTRAINT_NAME = :cname`,
      { replacements: { db: dbName, cname: r.CONSTRAINT_NAME }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [ [{}] ]);

    const deleteRule = ref && ref.DELETE_RULE ? ref.DELETE_RULE.toUpperCase() : null;
    if (deleteRule === 'CASCADE') {
      console.log(`Skipping ${r.TABLE_NAME}.${r.COLUMN_NAME} (${r.CONSTRAINT_NAME}) — already ON DELETE CASCADE`);
      continue;
    }

    const drop = `ALTER TABLE \`${r.TABLE_NAME}\` DROP FOREIGN KEY \`${r.CONSTRAINT_NAME}\`;`;
    const add = `ALTER TABLE \`${r.TABLE_NAME}\` ADD CONSTRAINT \`${r.CONSTRAINT_NAME}\` FOREIGN KEY (\`${r.COLUMN_NAME}\`) REFERENCES \`${r.REFERENCED_TABLE_NAME}\`(\`${r.REFERENCED_COLUMN_NAME}\`) ON DELETE CASCADE ON UPDATE CASCADE;`;
    statements.push({ drop, add, table: r.TABLE_NAME, constraint: r.CONSTRAINT_NAME });
  }

  if (statements.length === 0) {
    console.log('No changes required.');
    process.exit(0);
  }

  const outPath = path.join(__dirname, 'cascade-alters.sql');
  const content = statements.map(s => `${s.drop}\n${s.add}`).join('\n');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Generated SQL written to', outPath);

  // If --apply flag present, execute the statements sequentially
  const apply = process.argv.includes('--apply');
  if (apply) {
    console.log('Applying statements now (in a transaction)...');
    const t = await sequelize.transaction();
    try {
      for (const s of statements) {
        console.log('Executing:', s.drop);
        await sequelize.query(s.drop, { transaction: t });
        console.log('Executing:', s.add);
        await sequelize.query(s.add, { transaction: t });
      }
      await t.commit();
      console.log('All statements applied successfully.');
    } catch (err) {
      await t.rollback();
      console.error('Failed applying statements:', err.message || err);
      console.error('Check', outPath, 'for generated SQL to run manually after review.');
      process.exit(1);
    }
  } else {
    console.log('Run with --apply to execute the generated SQL. Review the file before applying.');
  }
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
