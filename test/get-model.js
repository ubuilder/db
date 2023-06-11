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
