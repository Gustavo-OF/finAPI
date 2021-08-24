# FinAPI
API de finanças em NodeJS

## Requisitos:

- Criar uma conta
- Buscar o extrato bancário do cliente
- Realizar um depósito
- Realizar um saque
- Buscar o extrato bancário do cliente por data
- Atualizar dados na conta do cliente
- Obter dados da conta do cliente
- Deletar uma conta
- Deve ser possível retornar o balance

## Regras:

- Não deve cadastrar uma conta com CPF já existente
- Não deve depositar em uma conta não existente
- Não deve buscar extrato em uma conta não existente
- Não deve fazer saque em conta não existente
- Não deve excluir uma conta não existente
- Não deve fazer saque quando o saldo for insuficiente
