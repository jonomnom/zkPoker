import CardInfo, { Card, Rank, Suit } from "./cardInfo";
import pokersolver from "pokersolver";

export type PlayerAddress = string;
export type Currency = number;
export type Hand = Array<Card>;

export enum GameStage {
    GatheringPlayers = "GatheringPlayers",
    PreRound = "PreRound",
    PreFlop = "PreFlop",
    Flop = "Flop",
    Turn = "Turn",
    River = "River",
    PostRound = "PostRound"
}

export type Board = {
    stage: GameStage;
    playerAddresses: Array<PlayerAddress>;
    playerHands: Array<Hand>;
    playerStacks: Array<Currency> ;
    playerBets: Array<Currency>;
    playersInPot: Array<boolean>;

    communityCards: Array<Card>;

    nextPlayerToPlay: number;
    dealerIndex: number;

    potSize: Currency;
    bigBlindSize: Currency;

    // State dependent values
    // The winner of this round, only accessible after the round has ended
    winner: PlayerAddress | null;
    // Used to mark whether all players have done their move in the current stage
    playersReadyForCurrentStage: Array<boolean>
    // The set of cards the game plays out of - as cards are dealt, they are removed from the deck
    deck: Array<Card>;
};

const generateDeck = () => Object.values(Rank).map(r => Object.values(Suit).map(s => CardInfo.card(r, s))).flat(1);

export const createBoard = () => {
    const board: Board = {
        stage: GameStage.GatheringPlayers,
        playerAddresses: [],
        playerHands: [],
        playerStacks: [],
        playerBets: [],
        playersInPot: [],
        communityCards: [],
        nextPlayerToPlay: 0,
        dealerIndex: 0,
        potSize: 0,
        bigBlindSize: 40,
        winner: null,
        playersReadyForCurrentStage: [],
        deck: generateDeck()
    };
    return board;
};

// To be used to make modifications to the Board
// Don't use directly from the clients - always prefer the redux store
// Safe to use from inside redux, the minimal server or the blockchain
export class BoardStateManager {
    // GETTERS
    public static smallBlindIndex(state: Board): number {
        return BoardStateManager.nextActivePlayerIndex(state, state.dealerIndex);
    }
    public static bigBlindIndex(state: Board): number {
        return BoardStateManager.nextActivePlayerIndex(state, BoardStateManager.smallBlindIndex(state));
    }

    public static getPlayersInPotBets(state: Board): Currency[] {
        return state.playerBets.filter((p, i) => state.playersInPot[i]);
    }
    
    public static getHighestBest(state: Board): Currency {
        return Math.max(...state.playerBets);
    }

    public static nextActivePlayerIndex(state: Board, index: number): number {
        for (let i = (index + 1) % state.playerAddresses.length; i != index; (i + 1) % state.playerAddresses.length) {
            if (state.playersInPot[i]) {
                return i;
            }
        }
        throw new Error("Impossible error");
    }

    public static shouldMoveToNextStage(state: Board): boolean {
        const currentHighestBet = BoardStateManager.getHighestBest(state);
        switch (state.stage) {
            case GameStage.PreFlop:
            case GameStage.Flop:
            case GameStage.River:
            case GameStage.Turn:
            {
                const onePersonStanding = state.playersInPot.indexOf(true) == state.playersInPot.lastIndexOf(true);
                const allBetsAreEqual = BoardStateManager.getPlayersInPotBets(state).every(b => b == currentHighestBet);
                const hasEveryonePlayed = state.playersInPot.every((inPot, index) => inPot == state.playersReadyForCurrentStage[index]);
                return onePersonStanding || (allBetsAreEqual && hasEveryonePlayed);
            }
            default:
                return true;
        }
    }

    public static tryProgressStage(state: Board): void {
        if (!BoardStateManager.shouldMoveToNextStage(state)) {
            return;
        }
        console.log(`Progressing the game to next stage. Current stage: ${state.stage}`);
        switch (state.stage) {
            case GameStage.GatheringPlayers:
                BoardStateManager.beginGame(state);
                break;
            case GameStage.PreRound:
                BoardStateManager.startRound(state);
                break;
            case GameStage.PreFlop:
                BoardStateManager.dealFlop(state);
                break;
            case GameStage.Flop:
                BoardStateManager.dealTurn(state);
                break;
            case GameStage.Turn:
                BoardStateManager.dealRiver(state);
                break;
            case GameStage.River:
                BoardStateManager.resolveWinner(state);
                break;
            case GameStage.PostRound:
                BoardStateManager.startRound(state);
                break;
        }
    }
    
