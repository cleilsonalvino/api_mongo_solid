# API REST com MongoDB - Princípios SOLID e Padrões de Projeto

API REST desenvolvida com Node.js, Express, TypeScript e MongoDB, aplicando os princípios SOLID e padrões de projeto para criar uma arquitetura limpa, manutenível e extensível.

## Estrutura do Projeto

```
src/
├── index.ts                    # Ponto de entrada da aplicação
├── database/
│   └── mongo.ts               # Conexão com MongoDB
├── models/
│   └── users.ts               # Modelo de domínio User
├── controllers/
│   ├── protocols.ts           # Interface de resposta HTTP
│   └── get-users/
│       ├── protocols.ts       # Interfaces do controller e repositório
│       ├── get-users.ts       # Implementação do GetUsersController
├── repositories/
│   └── get-users/
│       └── mongo-get-users.ts # Implementação MongoDB do repositório
```

---

## Princípios SOLID Aplicados

### 1. Single Responsibility Principle (SRP) - Responsabilidade Única

> *"Uma classe deve ter apenas um motivo para mudar."*

Cada componente do projeto possui uma única responsabilidade bem definida:

| Componente | Responsabilidade |
|------------|------------------|
| `GetUsersController` | Orquestrar o caso de uso e retornar resposta HTTP |
| `MongoGetUsersRepository` | Buscar usuários no banco de dados |
| `User` | Definir a estrutura de dados do usuário |
| `MongoClient` | Gerenciar a conexão com MongoDB |
| `HttpReponse` | Definir o formato padrão de resposta HTTP |

**Exemplo - Controller focado apenas em orquestrar o caso de uso:**

```typescript
// src/controllers/get-users/get-users.ts
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
```

O controller **não sabe** como os dados são armazenados — apenas delega ao repositório e formata a resposta.

---

### 2. Open/Closed Principle (OCP) - Aberto/Fechado

> *"Entidades devem estar abertas para extensão, mas fechadas para modificação."*

O controller depende de uma **abstração** (`IGetUsersRepository`), não de uma implementação concreta. Assim, é possível adicionar novos repositórios (PostgreSQL, Redis, etc.) **sem alterar** o código do controller.

**Exemplo - Controller recebe abstração via construtor:**

```typescript
// src/controllers/get-users/get-users.ts
export class GetUsersController implements IGetUsersController {

    private readonly getUsersRepository: IGetUsersRepository

    constructor(IGetUsersRepository: IGetUsersRepository){
        this.getUsersRepository = IGetUsersRepository
    }
    // ...
}
```

**Interface que permite extensão:**

```typescript
// src/controllers/get-users/protocols.ts
export interface IGetUsersRepository{
    getUsers(): Promise<User[]>
}
```

Qualquer classe que implemente `IGetUsersRepository` pode ser usada pelo controller, sem modificá-lo.

---

### 3. Liskov Substitution Principle (LSP) - Substituição de Liskov

> *"Objetos de uma classe derivada devem ser substituíveis por objetos da classe base."*

Implementações concretas podem ser substituídas por suas abstrações sem quebrar o comportamento do sistema.

**Exemplo - MongoGetUsersRepository implementa a interface:**

```typescript
// src/repositories/get-users/mongo-get-users.ts
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
```

Uma implementação `PostgresGetUsersRepository` ou `RedisGetUsersRepository` poderia substituir `MongoGetUsersRepository` no controller, desde que respeite o contrato `getUsers(): Promise<User[]>`.

---

### 4. Interface Segregation Principle (ISP) - Segregação de Interface

> *"Clientes não devem ser forçados a depender de interfaces que não utilizam."*

As interfaces são pequenas e focadas, expondo apenas os métodos necessários.

**Exemplo - Interfaces enxutas e específicas:**

```typescript
// src/controllers/get-users/protocols.ts
export interface IGetUsersController {
  handle(): Promise<HttpReponse<User[]>>;
}

export interface IGetUsersRepository{
    getUsers(): Promise<User[]>
}
```

- `IGetUsersController`: apenas o método `handle()`
- `IGetUsersRepository`: apenas o método `getUsers()`

Cada cliente depende somente do que realmente precisa.

---

### 5. Dependency Inversion Principle (DIP) - Inversão de Dependência

> *"Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações."*

O controller (alto nível) depende da interface `IGetUsersRepository` (abstração), não da implementação `MongoGetUsersRepository` (baixo nível). A implementação concreta é injetada no **ponto de composição** (`index.ts`).

