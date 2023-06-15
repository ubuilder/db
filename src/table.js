export function getPivotTableName(field1, field2) {
  if (field1 > field2) {
    return `pivot_${field1}_${field2}`;
  } else {
    return `pivot_${field2}_${field1}`;
  }
}

export async function createTable(tableName, columns, db) {
  let resultLog = "create table: " + tableName + " ";

  let tables = {};

  if (await db.schema.hasTable("schema")) {
    const schema = await db("schema").select("*");

    for (let schem of schema) {
      tables[schem.table] = JSON.parse(schem.schema);
    }
    console.log(tables);
  }

  tables[tableName] = {};

  await db.schema.createTable(tableName, (table) => {
    let query;
    table.increments("id");
    tables[tableName]["id"] = { type: "id" };
    for (let name in columns) {
      const value = columns[name].split("|");

      const type = value.shift();

      if (type === "number") {
        query = table.integer(name);
        tables[tableName][name] = { type: "number" };
      } else if (type === "string") {
        query = table.text(name);
        tables[tableName][name] = { type: "string" };
      } else if (type == "boolean") {
        query = table.boolean(name);
        tables[tableName][name] = { type: "boolean" };
      } else {
        // type is relation...

        tables[tableName][name] = { type: "relation" };
        let relationName = type;

        if (type.indexOf("[]") > 0) {
          tables[tableName][name]["many"] = true;
          relationName = type.replace("[]", "");
          tables[tableName][name]["table"] = relationName;

          console.log("many", { tables });

          if (tables[relationName]) {
            const otherSchema = tables[relationName];

            let otherFieldName;
            for (let key in otherSchema) {
              if (otherSchema[key].table === tableName) {
                otherFieldName = key;
                break;
              }
            }

            console.log(otherSchema);
            if (otherSchema[otherFieldName].many) {
              const pivotTableName = getPivotTableName(relationName, tableName);
              // create pivot table.
              console.log("create pivot table: ", pivotTableName, [
                name + "_id",
                otherFieldName + "_id",
              ]);
              db.schema.createTable(pivotTableName, (builder) => {
                builder.integer(name + "_id").references(relationName + ".id");
                builder
                  .integer(otherFieldName + "_id")
                  .references(tableName + ".id");
              });
            }
          }
        } else {
          tables[tableName][name]["many"] = false;
          tables[tableName][name]["table"] = relationName;
          tables[tableName][name]["field_name"] = name + "_id";

          query = table.integer(name + "_id").references(relationName + ".id");
        }
      }

      for (let part of value) {
        if (part === "required") {
          query = query.notNullable();
          tables[tableName][name]["required"] = true;
        } else if (part === "unique") {
          query = query.unique();
          tables[tableName][name]["unique"] = true;
        } else if (part.startsWith("default")) {
          const value = part.split("=")[1];
          query = query.defaultTo(value);

          tables[tableName][name]["default"] = value;
        } else {
          console.log("not implemented: ", part);
        }
      }

      if (
        tables[tableName][name].type !== "relation" ||
        (tables[tableName][name].type === "relation" &&
          !tables[tableName][name].many)
      ) {
        resultLog +=
          "(" +
          (tables[tableName][name].field_name ?? name) +
          ": " +
          (tables[tableName][name].type === "relation"
            ? "number"
            : tables[tableName][name].type) +
          ") ";
      }
    }
    console.log(resultLog);
  });
  if (!(await db.schema.hasTable("schema"))) {
    await db.schema.createTable("schema", (table) => {
      table.string("table");
      table.string("schema");
    });
  }

  await db("schema").insert({
    table: tableName,
    schema: JSON.stringify(tables[tableName]),
  });
}

export async function removeTable(name, db) {
  console.log("remove table: ", name);
  await db.schema.dropTableIfExists(name);

  async function getSchema(table) {
    // return schema of table with name

    if (await db.schema.hasTable("schema")) {
      return db("schema").select("*").where({ table });
    }
  }
  const res = await getSchema(name);

  if (!res[0]) {
    // other table removed before this
    return;
  }
  const schema = JSON.parse(res[0].schema);

  for (let key in schema) {
    const field = schema[key];

    if (field.type === "relation" && field.many === true) {
      const res2 = await getSchema(field.table);
      const schema2 = JSON.parse(res2[0].schema);

      for (let key2 in schema2) {
        const field2 = schema2[key2];

        if (name === field2.table) {
          if (field2.many) {
            const pivotTableName = getPivotTableName(field.table, field2.table);

            console.log("remove pivot table: " + pivotTableName);

            db.schema.dropTableIfExists(pivotTableName);
          }
        }
      }
    }
  }
  // check if needs to remove pivot table.
  await db("schema").delete({ table: name });

  return true;
}
