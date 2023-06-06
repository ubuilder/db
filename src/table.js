export async function createTable(name, columns, db) {
  await db.schema.createTable(name, (table) => {
    let query;
    table.increments("id");
    for (let name in columns) {
      const value = columns[name].split("|");

      const type = value.shift();

      if (type === "number") {
        query = table.integer(name);
      } else if (type === "string") {
        query = table.text(name);
      } else if (type == "boolean") {
        query = table.boolean(name);
      }

      for (let part of value) {
        if (part === "required") {
          query = query.notNullable();
        } else if (part === "unique") {
          query = query.unique();
        } else if (part.startsWith("default")) {
          const value = part.split("=")[1];
          query = query.defaultTo(value);
        } else if (part.startsWith("reference")) {
          const value = part.split("=")[1];
          query = query.unsigned()
          .references(value+".id")
        } else {
          console.log("not implemented: ", part);
        }
      }
    }
    return true;
  });
}

export async function removeTable(name, db) {
  await db.schema.dropTableIfExists(name);

  return true;
}
