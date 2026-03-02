import { IGetUsersRepository } from "../../controllers/get-users/protocols";
import { User } from "../../models/users";

export class MongoGetUsersRepository implements IGetUsersRepository{
    async getUsers(): Promise<User[]> {
        return[{
            
            firstName: "Cleilson",
            lastName: "Alvino",
            email: "cleilson@email.com",
            password: "123"
        }] 
}
}