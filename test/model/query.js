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

test("should return object", async (t) => {
  const query = await t.context.usersModel.query();

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 0);
  t.deepEqual(query.perPage, 0);
  t.deepEqual(query.data, []);

});

test("query should return data", async (t) => {
  const users = t.context.usersModel;

  await users.insert({ name: "test-user", test: "this is test" });

  const query = await users.query();

  t.deepEqual(query.page, 1);
  t.deepEqual(query.total, 1);
  t.deepEqual(query.perPage, 1);
  t.like(query.data, [{ name: "test-user", test: "this is test" }]);

  t.truthy(query.data[0].id);
});

test("query should filter data ", async (t) => {
  const users = t.context.usersModel;

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
  const users = t.context.usersModel;

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
  const users = t.context.usersModel;

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
  const users = t.context.usersModel;

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
test.skip("sort", async (t) => {
  const users = t.context.usersModel;

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

test("relationship", async (t) => {
  await t.context.db.createTable("users", {
    name: "string",
    test: "string",
    others: "other[]",
  });

  await t.context.db.createTable("other", {
    name: "string",
    description: "string",
    creator: "users",
  });

  const users = t.context.db.getModel("users");
  const other = t.context.db.getModel("other");

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

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("other");
});

