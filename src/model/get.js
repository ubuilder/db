
export async function get(id, {tableName, db}) {
    console.log({id, tableName})
    const [row] = await db(tableName).where({ id });

    console.log({row})
    return row;
  }