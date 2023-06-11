let schema;

export class Model {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  async getSchema() {
    if (!schema) {
      let schemaList = await this.db("schema").select("*");

      schema = {};
      schemaList.map((schem) => {
        schema[schem.table] = JSON.parse(schem.schema);
      });

      return schema;
    }
  }

  async query(options = {}) {
    const { select, sort, where = {}, page = 1, perPage = 10 } = options;

    /**
     * @type {import('knex').Knex.QueryBuilder}
     */
    let query = this.db(this.tableName);

    await this.getSchema();

    if (where) {
      for (const key in where) {
        const value = where[key];

        if (typeof value === "object") {
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

    let fields = [];

    if (select) {
      for (let field in schema[this.tableName]) {
        if (schema[this.tableName][field].type === "relation") continue;
        if (select[field]) {
          fields.push(field);
        }
      }
      if (!fields.includes("id")) fields.unshift("id");

      query = query.select(fields);
    } else {
      query = query.select("*");
    }

    let currentPage = page ?? 1;
    let itemsPerPage = perPage ?? 10;

    // Get the total number of rows in the database
    const totalRows = await query.clone().count("* as count").first();
    let total = totalRows.count;

    // Adjust the perPage value if necessary
    if (total < itemsPerPage || !itemsPerPage) {
      itemsPerPage = total;
    }

    const offset = (currentPage - 1) * itemsPerPage;
    query = query.offset(offset).limit(itemsPerPage);

    if (sort) {
      query = query.orderBy(sort.column, sort.order);
    }

    let data = await query;

    data = await Promise.all(
      data.map(async (row) => {
        for (let key in schema[this.tableName]) {
          const value = schema[this.tableName][key];

          if (value.type === "relation") {
            const otherSchema = schema[value.table];

            let fieldName;
            for (let field in otherSchema) {
              if (
                otherSchema[field].type === "relation" &&
                otherSchema[field].table === this.tableName
              ) {
                fieldName = field;
              }
            }

            const otherModel = new Model(value.table, this.db);
            let filter = {};
            if (otherSchema?.[fieldName]?.many) {
              filter[fieldName] = {
                id: row.id,
              };
            } else {
              filter[fieldName] = row.id;
            }

            if (select?.[key]) {
              row[key] = await otherModel
                .query({
                  where: filter,
                  select: select[key] ?? {},
                })
                .then((res) => res.data);
              if (!value.many) {
                row[key] = row[key][0];
              }
            }
          }
        }

        return row;
      })
    );

    return {
      data,
      total,
      page: currentPage,
      perPage: itemsPerPage,
    };
  }

  async insert(data) {
    const result = await this.db(this.tableName).insert(data);
    return result;
  }

  async get(id) {
    const [row] = await this.db(this.tableName).where({ id });
    return row;
  }

  async update(id, data) {
    await this.db(this.tableName).where({ id }).update(data);
  }

  async remove(id) {
    await this.db(this.tableName).where({ id }).del();
  }
}
