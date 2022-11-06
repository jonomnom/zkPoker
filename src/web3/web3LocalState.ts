import { BigNumber } from "ethers";
import { Hand } from "../connection/boardApi";
import CardInfo, { Rank, Suit } from "../connection/cardInfo";
import { Board, Web3BoardManager, Web3GameStage } from "./useGameContract";


const allRanks = Object.values(Rank);
const allSuits = Object.values(Suit);
const Web3LocalState = {
    playerIndex(): number {
        return Web3StateInstance.cachedBoard.playerAddresses.indexOf(Web3StateInstance.playerAddress || '');
    },
    isOnSmallBlind(playerIndex: number): boolean {
        if (Web3StateInstance.cachedBoard.stage <= Web3GameStage.GatheringPlayers) {
            return false;
        }
        const len = Web3StateInstance.cachedBoard.playerAddresses.length;
        return Web3StateInstance.cachedBoard.dealerIndex.add(1).toNumber() % len === playerIndex;
    },
    isOnBigBlind(playerIndex: number): boolean { 
        if (Web3StateInstance.cachedBoard.stage <= Web3GameStage.GatheringPlayers) {
            return false;
        }
        const len = Web3StateInstance.cachedBoard.playerAddresses.length;
        return Web3StateInstance.cachedBoard.dealerIndex.add(2).toNumber() % len === playerIndex;
    },
    isDealer(playerIndex: number): boolean {return Web3StateInstance.cachedBoard.dealerIndex.toNumber() === playerIndex},
    canAct(): boolean {
        return Web3StateInstance.cachedBoard.nextPlayerToPlay.toNumber() === Web3LocalState.playerIndex();
    },
    canCheck(): boolean {
        const highestBet: number = Math.max(...Web3StateInstance.cachedBoard.playerBets.map(b => b.toNumber()));
        const isNextPlayer = this.canAct();
        return isNextPlayer && this.getPlayersInPotBets().every(bet => bet.eq(highestBet));
    },
    canFold(): boolean {
        const highestBet: number = this.getHighestBest();
        const isNextPlayer = this.canAct();
        return isNextPlayer && this.getPlayersInPotBets().every(bet => bet.eq(highestBet));
    },
    canRaise(amountToRaise: number): boolean {
        const isNextPlayer = this.canAct();
        return isNextPlayer && amountToRaise > 0 && Web3StateInstance.cachedBoard.playerStacks[this.playerIndex()].gte(amountToRaise);
    },
    amountToCall(): number {
        const highestBet: number = this.getHighestBest();
        const myBet = Web3StateInstance.cachedBoard.playerBets[this.playerIndex()];
        if (!myBet) {
            return 0;
        }
        return highestBet - Web3StateInstance.cachedBoard.playerBets[this.playerIndex()].toNumber();
    },
    smallBlindIndex(): number {
        return this.nextActivePlayerIndex(0);
    },
    bigBlindIndex(): number {
        return this.nextActivePlayerIndex(this.smallBlindIndex());
    },
    getPlayersInPotBets(): BigNumber[] {
        // TODO: POT FOLD FIX
        return Web3StateInstance.cachedBoard.playerBets.filter((p, i) => true/*Web3StateInstance.cachedBoard.playersInPot[i]*/);
    },
    getHighestBest(): number {
        return Math.max(...Web3StateInstance.cachedBoard.playerBets.map(b => b.toNumber()))
    },
    cardIndicesToHand(arr: Array<BigNumber>): Hand {
        // invalid when actual codes are not set 
        if (Web3StateInstance.cardValues.length < 104) {
            return [];
        }
        const convertCardCodeToCard = (cardIndice: BigNumber) => {
            const actualCode = Web3StateInstance.cardValues[cardIndice.toNumber()].toNumber() - 1;
            return CardInfo.card(allRanks[actualCode % allRanks.length], allSuits[Math.floor(actualCode % allSuits.length)]);
        };
        return arr.map(convertCardCodeToCard);
    },
    nextActivePlayerIndex(index: number): number {
        for (let i = (index + 1) % Web3StateInstance.cachedBoard.playerAddresses.length;
                i !== index;
                (i + 1) % Web3StateInstance.cachedBoard.playerAddresses.length) {
            
            // TODO: POT FOLD FIX
            //if (Web3StateInstance.cachedBoard.playersInPot[i]) {
                return i;
            //}
        }
        throw new Error("Impossible error");
    },
    isInRevealPhase(): boolean {
        return [
            Web3GameStage.PreFlopReveal, 
            Web3GameStage.FlopReveal,
            Web3GameStage.TurnReveal,
            Web3GameStage.RiverReveal,
            Web3GameStage.PostRound,
        ].indexOf(Web3StateInstance.cachedBoard.stage) !== -1;
    },
    isBetRound(): boolean {
        return [
            Web3GameStage.FlopBet, 
            Web3GameStage.TurnBet,
            Web3GameStage.RiverBet,
            Web3GameStage.PreFlopBet,
        ].indexOf(Web3StateInstance.cachedBoard.stage) !== -1;
    }
};

export type Web3State = {
    boardManager: Web3BoardManager | undefined,
    cachedBoard: Board,
    localState: typeof Web3LocalState,
    playerAddress: string | undefined,
    isInGame: boolean,
    cardValues: BigNumber[],
    revealUnlocks: {
        [cardIndex: number]: number;
    }
};
export const Web3StateInstance: Web3State = {
    cardValues: [],
    boardManager: undefined,
    localState: Web3LocalState,
    revealUnlocks: {},
    // to get rid of ugly ?. and !.
    cachedBoard: {
        bigBlindSize: BigNumber.from(0),
        communityCards: [],
        nextPlayerToPlay: BigNumber.from(0),
        playerAddresses: [],
        playerBets: [],
        playerHands: [],
        playerStacks: [],
        playerInPots: [],
        playersDoneForCurrentStage: [],
        dealerIndex: BigNumber.from(0),
        potSize: BigNumber.from(0),
        requiredPlayers: BigNumber.from(0),
        stage: 0,
        winner: '',
    },
    playerAddress: undefined,
    isInGame: false,
};
