function getPivotTableName(field1, field2) {
  if (field1 > field2) {
    return `pivot_${field1}_${field2}`;
  } else {
    return `pivot_${field2}_${field1}`;
  }
}

export async function createTable(tableName, columns, db) {
  let schema = {};
  console.log('create table: ', tableName, Object.keys(columns))
  await db.schema.createTable(tableName, async (table) => {
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
        let relationName = type;

        if (type.indexOf("[]") > 0) {
          schema[name]["many"] = true;
          relationName = type.replace("[]", "");
          schema[name]['table'] = relationName

          const res = await getSchema(relationName);
          if (res) {
            const otherSchema = JSON.parse(res[0].schema);

            let otherFieldName;
            for (let key in otherSchema) {
              if (otherSchema[key].table === tableName) {
                otherFieldName = key;
                break;
              }
            }

            if (otherSchema[otherFieldName].many) {
              const pivotTableName = getPivotTableName(relationName, tableName);
              // create pivot table.
              console.log("create pivot table: ", pivotTableName, [name + '_id', otherFieldName + '_id']);
              await db.schema.createTable(pivotTableName, (builder) => {
                builder.integer(name + "_id").references(relationName + ".id");
                builder
                  .integer(otherFieldName + "_id")
                  .references(tableName + ".id");
              });
            }
          }
        } else {
          schema[name]["many"] = false;
        schema[name]["table"] = relationName;

          query = table.integer(name + "_id").references(relationName + ".id");
        }
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

  async function getSchema(table) {
    // return schema of table with name

    if (await db.schema.hasTable("schema")) {
      return db("schema").select("*").where({ table });
    }
  }

  if (!(await db.schema.hasTable("schema"))) {
    await db.schema.createTable("schema", (table) => {
      table.string("table");
      table.string("schema");
    });
  }

  await db("schema").insert({
    table: tableName,
    schema: JSON.stringify(schema),
  });
}

export async function removeTable(name, db) {
  
  console.log('remove table: ', name)
  await db.schema.dropTableIfExists(name);

  async function getSchema(table) {
    // return schema of table with name

    if (await db.schema.hasTable("schema")) {
      return db("schema").select("*").where({ table });
    }
  }
  const res = await getSchema(name);

  if(!res[0]) {
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
