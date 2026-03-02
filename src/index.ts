import express from "express";
import {config} from "dotenv";
import { GetUsersController } from "./controllers/get-users/get-users";
import { MongoGetUsersRepository } from "./repositories/get-users/mongo-get-users";

config();

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/users", async (req, res) => {

  const mongoGetUsersRepository = new MongoGetUsersRepository()
  const getUsersController = new GetUsersController(mongoGetUsersRepository)

  const {code, body} = await getUsersController.handle()

  res.send(body).status(code)
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});