**Exemplo - Injeção de dependência no ponto de entrada:**

```typescript
// src/index.ts
app.get("/users", async (req, res) => {
  const mongoGetUsersRepository = new MongoGetUsersRepository();
  const getUsersController = new GetUsersController(mongoGetUsersRepository);

  const { code, body } = await getUsersController.handle();

  res.send(body).status(code);
});
```

O controller recebe o repositório via **constructor injection**. A decisão de qual implementação usar fica na raiz da aplicação, facilitando testes e troca de implementações.

---

## Resumo da Aplicação SOLID

| Princípio | Aplicado | Evidência |
|-----------|----------|-----------|
| **SRP** | ✅ | Controller, repositório, model e conexão separados |
| **OCP** | ✅ | Novos repositórios sem alterar o controller |
| **LSP** | ✅ | Qualquer `IGetUsersRepository` é substituível |
| **ISP** | ✅ | Interfaces pequenas com métodos únicos |
| **DIP** | ✅ | Controller depende de interface + injeção no construtor |

---

## Padrões de Projeto Utilizados

### Repository Pattern

Abstrai a lógica de acesso a dados, permitindo que a camada de negócio não dependa de detalhes do banco. O controller usa `IGetUsersRepository` sem saber se os dados vêm do MongoDB, PostgreSQL ou outro storage.

```typescript
// src/repositories/get-users/mongo-get-users.ts
export class MongoGetUsersRepository implements IGetUsersRepository{
    async getUsers(): Promise<User[]> {
        return[{ /* ... */ }] 
    }
}
```

---

### Dependency Injection (Injeção de Dependência)

As dependências são injetadas via construtor em vez de serem criadas internamente. Isso facilita testes (com mocks) e troca de implementações.

```typescript
// src/controllers/get-users/get-users.ts
constructor(IGetUsersRepository: IGetUsersRepository){
    this.getUsersRepository = IGetUsersRepository
}
```

---

### Singleton

O `MongoClient` mantém uma única instância de conexão compartilhada por toda a aplicação, evitando múltiplas conexões desnecessárias.

```typescript
// src/database/mongo.ts
export const MongoClient = {
    client: undefined as unknown as Mongo,
    db: undefined as unknown as Db,

    async connect(): Promise<void>{
        // ... configura e armazena em this.client e this.db
        this.client = client;
        this.db = db;
    },
}
```

---

### Adapter

O `MongoGetUsersRepository` adapta a API específica do MongoDB para a interface `IGetUsersRepository` do domínio. Assim, o restante do sistema trabalha com uma interface genérica.

```typescript
// Adapta MongoDB → IGetUsersRepository
export class MongoGetUsersRepository implements IGetUsersRepository{
    async getUsers(): Promise<User[]> {
        // Lógica específica do MongoDB encapsulada aqui
        return[{ /* ... */ }] 
    }
}
```

---

### Composition Root

O `index.ts` atua como **ponto de composição**: é onde as dependências são instanciadas e conectadas. Toda a "montagem" da aplicação acontece em um único lugar.

```typescript
// src/index.ts
app.get("/users", async (req, res) => {
  const mongoGetUsersRepository = new MongoGetUsersRepository();
  const getUsersController = new GetUsersController(mongoGetUsersRepository);

  const { code, body } = await getUsersController.handle();
  res.send(body).status(code);
});
```

---

### Strategy

A interface `IGetUsersRepository` permite trocar a estratégia de persistência em tempo de execução. Diferentes implementações (MongoDB, PostgreSQL, in-memory para testes) podem ser usadas sem alterar o controller.

---

### Resumo dos Padrões

| Padrão | Onde é aplicado |
|--------|-----------------|
| **Repository** | `MongoGetUsersRepository` abstrai acesso a dados |
| **Dependency Injection** | Controller recebe repositório via construtor |
| **Singleton** | `MongoClient` — conexão única compartilhada |
| **Adapter** | `MongoGetUsersRepository` adapta MongoDB à interface |
| **Composition Root** | `index.ts` — montagem das dependências |
| **Strategy** | Interface permite trocar implementação do repositório |

---

## Como Executar

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run start:dev
```

A API estará disponível em `http://localhost:3000`. O endpoint `GET /users` retorna a lista de usuários.

---

## Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **dotenv** - Variáveis de ambiente
