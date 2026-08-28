// One-off MySQL (e-learning-backoffice, legacy production DB) -> Supabase
// (Postgres, this repo) data copy via a LIVE connection to the source DB.
//
// If you can't reach the source DB directly (firewalled), use
// scripts/migrate-from-dump.js against a mysqldump .sql file instead — both
// share the exact same transform logic in scripts/lib/migration-engine.js.
//
// Safety: the MySQL side is opened as a raw mysql2 connection and this
// script only ever calls `.execute("SELECT ...")` against it — there is no
// write path to the source database here.
//
// Usage:
//   SOURCE_MYSQL_URL="mysql://user:pass@host:3306/dbname" node scripts/migrate-legacy-mysql.js           # dry run
//   SOURCE_MYSQL_URL="mysql://user:pass@host:3306/dbname" node scripts/migrate-legacy-mysql.js --write    # commit
//   (URL-encode any special characters in the password, e.g. '@' -> %40, '&' -> %26)

const mysql = require('mysql2/promise')
const { runMigration } = require('./lib/migration-engine')

const SOURCE_URL = process.env.SOURCE_MYSQL_URL
if (!SOURCE_URL) {
  console.error('SOURCE_MYSQL_URL is not set. Example:')
  console.error('  SOURCE_MYSQL_URL="mysql://user:pass@host:3306/dbname" node scripts/migrate-legacy-mysql.js')
  process.exit(1)
}

const WRITE = process.argv.includes('--write')

async function main() {
  const source = await mysql.createConnection(SOURCE_URL)
  console.log(`Connected to source MySQL. Mode: ${WRITE ? 'WRITE' : 'DRY RUN (pass --write to commit)'}\n`)

  const fetchAll = async (table) => {
    const [rows] = await source.execute(`SELECT * FROM \`${table}\``)
    return rows
  }

  await runMigration(fetchAll, { write: WRITE })
  await source.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
