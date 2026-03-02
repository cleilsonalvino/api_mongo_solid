export interface HttpReponse<T>{
    code: number,
    body: T | string
}