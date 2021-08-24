const express = require("express");
//sempre usar a V4 com o uuid (library do node para gerar um id randomico)
const { v4: uuidv4 } = require("uuid");
//Instancia do express.
const app = express();
//Array de clientes.
const customers = [];
//Método para o Express aceitar parâmetros em JSON.
app.use(express.json());

/**
 * CPF - String
 * Name - String
 * id - Uuid
 * statement - Array
 */

//Middleware. Recebe o request, response e next. 
//(next é para dar continuidade para a aplicação caso dê tudo certo com a validação)
function verifyIfExistsAccountCPF(request, response, next){
    //Para capturar parametros do header, basta usar request.headers
    const { cpf } = request.headers;

    //some() retorna somente boolean; find() retorna o objeto.
    const customer = customers.find(
        (customer) => customer.cpf == cpf
    );
    
    //Se não encontrar, retorna erro.
    if(!customer){
        return response.status(400).json({error: "Customer not found!"});
    }
    //Atribui o cliente encontrado para o request, que será usado nas próximas rotas.
    request.customer = customer;

    //Continua o proceso.
    return next();
}

//Função para verificar o saldo
function getBalance(statement){
    //Reduce é uma método para retornar o resultado de uma operação com dois valores
    //acc é a ação que está sendo feita e operation.amount é o saldo do cliente
    const balance = statement.reduce((acc, operation) => {
        //Se for crédito, aumenta o saldo.
        if(operation.type === 'Credit'){
            return acc + operation.amount;
        //se for débito, diminui o saldo.    
        }else{
            return acc - operation.amount;
        }
    }, 0);
    //o 0 acima é para iniciar o reduce.
    return balance;
}

//Cria uma conta.
app.post("/account",(request,response) => {
    //Captura os parâmetros pelo body. 
    const {cpf, name} = request.body;
    //some(): método para passar por um array, recebe o array como parametro e realiza a comparação.
    const customersAlreadyExists = customers.some(
        (customers) => customers.cpf === cpf
    );
    //Caso o cliente já exista, retorna erro.
    if(customersAlreadyExists){
        response.status(400).json({error: "Customer already exists!"});
    }
    //Cria as informações da conta
    customers.push({
        cpf,
        name,
        id : uuidv4(),
        statement: []
    });
    //Retorna sucesso.
    return response.status(201).send();
});

//Dessa forma, todas as rotas da aplicação vão passar por esse Middleware
//app.use(verifyIfExistsAccountCPF);

//Dessa forma, somente a rota especificada irá passar pelo Middleware.
//Resgata o extrato bancário e verifica se existe a conta pelo Middleware.
app.get("/statement", verifyIfExistsAccountCPF,(request,response) => {
    //Captura o cliente pelo Middleware.
    const { customer } = request;
    //Retorna o extrato.
    return response.json(customer.statement);
});

//Realiza um deposito e verifica se existe a conta pelo Middleware. 
app.post("/deposit",verifyIfExistsAccountCPF,(request,response) => {
    //Captura os parametros pelo body e atribui nas constantes
    const{ description, amount } = request.body;
    //Captura o cliente pelo Middleware.
    const {  customer } = request;
    //Cria uma constante para atualizar a informações do deposito.
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "Credit"
    }
    //Efetiva o deposito.
    customer.statement.push(statementOperation);
    //Retorna sucesso.
    return response.status(201).send();

});

//Realiza um saque.
app.post("/withdraw",verifyIfExistsAccountCPF,(request, response) => {
    //Captura a quantidade do saque.
    const { amount } = request.body;
    //Recebe o cliente.
    const { customer } = request;
    //Recebe como ficará o saldo após a operação.
    const balance = getBalance(customer.statement);
    //Se for menor do que o que possuí, retorna erro.
    if(balance < amount){
        response.status(400).json({error : "Insifficient funds!"});
    }
    //Se for maior, atualiza as informações.
    const statementOperation = {
        amount,
        created_at :  new Date(),
        type: "Debit" 
    }
    //Atualiza a conta.
    customer.statement.push(statementOperation);

    return response.status(201).send();

});

//Resgata o extrato de acordo com a data informada.
app.get("/statement/date", verifyIfExistsAccountCPF,(request,response) => {
    //Captura o cliente pelo Middleware.
    const { customer } = request;
    //Captura a data informada na query
    const { date } = request.query;
    //Cria uma constante com a data do dia atual
    const dateFormat = new Date(date + " 00:00");
    //Faz um filtro para procurar se houve alguma movimentação bancaria na data
    const statement = customer.statement.filter(
        (statement) => 
            statement.created_at.toDateString() === 
            new Date(dateFormat).toDateString()
    );
    //Retorna o extrato.
    return response.json(statement);
});

//Atualiza os dados do cliente.
app.put("/account",verifyIfExistsAccountCPF,(request,response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

//Retorna as informações da conta do cliente.
app.get("/account", verifyIfExistsAccountCPF, (request,response) => {
    const { customer } = request;

    return response.json(customer);
});

//Deleta a conta do usuário
app.delete("/account",verifyIfExistsAccountCPF,(request,response) => {
    const { customer } = request;

    //splice para remover (tirar do array)
    customers.splice(customer,1);

    return response.status(200).json(customer);
});

//Recupera o saldo do cliente
app.get("/balance",verifyIfExistsAccountCPF,(request,response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.status(200).json(balance);
});

//Iniciando o servidor e passando a porta.
app.listen(3333);