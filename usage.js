import { connect } from "./src/connect.js";

const { getModel, createTable } = connect({
  filename: ":memory:",
});

await createTable("user", {
  name: "string",
  age: "number",
  posts: "post[]",
});

await createTable("post", {
  title: "string",
  content: "string",
  creator: "user",
});

const users = getModel("user");

const ids = await users.insert({ name: "Hadi", age: 29 });
await users.insert({ name: "Hadi2", age: 19 });

await getModel("post").insert({
  title: "first post",
  content: "content",
  creator_id: ids[0],
});
const id2 = await getModel("post").insert({
  title: "second post",
  content: "content",
  creator_id: ids[0],
});

const result = await getModel('post').query({
  preloads: {
    the_creator: {
      table: "user",
      field: "creator_id",
    },
  },
  // where: {
  //   id: {value: 1, operator: '!='}
  // }
});

console.log(result.data);
