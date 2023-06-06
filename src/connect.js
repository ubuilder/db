import { Model } from "./model.js";
import { createTable, removeTable } from "./table.js";
import knex from "knex";

export function connect({ 
  client = "mysql", 
  filename = ":memory:",
  host,
  user,
  password,
  database
} = {}) {
  const db = knex({
    client: client,
    connection: {
      host,
      user,
      password,
      database,
    },
    useNullAsDefault: true,
  });

  return {
    getModel(tableName) {
      return new Model(tableName, db);
    },
    createTable(tableName, columns) {
      return createTable(tableName, columns, db);
    },
    removeTable(tableName) {
      return removeTable(tableName, db);
    },
  };
}
