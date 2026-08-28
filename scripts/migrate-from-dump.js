// One-off mysqldump (.sql file) -> Supabase (Postgres, this repo) data copy.
// Use this when the live source DB isn't reachable from here (firewalled) —
// export a dump from the hosting panel and point this at the file instead.
// Shares the exact same transform logic as scripts/migrate-legacy-mysql.js
// via scripts/lib/migration-engine.js.
//
// Usage:
//   node scripts/migrate-from-dump.js "path/to/dump.sql"            # dry run
//   node scripts/migrate-from-dump.js "path/to/dump.sql" --write     # commit

const { loadDumpTables } = require('./lib/parse-mysql-dump')
const { runMigration } = require('./lib/migration-engine')

const filePath = process.argv[2]
const WRITE = process.argv.includes('--write')

if (!filePath) {
  console.error('Usage: node scripts/migrate-from-dump.js <path-to-dump.sql> [--write]')
  process.exit(1)
}

async function main() {
  console.log(`Parsing dump: ${filePath}`)
  const tables = loadDumpTables(filePath)
  console.log(`Parsed ${Object.keys(tables).length} tables with data.\n`)
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (pass --write to commit)'}\n`)

  const fetchAll = async (table) => tables[table] || []

  await runMigration(fetchAll, { write: WRITE })
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
