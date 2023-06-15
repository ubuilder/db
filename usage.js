import { connect } from "./src/connect.js";

const { createTable, getModel, removeTable } = connect({});

await createTable("users", {
  name: "string",
  posts: "posts[]|ondelete=setnull",
});

await createTable("posts", {
  title: "string",
  body: "string",
  creator: "users",
  comments: "comments[]",
});

await createTable("comments", {
  text: "string",
  post: "posts",
});

const Users = getModel("users");
const Comments = getModel("comments");
const Posts = getModel("posts");

await Users.insert({
  name: "jawad",
  posts: [{ title: "first", body: "body of first" }],
});
await Users.insert({
  name: "edriss",
});

await Posts.insert({
  title: "edirss",
  body: "nane khoshk",
  creator_id: 2,
});

await Comments.insert({
  text: "Wow!",
  post_id: 1,
});
await Comments.insert({
  text: "Wow2!",
  post_id: 2,
});
await Comments.insert({
  text: "Very bad!",
  post_id: 2,
});

const result = await Users.query({
    where: {

        // posts: {
        //     title: 'fir:like'
        // }
    },
  select: {
    name: true,
    posts: {
      title: true,
      body: true,
      comments: true,
    },
    // comments: true,
  },
});
// const result = await Users.query({
//   select: {
//     name: true,
//     posts: {
//       title: true,
//     },
//   },
// });

console.log(JSON.stringify(result, null, 2));
// const result = await Posts.query({});
// console.log(result);
// const Users = getModel("users");

// await Users.insert([
//   { name: "Jawad", username: "jawad123" },
//   { name: "Edriss", username: "edrisss" },
//   { name: "Hadi", username: "hadi" },
// ]);

// const result = await Users.query({ perPage: 10, page: 5 });

// const result = await Users.get(28);

// console.log(result);

// // await createTable("users", {
// //   name: "string",
// //   username: "string",
// //   age: "number",
// //   //
// // });

// //

// // Users.get
// // Users.query
// // Users.insert
// // Users.update
// // Users.remove

// const result = await Users.query();

// console.log(result);

// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// await Users.insert({
//   name: "Hadi",
//   age: 21,
// });
// const result2 = await Users.query();

// console.log(result2);
