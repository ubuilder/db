import { get } from "./get.js";

function query_select(query, { select }) {
  let querySelect;
  if (Object.keys(select).length > 0) {
    querySelect = [];
    for (let key in select) {
      if (select[key]) {
        querySelect.push(key);
      }
    }

    //   id is always available
    if (!querySelect.includes("id")) querySelect.unshift("id");
  } else {
    querySelect = "*";
  }

  return query.select(querySelect);
}

function query_where(query, { where }) {
  if (Object.keys(where).length > 0) {
    for (const key in where) {
      let value;
      let operator;
      if (typeof where[key] === "object") {
        value = where[key].value;
        operator = where[key].operator;
      } else {
        value = where[key];
        operator = "=";
      }

      if (!value || !operator) break;

      if (operator === "like") {
        query = query.whereLike(key, `%${value}%`);
      } else if ((operator === "=") & (value === null)) {
        query = query.whereNull(key);
      } else if (operator === "!=" && value === null) {
        query = query.whereNotNull(key);
      } else if (operator === "in") {
        //   const v = value.split(",");
        query = query.whereIn(key, value);
      } else if (operator === "between") {
        query = query.whereBetween(key, [value[0], value[1]]);
      } else {
        query = query.where(key, operator ?? "=", value);
      }
    }
  }

  return query;
}

async function query_paginate(query, { page, perPage }) {
  // Get the total number of rows in the database
  const totalRows = await query.clone().count("* as count").first();
  let total = totalRows.count;

  // Adjust the perPage value if necessary
  if (total < perPage || !perPage) {
    perPage = total;
  }

  const offset = (page - 1) * perPage;
  query = query.offset(offset).limit(perPage);

  return {
    query,
    total,
    perPage,
  };
}

function query_sort(query, { sort }) {
  // TODO sort query...
  return query;
}

async function query_map_data(
  data,
  { schema, tableName, preloads, select, db }
) {
  for (let fieldName in data) {
    for (let key in preloads) {
      const {
        table,
        field,
        where: where2,
        preloads: preloads2,
      } = preloads[key];

      if (preloads[key].multiple) {
        const result = await query_function(
          {
            select: select[key],
            where: { ...where2, [field]: data.id },
            preloads: preloads2,
          },
          { tableName: table, db }
        );
        data[key] = result.data;
      } else {
        // single
        console.log(data[field], table)
        data[key] = await get(data[field], {tableName: table, db})
      }
    }
    // if (field.type === "relation") {
    //   if (preloads[fieldName]) {
    //     console.log({ schema, fieldName });
    //     let otherSchema = schema[field.table];

    //     let otherFieldName;
    //     for (let otherField in otherSchema) {
    //       if (
    //         otherSchema[otherField].type === "relation" &&
    //         otherSchema[otherField].table === tableName
    //       ) {
    //         otherFieldName = otherField;
    //       }
    //     }
    //     console.log(
    //       { otherFieldName },
    //       otherSchema[otherFieldName].many,
    //       data[field.field_name]
    //     );

    //     // console.log(otherSchema[otherFieldName], {data, fieldName})
    //     if (otherSchema[otherFieldName].many) {
    //       console.log("is many" , data);
    //     } else {
    //       console.log("is not many", data);
    //     }
    //     //     console.log(data, data[field.field_name])
    //     //   data[fieldName] = await get(data[field.field_name], {
    //     //     tableName: field.table,
    //     //     db,
    //     //   });
    //     // } else {
    //     //   data[fieldName] = await query_function(
    //     //     {
    //     //       where: {
    //     //         [otherFieldName + "_id"]: data.id,
    //     //       },
    //     //       select: select[fieldName] ?? { [otherFieldName]: false },
    //     //       preloads: typeof preloads[fieldName] === 'object' ? preloads[fieldName] : {},
    //     //       perPage: 1000,
    //     //       page: 1,
    //     //     },
    //     //     { tableName: field.table, db }
    //     //   ).then((res) => res.data);
    //     // }
    //   } else {
    //     // skip relations in query (todo: depth support)
    //   }
    // } else if (field.type === "boolean") {
    //   if (data[fieldName] === 1) {
    //     data[fieldName] = true;
    //   } else if (data[fieldName] === 0) {
    //     data[(fieldName = false)];
    //   }
    // } else {
    //   // do not change to query result
    // }
    if (data[fieldName] === undefined) {
      delete data[fieldName];
    }
  }
  return data;
}

export async function query_function(options = {}, { tableName, db }) {
  const {
    where = {},
    select = {},
    preloads = {},
    sort = {},
    page = 1,
    perPage = 10,
  } = options;
  let query = db(tableName);

  query = query_select(query, { select, tableName });

  query = query_where(query, { where });

  query = query_sort(query, { sort });

  let paginate_result = await query_paginate(query, {
    page,
    perPage,
    db,
    tableName,
  });

  let data = await paginate_result.query;
  console.log("raw data: ", data);

  data = await Promise.all(
    data.map(async (row) => {
      console.log("query map data", row, preloads);
      row = await query_map_data(row, { select, preloads, tableName, db });
      console.log("result: ", row);
      return row;
    })
  );

  return {
    data,
    page,
    perPage: paginate_result.perPage,
    total: paginate_result.total,
  };
}
