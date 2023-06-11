import { getModel } from "./model.js";
import { createTable, removeTable } from "./table.js";
import knex from "knex";

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
  };
}
