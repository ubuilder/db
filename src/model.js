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

          if (select[fieldName] && field.type === "relation") {
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
              const otherQuery = await otherModel.query({
                where: {
                  [otherFieldName + "_id"]: row.id,
                },
                select: select[fieldName] ?? { [otherFieldName]: false },
                perPage: 1000,
                page: 1,
              });

              row[fieldName] = otherQuery.data;
            }
          } else if(field.type === 'boolean') {
            row[fieldName] = !!row[fieldName]
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

  async function insert(data) {
    await getSchema();

    let rows;
    if (Array.isArray(data)) {
      rows = data;
    } else {
      rows = [data];
    }

    let payload = [];
    for (let index in rows) {
      const row = rows[index];
      payload[index] = {};
      for (let field in schema[tableName]) {
        // if (
        //   schema[tableName][field].type === "relation" &&
        //   schema[tableName][field].many &&
        //   Array.isArray(row[field])
        // ) {
        //   break;
        // }
        if (
          schema[tableName][field].type === "relation" &&
          !schema[tableName][field].many &&
          row[schema[tableName][field].field_name]
        ) {
          //
          payload[index][schema[tableName][field].field_name] =
            row[schema[tableName][field].field_name];

          continue;
        }
        if (typeof row[field] !== "undefined") {
          if (schema[tableName][field].type === "relation") {
            if (row[field]) {
              const otherSchema = getModel(schema[tableName][field].table, db);

              if(typeof row[field] === 'number') {
                payload[index][schema[tableName][field].field_name] = row[field];
                // id of the field...
              } else {
                const result = await otherSchema.insert(row[field]);

              if (!Array.isArray(result)) {
                payload[index][schema[tableName][field].field_name] = result.id;
              }
            }

            }
          } else {
            payload[index][field] = row[field];
          }
        }
      }
    }

   const result = await db(tableName).insert(payload);


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
