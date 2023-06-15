import { getPivotTableName } from "./table.js";

export function getModel(tableName, db) {
  if (!tableName) throw "tableName should be string";
  if (!db) throw "database connection is not available";

  let schema;

  async function getSchema() {
    if (!schema) {
      let schemaList = await db("schema").select("*");

      schema = {};
      schemaList.map((schem) => {
        schema[schem.table] = JSON.parse(schem.schema);
      });
    }
    return schema;
  }

  async function query(options = {}) {
    const { where = {}, select = {}, page = 1, perPage = 10 } = options;
    let query = db(tableName);
    await getSchema();

    let querySelect;
    if (Object.keys(select).length > 0) {
      querySelect = [];
      for (let key in schema[tableName]) {
        if (select[key]) {
          if (schema[tableName][key].type === "relation") {
            if (schema[tableName][key].field_name)
              querySelect.push(schema[tableName][key].field_name);
          } else {
            querySelect.push(key);
          }
        }
      }
      if (!querySelect.includes("id")) querySelect.unshift("id");
    } else {
      querySelect = "*";
    }
    query = query.select(querySelect);

    if (Object.keys(where).length > 0) {
      for (const key in where) {
        const value = where[key];

        if (typeof value === "object") {
          console.log("object in where field is not valid...");
          break;
        }

        if (typeof value === "string" && value.includes(":")) {
          const [filterValue, filterType] = value.split(":");

          if (filterType === "like") {
            query = query.whereLike(key, `%${filterValue}%`);
          } else if ((filterType === "=") & (filterValue === "null")) {
            query = query.whereNull(key);
          } else if (filterType === "!=" && filterValue === "null") {
            query = query.whereNotNull(key);
          } else if (filterType === "in") {
            const v = filterValue.split(",");
            query = query.whereIn(key, v);
          } else if (filterType === "between") {
            const [start, end] = filterValue.split(",");
            query = query.whereBetween(key, [start, end]);
          } else {
            query = query.where(key, filterType ?? "=", filterValue);
          }
        } else {
          query = query.where(key, value);
        }
      }
    }

    let itemsPerPage = perPage;
    // Get the total number of rows in the database
    const totalRows = await query.clone().count("* as count").first();
    let total = totalRows.count;

    // Adjust the perPage value if necessary
    if (total < itemsPerPage || !itemsPerPage) {
      itemsPerPage = total;
    }

    const offset = (page - 1) * itemsPerPage;
    query = query.offset(offset).limit(itemsPerPage);

    let data = await query;

    data = await Promise.all(
      data.map(async (row) => {
        for (let fieldName in schema[tableName]) {
          const field = schema[tableName][fieldName];

          if (field.type === "relation") {
            if (select[fieldName]) {
              const otherSchema = schema[field.table];

              const otherModel = getModel(field.table, db);
              let otherFieldName;
              for (let otherField in otherSchema) {
                if (
                  otherSchema[otherField].type === "relation" &&
                  otherSchema[otherField].table === tableName
                ) {
                  otherFieldName = otherField;
                }
              }
              if (otherSchema[otherFieldName].many) {
                row[fieldName] = await otherModel.get(row[field.field_name]);
              } else {
                row[fieldName] = await otherModel
                  .query({
                    where: {
                      [otherFieldName + "_id"]: row.id,
                    },
                    select: select[fieldName] ?? { [otherFieldName]: false },
                    perPage: 1000,
                    page: 1,
                  })
                  .then((res) => res.data);
              }
            } else {
              // skip relations in query (todo: depth support)
            }
          } else if (field.type === "boolean") {
            if (row[fieldName] === 1) {
              row[fieldName] = true;
            } else if (row[fieldName] === 0) {
              row[(fieldName = false)];
            }
          } else {
            // do not change to query result
          }
          if (row[fieldName] === undefined) {
            delete row[fieldName];
          }
        }
        return row;
      })
    );

    return {
      data,
      page,
      perPage: itemsPerPage,
      total,
    };
  }

  function toArray(data) {
    if (Array.isArray(data)) {
      return data;
    } else if (data) {
      return [data];
    } else {
      return [];
    }
  }

  async function insert(data) {
    await getSchema();

    let rows = toArray(data);

    let payload = [];
    for (let index in rows) {
      // prepare payload in this block
      const row = rows[index];
      payload[index] = {};
      for (let fieldName in schema[tableName]) {
        const field = schema[tableName][fieldName];

        if (field.type === "relation") {
          if (field.many) {
            continue;
          }
          if (row[field.field_name]) {
            payload[index][field.field_name] = row[field.field_name];
            // id
          } else if (row[fieldName]) {
            // object

            const result = await getModel(field.table, db).insert(
              row[fieldName]
            );
            payload[index][field.field_name] = result.id;
          } else {
            // nothing..
          }
        } else {
          if (typeof row[fieldName] !== "undefined") {
            payload[index][fieldName] = row[fieldName];
          }
        }
      }
    }

    const result = await db(tableName).insert(payload);

    for (let index in rows) {
      const row = rows[index];
      for (let fieldName in schema[tableName]) {
        const field = schema[tableName][fieldName];

        if (field.type === "relation" && field.many) {
          const model = getModel(field.table, db);

          let otherFieldName;
          for (let otherField in schema[field.table]) {
            if (
              schema[field.table][otherField].type === "relation" &&
              schema[field.table][otherField].table === tableName
            ) {
              otherFieldName = schema[field.table][otherField].field_name;
              if (!otherFieldName) {
                // console.log(
                //   "many to many",
                //   getPivotTableName(tableName, field.table),
                //   otherField + "_id",
                //   fieldName + "_id"
                // );
              }
            }
          }

          if (Array.isArray(row[fieldName]) && row[fieldName].length > 0) {
            if (typeof row[fieldName]?.[0] === "object") {
              const otherRows = row[fieldName].map((row) => ({
                ...row,
                [otherFieldName]: result[index],
              }));

              await model.insert(otherRows);
            } else {
              for (let id of row[fieldName]) {
                await model.update(id, {
                  [otherFieldName]: result[index],
                });
              }
            }
          }
        }
      }
    }

    if (Array.isArray(data)) {
      return data.map((d, index) => ({ id: result[index], ...d }));
    } else {
      return {
        id: result[0],
        ...data,
      };
    }
  }
  async function update(id, data) {
    const result = await db(tableName).where({ id }).update(data);

    return result;
  }

  async function remove(id) {
    await db(tableName).where({ id }).del();
    return true;
  }

  async function get(id) {
    const [row] = await db(tableName).where({ id });
    return row;
  }

  return {
    query,
    insert,
    update,
    remove,
    get,
  };
}
