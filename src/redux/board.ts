import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Board, BoardStateManager, Currency, createBoard } from '../connection/boardApi';
import { RefreshGameRequest, SendBetRequest } from '../connection/messageTypes';
import { ReduxRootState } from './rootstore';


type PlayerPayload = { playerIndex: number };
type RaisePayload = PlayerPayload & { amountToRaise: Currency };


export const SERVER_URL = "http://localhost:3333";

export const boardThunks = {
    refreshBoard: createAsyncThunk<Board, string>(
        'board/refreshBoard',
        async (playerAddress: string, thunkAPI) =>  {
        console.log("Refreshing board");
        const response = await fetch(`${SERVER_URL}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ playerAddress } as RefreshGameRequest)
        });
        return response.json();
    }),
    check: createAsyncThunk<void, PlayerPayload>(
        'board/check',
        async (payload: PlayerPayload, thunkAPI) => {
        const state = thunkAPI.getState() as ReduxRootState;
        const payloadToSend: SendBetRequest = {
            playerAddress: state.board.playerAddresses[payload.playerIndex],
            amountToBet: 0
        };
        const response = await fetch(`${SERVER_URL}/send-bet`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(payloadToSend)
        });
        return response.json();
    }),
    call: createAsyncThunk<void, PlayerPayload>(
        'board/call',
        async (payload: PlayerPayload, thunkAPI) => {
        const state = thunkAPI.getState() as ReduxRootState;
        const betToMatch = BoardStateManager.getHighestBest(state.board);
        const betToPlace = betToMatch - state.board.playerBets[payload.playerIndex];
        const payloadToSend: SendBetRequest = {
            playerAddress: state.board.playerAddresses[payload.playerIndex],
            amountToBet: betToPlace
        };
        console.log("payloaaad", payloadToSend);
        const response = await fetch(`${SERVER_URL}/send-bet`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(payloadToSend)
        });
        return response.json();
    }),
    raise: createAsyncThunk<void, RaisePayload>(
        'board/raise',
        async (payload: RaisePayload, thunkAPI) => {
        const state = thunkAPI.getState() as ReduxRootState;
        const payloadToSend: SendBetRequest = {
            playerAddress: state.board.playerAddresses[payload.playerIndex],
            amountToBet: payload.amountToRaise
        };
        const response = await fetch(`${SERVER_URL}/send-bet`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(payloadToSend)
        });
        return response.json();
    }),
    fold: createAsyncThunk<Board, PlayerPayload>(
        'board/fold',
        async (payload: PlayerPayload, thunkAPI) =>  {
        const state = thunkAPI.getState() as ReduxRootState;
        const payloadToSend: RefreshGameRequest = {
            playerAddress: state.board.playerAddresses[payload.playerIndex],
        };
        const response = await fetch(`${SERVER_URL}/fold`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(payloadToSend)
        });
        return response.json();
    }),
};

const boardSlice = createSlice({
    name: "board",
    initialState: createBoard(),
    reducers: {
        updateBoardState(state, action: PayloadAction<Board>) {
            state = action.payload;
        },
        raise(state, action: PayloadAction<RaisePayload>) {
            BoardStateManager.raise(state, action.payload.playerIndex, action.payload.amountToRaise);
        },
        check(state, action: PayloadAction<PlayerPayload>) {
            BoardStateManager.endTurn(state);
        },
        call(state, action: PayloadAction<PlayerPayload>) {
            BoardStateManager.call(state, action.payload.playerIndex);
        },
        fold(state, action: PayloadAction<PlayerPayload>) {
            BoardStateManager.fold(state, action.payload.playerIndex);
        },
        startRound(state, action: PayloadAction<number>) {
            BoardStateManager.randomizeRound(state, action.payload);
        },
        dealFlop(state) {
            BoardStateManager.dealFlop(state);
        },
        dealTurn(state) {
            BoardStateManager.dealTurn(state);
        },
        dealRiver(state) {
            BoardStateManager.dealRiver(state);
        },
    },
    extraReducers: (builder) => {
        // Add reducers for additional action types here, and handle loading state as needed
        builder.addCase(boardThunks.refreshBoard.fulfilled, (state, action: PayloadAction<Board>) => {
            console.log("Received new board data");
            if (!action.payload) {
                return;
            }
            // Don't set the entire object as React won't pick up the change, do it key by key
            for (let key in action.payload) {
                (state as any)[key] = (action.payload as any)[key];
            }
        });
    },
});

export const boardSelectors = {
    isOnSmallBlind: (state: Board, playerIndex: number): boolean => BoardStateManager.smallBlindIndex(state) === playerIndex,
    isOnBigBlind: (state: Board, playerIndex: number): boolean => BoardStateManager.bigBlindIndex(state) === playerIndex,
    isDealer: (state: Board, playerIndex: number): boolean => state.dealerIndex === playerIndex,
    canAct: (state: Board, playerIndex: number): boolean => state.nextPlayerToPlay === playerIndex,
    canCheck: (state: Board, playerIndex: number): boolean => {
        const highestBet: Currency = Math.max(...state.playerBets);
        return state.nextPlayerToPlay === playerIndex && BoardStateManager.getPlayersInPotBets(state).every(bet => bet === highestBet);
    },
    canFold: (state: Board, playerIndex: number): boolean => {
        const highestBet: Currency = Math.max(...state.playerBets);
        return state.nextPlayerToPlay === playerIndex && BoardStateManager.getPlayersInPotBets(state).every(bet => bet === highestBet);
    },
    canRaise: (state: Board, playerIndex: number, amountToRaise: Currency): boolean => {
        return state.nextPlayerToPlay === playerIndex && amountToRaise > 0 && state.playerStacks[playerIndex] >= amountToRaise;
    },
    amountToCall: (state: Board, playerIndex: number): Currency => {
        const highestBet: Currency = Math.max(...state.playerBets);
        return highestBet - state.playerBets[playerIndex];
    },
}

// canRaise,canCheck,canFold
// manage state
// build UI

export default boardSlice;
