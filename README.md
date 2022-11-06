# Mantal Poker

## Setup

To setup, run

```
npm install .
cd minimal-server
npm install .
```

## Frontend

The frontend runs on React and Redux and was bootstrapped with the Create-React-App template. The project is split into several folders:

1. */src/connection* - contains the core logic of the game which is mostly shared between the client and the minimal server. The most important file is *boardApi.ts* - this file takes care of 90% of the actual poker logic. It works on a "Board" object which stores solely the data for the game, a separate BoardStateManager class contains the actual logic for it.
1. */src/redux* - slices of redux - contains all reducers, actions, thunks, etc.
1. *src/cards*, *src/board* & *src/controls* - contains the HTML representation of a card, player information and the board and user buttons

Most of the code reads from the `state.board` slice and uses that to control the state of the UI.

To open the frontend, run `npm start` in the root folder.

## Minimal web server

The minimal web server is a web2 server which acts as a REST server - the absolute minimal possible server that can serve the game.
It uses the *node-localstorage* npm package to write files on disk in which it stores all the data.

To start the server, run `tsc index.ts && node.index.js`. Note that you'll have to restart on every change done on the server-side.

## Client-server interactions

The frontend connects to the server via *thunks* - this is Redux's term for asynchronous action. You can find all thunks in the *player.ts* and *board.ts* files.

Here's roughly how the system works:

1. Server is started and waits for connections
1. Client 1 (clients generate a random hex string as their address) starts and sends a "Join Game" message.
1. Servers creates a new `Board`, adds the player to the list of players and saves that new `Board` into local storage
1. Any new clients who send "Join Game" message will get added to the same list. The server decides to start the game if
    - enough time has passed since the first player joined (this is currently set to 0 - i.e. the server doesn't wait for any time to pass)
    - enough players have joined (at least 2)
1. As soon as any of the clients send their "Join Game" message, they will start polling the server every *1 second* about updates. The server would will load the state of the `Board` from the storage and return that.
1. Every `Board` has a stage enum which shows it's current stage. This controls what's shown on screen and what options are available to the players.
1. When the server starts the game, the next time players poll for an update, they'll get a version of the board with stage being set to `PreFlop` instead of `GatheringPlayers` which marks the start of the game. Everyone will see their cards and the status of the other players on the table.
1. In the next 4 stages (Preflop, Flop, Turn, River), players act in the traditional poker way - sequentially and have the option to check/call/raise/fold when their turn comes up.
1. The server will progress the game to the next stage as soon as all the players who haven't folded yet have checked.
1. Once everyone checks at the River, we go to stage `PostRound`, compute the winner, give the winner the pot. During their next poll, the clients will get the new information and show the winner for the round.
    - As the server determines the winner, it also starts a timer (hardcoded in the server code to be *7.5s* currently). After that timer expires, the game progresses to the next round and we go to step 5.  

## Key dependencies

1. React and redux need no explanation
1. The server runs on express.js and a couple of its middlewares
    - the server uses node-localstorage for the storage - which mimics the API of the browser's local storage
1. How strong of a hand everyone has, and which hand wins is calculated by the pokersolver npm package.

## API

All of the calls between the server and the client use the `POST` method and send data as JSON in the body.
The types used for input and output can be found in */src/connection/messageTypes.ts*

### Join Game
```
/join
```
* Used for clients to request joining the next available game
* Input:
```
type JoinGameRequest = {
    playerAddress: PlayerAddress // the public address of the player
};
```
* Result:
```
export type JoinGameResponse = {
    playerIndex: number // the index under which the player has been registered in the game
};
```

### Update state

```
/refresh
```
* Used for clients to get the latest version of the board state
* Input:
```
type RefreshGameRequest = {
    playerAddress: string
};
```
* Output:
```
type RefreshGameResponse = Board;
```

### Betting

```
/send-bet
```
* Used for clients to check, call and raise all in one API call. The distinction is made on the server based on amount the player wants to bet.
  * Bet of 0 signfies check. It is refused if checking is not possible
  * Bet of exactly the amount needed to call signifies call. It is refused if it's any amount less than the call amount. This technically has a bug in it - in poker players are allowed to call for less if that's all they have and in that case they would not be eligible to win the entire pot if they actually win but an amount proportional to their bet. This case is not handled and is very complicated to cover.
  * Any bet of size higher than the call amount signifies a raise. Refused only if the player doesn't have enough of a stack.
* Input:
```
export type SendBetRequest = {
    playerAddress: PlayerAddress,
    amountToBet: number
};
```
* Output:
```
export type SendBetResponse = { };
```

### Fold

```
/refresh
```
* Used for clients to get out of the pot
* Input:
```
export type FoldRequest = {
    playerAddress: PlayerAddress
};
```
* Output:
```
export type FoldResponse = {
};
```
