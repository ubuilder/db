export async function createTable(name, columns, db) {
  let schema = {};
  await db.schema.createTable(name, (table) => {
    let query;
    table.increments("id");
    schema["id"] = { type: "id" };
    for (let name in columns) {
      const value = columns[name].split("|");

      const type = value.shift();

      if (type === "number") {
        query = table.integer(name);
        schema[name] = { type: "number" };
      } else if (type === "string") {
        query = table.text(name);
        schema[name] = { type: "string" };
      } else if (type == "boolean") {
        query = table.boolean(name);
        schema[name] = { type: "boolean" };
      } else {
        // type is relation...

        schema[name] = { type: "relation" };
        let tableName = type;

        if (type.indexOf("[]") > 0) {
          schema[name]["many"] = true;
          tableName = type.replace("[]", "");
        } else {
          schema[name]["many"] = false;
        }
        schema[name]["table"] = tableName;

        query = table.integer(name).references(tableName + ".id");
      }

      for (let part of value) {
        if (part === "required") {
          query = query.notNullable();
          schema[name]["required"] = true;
        } else if (part === "unique") {
          query = query.unique();
          schema[name]["unique"] = true;
        } else if (part.startsWith("default")) {
          const value = part.split("=")[1];
          query = query.defaultTo(value);

          schema[name]["default"] = value;
        } else {
          console.log("not implemented: ", part);
        }
      }
    }
    return true;
  });

  if (!(await db.schema.hasTable("schema"))) {
    await db.schema.createTable("schema", (table) => {
      table.string("table");
      table.string("schema");
    });
  }

  await db("schema").insert({
    table: name,
    schema: JSON.stringify(schema),
  });
}

export async function removeTable(name, db) {
  await db.schema.dropTableIfExists(name);

  return true;
}