    // GAME ACTIONS
    public static raise(state: Board, playerIndex: number, amountToRaise: Currency) {
        BoardStateManager.placeBet(state, playerIndex, amountToRaise);
        // When someone raises, everyone else can respond with another raise
        state.playersReadyForCurrentStage = state.playerAddresses.map(_ => false);
        state.playersReadyForCurrentStage[playerIndex] = true;
        BoardStateManager.endTurn(state);
    }
    public static check(state: Board,  playerIndex: number) {
        state.playersReadyForCurrentStage[playerIndex] = true;
        BoardStateManager.endTurn(state);
    }
    public static call(state: Board, playerIndex: number) {
        const betToMatch = BoardStateManager.getHighestBest(state);
        const betToPlace = betToMatch - state.playerBets[playerIndex];
        BoardStateManager.placeBet(state, playerIndex, betToPlace);
        state.playersReadyForCurrentStage[playerIndex] = true;
        BoardStateManager.endTurn(state);
    }
    public static fold(state: Board, playerIndex: number) {
        state.playersInPot[playerIndex] = false;
        state.playersReadyForCurrentStage[playerIndex] = true;
        BoardStateManager.endTurn(state);
    }
    // HELPERS: Stage management
    public static beginGame(state: Board): void {
        state.stage = GameStage.PreRound;
    }
    public static startRound(state: Board) {
        state.playersInPot = state.playerAddresses.map(_ => true);
        state.playerBets = state.playerAddresses.map(_ => 0);
        state.deck = generateDeck();
        state.playerHands = state.playerAddresses.map(_ => [BoardStateManager.dealCard(state), BoardStateManager.dealCard(state)]);
        state.communityCards = [];
        state.potSize = 0;
        state.dealerIndex = BoardStateManager.nextActivePlayerIndex(state, state.dealerIndex);
        BoardStateManager.placeBet(state, BoardStateManager.bigBlindIndex(state), state.bigBlindSize);
        BoardStateManager.placeBet(state, BoardStateManager.smallBlindIndex(state), state.bigBlindSize / 2);
        state.playersReadyForCurrentStage = state.playerAddresses.map(_ => false);
        state.stage = GameStage.PreFlop;
    }
    public static randomizeRound(state: Board, playerCount: number) {
        const randomHex = (length: number) => [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        state.playerAddresses = Array.from({length: playerCount}).map(_ => randomHex(10));
        state.playersInPot = state.playerAddresses.map(_ => true);
        state.playerBets = state.playerAddresses.map(_ => 0);
        state.playerStacks = state.playerAddresses.map(_ => 500 + Math.random() * 1000); // .. TODO: FIX
        state.playerHands = state.playerAddresses.map(_ => []);
        state.dealerIndex = BoardStateManager.nextActivePlayerIndex(state, state.dealerIndex);
        BoardStateManager.placeBet(state, BoardStateManager.bigBlindIndex(state), state.bigBlindSize);
        BoardStateManager.placeBet(state, BoardStateManager.smallBlindIndex(state), state.bigBlindSize / 2);
    }
    public static dealFlop(state: Board): void {
        state.communityCards.push(BoardStateManager.dealCard(state));
        state.communityCards.push(BoardStateManager.dealCard(state));
        state.communityCards.push(BoardStateManager.dealCard(state));
        state.playersReadyForCurrentStage = state.playerAddresses.map(_ => false);
        state.stage = GameStage.Flop;
    }
    public static dealTurn(state: Board): void {
        state.communityCards.push(BoardStateManager.dealCard(state));
        state.playersReadyForCurrentStage = state.playerAddresses.map(_ => false);
        state.stage = GameStage.Turn;
    }
    public static dealRiver(state: Board): void {
        state.communityCards.push(BoardStateManager.dealCard(state));
        state.playersReadyForCurrentStage = state.playerAddresses.map(_ => false);
        state.stage = GameStage.River;
    }
    public static resolveWinner(state: Board): void {
        // const solver = (pokersolver || require("pokersolver")).Hand; // TODO: require is needed because the minimal server import doesn't function properly
        // const handsInPlay = state.playerHands
        //     .map((hand, index) => { return { hand: solver.solve(hand), index } })
        //     .filter(({hand, index}) => state.playersInPot[index]);
        // const winners = solver.winners(handsInPlay.map(({hand, index}) => hand));
        // // TODO: fix ties
        // if (winners.lead > 1) {
        //     console.error("The game doesn't support tie-ins");
        // }
        // const winner = winners[0];
        // let winnerIndex = -1;
        // for (const hand of handsInPlay) {
        //     if (hand.hand == winner) {
        //         winnerIndex = hand.index;
        //     }
        // }
        // state.playerStacks[winnerIndex] += state.potSize;
        // state.winner = state.playerAddresses[winnerIndex];
        // state.stage = GameStage.PostRound;
    }

    // HELPERS
    public static placeBet = (state: Board, playerIndex: number, betSize: Currency): void => {
        state.playerStacks[playerIndex] -= betSize;
        state.potSize += betSize;
        state.playerBets[playerIndex] += betSize;
    }
    public static dealCard(state: Board): Card {
        const cardIndex: number = pickRandomIndex(state.deck);
        const card = state.deck[cardIndex];
        state.deck.splice(cardIndex, 1);
        return card;
    }
    public static endTurn(state: Board): void {
        state.nextPlayerToPlay = BoardStateManager.nextActivePlayerIndex(state, state.nextPlayerToPlay);
    }
};

function pickRandomIndex<T>(arr: Array<T>): number {
    return ~~(Math.random() * arr.length);
}