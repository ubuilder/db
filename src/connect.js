import { getModel } from "./model/model.js";
import { createTable, removeColumns, removeTable, renameTable, updateColumn } from "./table.js";
import knex from "knex";

/**
 * @type {import('../index.d').ConnectType} 
 */
export function connect({
  client = "sqlite3",
  filename = ":memory:",
  host,
  user,
  password,
  database,
} = {}) {
  const db = knex({
    client: client,
    connection:
      client === "sqlite3"
        ? { filename }
        : {
            host,
            user,
            password,
            database,
          },
    useNullAsDefault: true,
  });

  return {
    getModel(tableName) {
      return getModel(tableName, db);
    },
    createTable(tableName, columns) {
      return createTable(tableName, columns, db);
    },
    removeTable(tableName) {
      return removeTable(tableName, db);
    },
    addColumns(tableName, columns) {
      return addColumns(tableName, columns, db)
    },
    removeColumns(tableName, columns) {
      return removeColumns(tableName, columns, db)
    }, 
    updateColumn(tableName, columnName, column) {
      return updateColumn(tableName, columnName, column, db)
    }, 
    renameTable(tableName, name) {
      return renameTable(tableName, name, db)
    }
  };
}
