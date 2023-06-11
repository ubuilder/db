import test from "ava";
import { connect } from "../../src/connect.js";

test.beforeEach("prepare database", async (t) => {
  t.context.db = connect();

  await t.context.db.createTable("test_users", {
    name: "string",
    test: "string",
  });

  t.context.usersModel = t.context.db.getModel("test_users");
});
test("insert multiple", async (t) => {
  const users = t.context.usersModel;

  await users.insert([
    { name: "test-user", test: "this is test1" },
    { name: "test-user", test: "this is test4" },
    { name: "test-user", test: "this is test3" },
  ]);

  const query = await users.query({});

  t.deepEqual(query.data.length, 3);
  t.deepEqual(query.page, 1);
  t.deepEqual(query.perPage, 3);
  t.deepEqual(query.total, 3);
});

test("insert with relations", async (t) => {
  await t.context.db.createTable("posts", {
    creator: "users",
    body: "string",
    title: "string",
  });

  await t.context.db.createTable("users", {
    username: "string",
    posts: "posts[]",
    name: "string",
  });

  const Posts = t.context.db.getModel("posts");

  await Posts.insert({
    body: "This is body",
    title: "Post title",
    creator: {
      name: "Hadi",
      username: "hadi",
    },
  });

  const Users = t.context.db.getModel("users");

  const users = await Users.query({});

  t.deepEqual(users.data.length, 1);
  t.deepEqual(users.data[0], {
    id: 1,
    name: "Hadi",
    username: "hadi",
    // posts: [{ id: 1, body: "This is body", title: "Post title" }],
  });

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("posts");
});
