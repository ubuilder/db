import test from "ava";
import { connect } from "../../src/connect.js";

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
  
