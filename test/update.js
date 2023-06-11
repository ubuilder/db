import test from "ava";
import { connect } from "../src/connect.js";

test("add a relation by id", async (t) => {
  const { createTable, removeTable, getModel } = connect();

  await createTable("users", {
    name: "string",
    posts: "posts[]",
  });

  await createTable("posts", {
    title: "string",
    creator: "users",
  });

  const Users = getModel("users");

  await Users.insert({
    name: "Hadi",
    posts: [
      { name: "my first post" },
      { name: "my second post" },
      { name: "my third post" },
      { name: "my fourth post" },
    ],
  });

  // Users.update(1, {
  //   name: "Updated",
  //   posts: {
  //     add: { title: "another post" },
  //   },
  // });

  const usersWithPosts = await Users.query({});

  t.pass();
  await removeTable("users");
  await removeTable("posts");
});
test.todo("add a relation");
test.todo("update a relation's value");
test.todo("remove relation");
