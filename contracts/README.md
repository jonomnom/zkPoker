# ZK Poker Template 

Solidity part is forked from [Hardhat template](https://github.com/paulrberg/hardhat-template/blob/main/.solcover.js) and remove some unnecessary files.

## Getting Started

### Pre Requisites

Before being able to run any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. You can follow the example in `.env.example`. If you don't already have a mnemonic, you can use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

## Usage

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain bindings:

```sh
$ yarn typechain
```

### Test

Run the tests with Hardhat:

```sh
$ yarn test
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy --greeting "Bonjour, le monde!"
```


## Workflow

### setup

game status: not started

A --> set up the wallet --> call smart contract for registeration

B --> set up the wallet --> call smart contract for registeration
....

### shuffle the table

game status: preparing

A:
Public X = [1,2,...,52]

Public Y = [23,41,...,85]

Proof: X to Y is a valid shuffle and encryption

Then, X, Y, and Proof all go to smart contract.


B:
a) Fetch X, Y, and Proof from Smart Contract.
b) Verify Proof.
c) Public Y, Public Z, Proof: Y to Z is a valid shuffle and encryption.
d) Send Z, Proof to smart contract.

Similarly, we have C, D, E, ...

check: no user left --> game status: ready, otherwise not ready

P.S: users can shuffle twice in the single round

### competition

On Smart Contract, there is a game logic who should draw & play a card.

Suppose we have A, B, C, D, E and this round should be A to draw a card.

Now, suppose we have shuffled and masked deck Z = [z1, z2, ..., zn] on smart contract.

Again, suppose z1 has been drawed before, we should draw z2 now.

Given z2, ask E to decrypt first, and send decrypted card value and the proof of correctness to the smart contract;
then D decrypt, then C, B, and finally A decrypt. Once A decrypt, A does not need to send the card value and proof of correctness.

Later, when A want to play this card, A need to send the card value and proof to smart contract.


### prompt design in text:
For an user:
1. Prompt tells him generate the pk, zk ..., and save to the local storage
2. Prompt tells him join a game, if he agrees with [Y], he will be registered to the deployed contract
3. Prompt show up the status of other users, if all users joined, prompt shows [Shuffle the table]
4. Prompt tells who is to shuffle the table, when it's his turn he shuffles. when all users finish this, prompt show [game starts]
5. Prompt tells who is to reveal the card, when it's his turn he shuffles. when all users finish this, prompt show [game starts]
6. Prompt tells him all users have revealed their cards, and show up the winner of this round.
7. end, and we can start from 4., another round begins


## Data type requirements

u256[] or byte32[], all the data types should be in the array of 32 bytes


