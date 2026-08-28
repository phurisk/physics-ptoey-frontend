// Parses a mysqldump .sql file (CREATE TABLE + INSERT INTO statements) into
// { [tableName]: rowObject[] } using node-sql-parser, so a migration can run
// entirely offline against an exported dump instead of a live connection.

const fs = require('fs')
const { Parser } = require('node-sql-parser')

function unwrapValue(v) {
  if (v.type === 'null') return null
  return v.value
}

function loadDumpTables(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const parser = new Parser()
  const statements = parser.astify(content, { database: 'mysql' })

  const columnsByTable = {}
  for (const stmt of statements) {
    if (!stmt || stmt.type !== 'create' || !stmt.create_definitions) continue
    const tableName = stmt.table[0].table
    columnsByTable[tableName] = stmt.create_definitions.filter((d) => d.resource === 'column').map((d) => d.column.column)
  }

  const rowsByTable = {}
  for (const stmt of statements) {
    if (!stmt || stmt.type !== 'insert') continue
    const tableName = stmt.table[0].table
    const columns = columnsByTable[tableName]
    if (!columns) throw new Error(`No CREATE TABLE column order found for ${tableName}`)

    if (!rowsByTable[tableName]) rowsByTable[tableName] = []
    for (const tuple of stmt.values.values) {
      const row = {}
      tuple.value.forEach((v, i) => {
        row[columns[i]] = unwrapValue(v)
      })
      rowsByTable[tableName].push(row)
    }
  }

  return rowsByTable
}

module.exports = { loadDumpTables }
