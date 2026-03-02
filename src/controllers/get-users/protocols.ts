import { User } from "../../models/users";
import { HttpReponse } from "../protocols";

export interface IGetUsersController {
  handle(): Promise<HttpReponse<User[]>>;
}

export interface IGetUsersRepository{
    getUsers(): Promise<User[]>
}