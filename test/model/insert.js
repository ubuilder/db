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
  const Users = t.context.db.getModel('users');

  await Users.insert({
    name: 'Hadi',
    username: 'hadi'
  })

  await Posts.insert({
    body: "This is body",
    title: "Post title",
    creator_id: 1,
  });

  await Posts.insert({
    body: "This is another post",
    title: "Post title 2",
    creator_id: 1,
  });

  const users = await Users.query({
    preloads: {
      posts: true,
    },
    select: {
      name: true,
      username: true,
      posts: {
        body: true,
        title: true
      }
    }
    //
  });

  t.deepEqual(users.data.length, 1);
  t.deepEqual(users.data[0], {
    id: 1,
    name: "Hadi",
    username: "hadi",
    posts: [
      { id: 1, body: "This is body", title: "Post title" },
      { id: 2, body: "This is another post", title: "Post title 2" },
    ],
  });

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("posts");
});

test("insert with relation (array)", async (t) => {
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

  const Users = t.context.db.getModel("users");
  const Posts = t.context.db.getModel("Posts");

  await Users.insert({
    name: "Hadi",
    username: "hadi",
    posts: [
      { body: "This is first body", title: "Post title #1" },
      { body: "This is second body", title: "Post title #2" },
    ],
  });

  const users = await Users.query({
    select: {
      name: true,
      username: true,
      posts: true,
    },
    preloads: {
      posts: true
    }
  });

  t.deepEqual(users.data.length, 1);
  t.deepEqual(users.data[0], {
    id: 1,
    name: "Hadi",
    username: "hadi",
    posts: [
      {
        id: 1,
        creator_id: 1,
        body: "This is first body",
        title: "Post title #1",
      },
      {
        id: 2,
        creator_id: 1,
        body: "This is second body",
        title: "Post title #2",
      },
    ],
  });

  const posts = await Posts.query();

  t.deepEqual(posts.data.length, 2);

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("posts");
});

test("insert with relation (multiple id)", async (t) => {
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

  const Users = t.context.db.getModel("users");
  const Posts = t.context.db.getModel("posts");

  await Posts.insert([
    { body: "description of first post", title: "post #1" },
    { body: "description of second post", title: "post #2" },
    { body: "description of third post", title: "post #3" },
  ]);

  await Users.insert({
    name: "Hadi",
    username: "hadi",
    posts: [1, 3],
  });

  const posts = await Posts.query({
    select: {
      title: true,
    },
    preloads: {
      creator: true
    }
  });

  t.deepEqual(posts.data, [
    {
      id: 1,
      title: "post #1",
      creator_id: 1,
      creator: { id: 1, name: "Hadi", username: "hadi" },
    },
    {
      id: 2,
      title: "post #2",
      creator_id: null,
    },
    {
      id: 3,
      title: "post #3",
      creator_id: 1,
      creator: { id: 1, name: "Hadi", username: "hadi" },
    },
  ]);

  const users = await Users.query({});

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("posts");
});

test.skip("insert with relation (multiple array)", async (t) => {
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

  const Users = t.context.db.getModel("users");
  const Posts = t.context.db.getModel("Posts");

  await Users.insert([
    {
      name: "Hadi",
      username: "hadi",
      posts: [
        { body: "This is first body", title: "Post title #1" },
        { body: "This is second body", title: "Post title #2" },
      ],
    },
    {
      name: "Edriss",
      username: "edriss",
      posts: [
        { body: "This is edriss first body", title: "Post title #1" },
        { body: "This is edriss second body", title: "Post title #2" },
      ],
    },
    {
      name: "Jawad",
      username: "jawad",
      posts: [
        { body: "This is jawad first body", title: "Post title #1" },
        { body: "This is jawad second body", title: "Post title #2" },
      ],
    },
  ]);

  const users = await Users.query({
    select: {
      name: true,
      username: true,
      posts: true,
    },
    preloads: {
      posts: true
    }
  });

  t.deepEqual(users.data.length, 3);
  t.deepEqual(users.data[0], {
    id: 1,
    name: "Hadi",
    username: "hadi",
    posts: [
      {
        id: 1,
        creator_id: 1,
        body: "This is first body",
        title: "Post title #1",
      },
      {
        id: 2,
        creator_id: 1,
        body: "This is second body",
        title: "Post title #2",
      },
    ],
  });
  t.deepEqual(users.data[1], {
    id: 2,
    name: "Edriss",
    username: "edriss",
    posts: [
      {
        id: 3,
        creator_id: 2,
        body: "This is edriss first body",
        title: "Post title #1",
      },
      {
        id: 4,
        creator_id: 2,
        body: "This is edriss second body",
        title: "Post title #2",
      },
    ],
  });

  t.deepEqual(users.data[2], {
    id: 3,
    name: "Jawad",
    username: "jawad",
    posts: [
      {
        id: 5,
        creator_id: 3,
        body: "This is jawad first body",
        title: "Post title #1",
      },
      {
        id: 6,
        creator_id: 3,
        body: "This is jawad second body",
        title: "Post title #2",
      },
    ],
  });

  const posts = await Posts.query();

  t.deepEqual(posts.data.length, 6);

  await t.context.db.removeTable("users");
  await t.context.db.removeTable("posts");
});
