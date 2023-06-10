import { connect } from "./src/connect.js";

const { createTable, removeTable, getModel } = connect({
  filename: ":memory:",
});

// create...
await createTable("task", {
  title: "string|required",
  users: "user[]",
});

await createTable("user", {
  name: "string|required",
  tasks: "task[]",
});

// remove...
// await removeTable('user')
// await removeTable('task')


const Tasks = getModel("task");

await Tasks.insert({title: 'test'})
await Tasks.insert({title: 'todo'})

const allTasks = await Tasks.query({
  select: {
    title: 'to:like',
    name: true,
    field: true,
    user: {
      id: 2
    }
  }
})

console.log(allTasks)
// const Users = getModel("user");

// await Users.insert({ name: "hadi" });
// await Users.insert({ name: "edriss" });
// await Tasks.insert({ user_id: 1, title: "task 1 hadi" });
// await Tasks.insert({ user_id: 1, title: "task 2 hadi" });
// await Tasks.insert({ user_id: 2, title: "task 3 edriss" });

// // const userList = await Users.query({
// //   select: {
// //     name: true,
// //     tasks: {
// //       title: true,
// //       user: true,
// //       //   user: {
// //       //     name: true,
// //       //   },
// //     },
// //   },
// // });

// const userList = await Tasks.query({
//   where: {
//     // task: {
//     //   id: 3,
//     // },
//   },
//   select: {
//     // name: true,
//     // tasks: false
//     title: true,
//     user: true
//     // {
//     //   title: true,
//     //   user: true,
//     //   //   user: {
//       //     name: true,
//       //   },
//     // },
//   },
// });

// console.log(JSON.stringify(userList));
// console.log("not closing..");
