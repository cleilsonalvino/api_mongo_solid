import { IGetUsersController, IGetUsersRepository } from "./protocols";

export class GetUsersController implements IGetUsersController {

    private readonly getUsersRepository: IGetUsersRepository

    constructor(IGetUsersRepository: IGetUsersRepository){
        this.getUsersRepository = IGetUsersRepository
    }

    async handle(){
        try{
            const users = await this.getUsersRepository.getUsers()

            return{
                code: 200,
                body: users
            };
        } catch(error){
            return{
                code: 500,
                body: "Something went wrong.", error
            };
        }
    }
}