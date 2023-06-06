import express from "express";
const PORT = process.env.PORT || 3001;
const app = express();
import { connect } from "../src/connect.js";

const { getModel, createTable, removeTable } = connect({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ubuilder',
});

const Users = getModel("tasks");

app.use(express.json());

app.post("/make_table", async (req, res) => {
  await createTable("tasks", {
    name: 'string|required',
    user_id: 'number|reference=users'
  });

  res.send("success");
});

app.post("/remove_table", async (req, res) => {
  await removeTable("users");
  res.send({ success: true });
});

app.get("/users", async (req, res) => {
  res.json(
    await Users.query({
      where: {
        // active: true,
        // user_name: "ss:like",
        // user_name: "edriss:!=",
        // user_name: null
      },
      // sort: {column: "user_name", order: "desc"},
      // select: ["id", "user_name"],
      page: 1,
      // perPage: 1
    })
  );
});

app.get("/users/:id", async (req, res) => {
  res.json(await Users.get(req.params.id));
});

app.post("/users", async (req, res) => {
  console.log("CREATE USER");
  console.log(req.body);
  res.json(await Users.insert(req.body));
});

app.put("/users/:id", async (req, res) => {
  res.json(await Users.update(req.params.id, { user_name: "ssss" }));
});

app.delete("/users/:id", async (req, res) => {
  res.json(await Users.remove(req.params.id));
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
