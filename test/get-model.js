import test from "ava";
import { connect } from "../src/connect.js";

test("get model", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  t.truthy(users.query);
  t.truthy(users.get);
  t.truthy(users.update);
  t.truthy(users.remove);
  t.truthy(users.insert);
});

test("query should return object", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  const query = await users.query();

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 0);
  t.deepEqual(query.perPage, 0);
  t.deepEqual(query.data, []);

  console.log(query);
});

test("query should return data", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test" });

  const query = await users.query();

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 1);
  t.deepEqual(query.perPage, 1);
  t.like(query.data, [{ name: "test-user", test: "this is test" }]);

  t.truthy(query.data[0].id);
});

test("query should filter data ", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test" });
  await users.insert({ name: "another-user", test: "test test" });
  await users.insert({ name: "new", test: "abc" });

  const query = await users.query({
    where: {
      name: "n:like",
    },
  });

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 2);
  t.deepEqual(query.perPage, 2);
  t.like(query.data, [{ name: "another-user" }, { name: "new", test: "abc" }]);

  t.truthy(query.data[0].id);
  t.truthy(query.data[1].id);
});

test("query should filter data (AND)", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test" });
  await users.insert({ name: "another-user", test: "test test" });
  await users.insert({ name: "new", test: "abc" });

  const query = await users.query({
    where: {
      name: "n:like",
      test: "test:like",
    },
  });

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 1);
  t.deepEqual(query.perPage, 1);
  t.like(query.data, [{ name: "another-user" }]);

  t.truthy(query.data[0].id);
});

test("query select some fields", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test" });
  await users.insert({ name: "another-user", test: "test test" });
  await users.insert({ name: "new", test: "abc" });

  const query = await users.query({
    where: {
      name: "n:like",
      test: "test:like",
    },
    select: {
      name: true,
    },
  });

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 1);
  t.deepEqual(query.perPage, 1);
  t.like(query.data, [{ name: "another-user" }]);

  t.truthy(query.data[0].id); // id is always truthy
  t.falsy(query.data[0].test);
  t.truthy(query.data[0].name);
});

test("query page 2", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test2" });
  await users.insert({ name: "test-user", test: "this is test3" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test5" });
  await users.insert({ name: "test-user", test: "this is test6" });
  await users.insert({ name: "test-user", test: "this is test7" });
  await users.insert({ name: "test-user", test: "this is test8" });
  await users.insert({ name: "test-user", test: "this is test9" });
  await users.insert({ name: "test-user", test: "this is test10" });
  await users.insert({ name: "another-user", test: "test test" });
  await users.insert({ name: "new", test: "abc" });

  const query = await users.query({
    page: 2,
    perPage: 5,
  });

  t.deepEqual(query.page, 2);
  t.deepEqual(query.total, 12);
  t.deepEqual(query.perPage, 5);

  t.deepEqual(query.data.length, 5);
});

// fix query sort
test.skip("query sort", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test3" });

  const query = await users.query({
    page: 2,
    perPage: 1,
    sort: {
      order: "asc",
      column: "test",
    },
  });

  t.deepEqual(query.page, 2);
  t.deepEqual(query.total, 12);
  t.deepEqual(query.perPage, 5);

  t.deepEqual(query.data.length, 5);

  t.deepEqual(query.data[0].test, "this is test6");
});

test("get by id", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test3" });

  const user = await users.get(3);

  t.deepEqual(user.test, "this is test3");
  t.deepEqual(user.name, "test-user");
  t.deepEqual(user.id, 3);
});

test("remove", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test3" });

  await users.remove(2);

  const query = await users.query({ where: { id: 2 } });

  t.deepEqual(query.data, []);
  t.deepEqual(query.page, 1);
  t.deepEqual(query.perPage, 0);
  t.deepEqual(query.total, 0);
});

test("update", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test3" });

  await users.update(2, { name: "updated name" });

  const query = await users.query({ where: { id: 2 } });

  t.deepEqual(query.data, [
    { id: 2, name: "updated name", test: "this is test4" },
  ]);
  t.deepEqual(query.page, 1);
  t.deepEqual(query.perPage, 1);
  t.deepEqual(query.total, 1);
});

test("insert multiple", async (t) => {
  const { createTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    test: "string",
  });

  const users = getModel("users");

  await users.insert([
    { name: "test-user", test: "this is test1" },
    { name: "test-user", test: "this is test4" },
    { name: "test-user", test: "this is test3" },
  ]);

  const query = await users.query({});
  console.log(query);

  t.deepEqual(query.data.length, 3);
  t.deepEqual(query.page, 1);
  t.deepEqual(query.perPage, 3);
  t.deepEqual(query.total, 3);
});

test("relations", async (t) => {
  const { createTable, getModel, removeTable } = connect({});

  await createTable("users", {
    name: "string",
    test: "string",
    others: "other[]",
  });

  await createTable("other", {
    name: "string",
    description: "string",
    creator: "users",
  });

  const users = getModel("users");
  const other = getModel("other");

  await users.insert({ name: "test-user", test: "this is test1" });
  await users.insert({ name: "test-user", test: "this is test4" });
  await users.insert({ name: "test-user", test: "this is test3" });
  await other.insert({
    name: "first other",
    description: "first description",
    creator_id: 1,
  });
  await other.insert({
    name: "second other",
    description: "second description",
    creator_id: 2,
  });
  await other.insert({
    name: "third other",
    description: "third description",
    creator_id: 1,
  });
  await other.insert({
    name: "fourth other",
    description: "fourth description",
    creator_id: 2,
  });

  const query = await users.query({
    select: {
      name: true,
      others: {
        name: true,
      },
    },
  });

  console.log(query.data);
  t.truthy(query.data[0].others);
  t.truthy(query.data[0].name);
  t.falsy(query.data[0].test);
  t.deepEqual(query.data[0].others.length, 2);
  t.deepEqual(query.data[0].others[0].name, "first other");
  t.falsy(query.data[0].others[0].description);

  const query2 = await other.query({
    select: {
      name: true,
      creator: {
        name: true,
      },
    },
  });

  t.truthy(query2.data[0].creator);
  t.truthy(query2.data[0].name);
  t.falsy(query2.data[0].test);
  t.deepEqual(query2.data[0].creator.test, "this is test1");
  t.falsy(query2.data[0].description);

  await removeTable("users");
  await removeTable("other");
});

test("insert with relations", async (t) => {
  try {
    const { createTable, removeTable, getModel } = connect({});

    console.log("-------------- create table posts ------------");

    const result = await createTable("posts", {
      creator: "users",
      body: "string",
      title: "string",
    });

    console.log(result);
    console.log("-------------- end create table posts ------------");

    console.log("-------------- create table users ------------");
    await createTable("users", {
      username: "string",
      posts: "posts[]",
      name: "string",
    });
    console.log("-------------- end create table users ------------");

    const Posts = getModel("posts");

    await Posts.insert({
      body: "This is body",
      title: "Post title",
      creator: {
        name: "Hadi",
        username: "hadi",
      },
    });

    const Users = getModel("users");

    const users = await Users.query({});

    console.log(users.data);
    t.deepEqual(users.data.length, 1);
    t.deepEqual(users.data[0], {
      id: 1,
      name: "Hadi",
      username: "hadi",
      // posts: [{ id: 1, body: "This is body", title: "Post title" }],
    });
  } catch (err) {
    console.log(err);
  }

  // await removeTable("users");
  // await removeTable("posts");
});
