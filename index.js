import { connect } from "./src/connect.js";

export * from "./src/connect.js";

const { createTable } = connect();

console.log("1");
await createTable("users", {
  name: "string",
});

console.log("2");
