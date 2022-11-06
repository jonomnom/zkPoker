import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Card } from '../connection/cardInfo';
import { JoinGameRequest, JoinGameResponse } from '../connection/messageTypes';
import { PlayerAddress } from "../connection/boardApi";
import { SERVER_URL } from './board';
import { ReduxRootState } from './rootstore';

export type PlayerState = {
    address: PlayerAddress;
    index: number;
    waitingForGame: boolean
};

const randomHex = (length: number) => [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const createPlayer = () => {
    return {
        address: randomHex(16),
        index: 0,
        waitingForGame: false
    };
};

const initialState: PlayerState = createPlayer();


export const playerThunks = {
    joinGame: createAsyncThunk(
        'player/joinGame',
        async (_, thunkAPI) =>  {
        const playerAddress = (thunkAPI.getState() as ReduxRootState).player.address;
        console.log(`Sending request to ${SERVER_URL}/join with param <${playerAddress}>`);
        const response = await fetch(`${SERVER_URL}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ playerAddress } as JoinGameRequest)
        });
        return response.json();
    })
};
const playerSlice = createSlice({
    name: "player",
    initialState,
    reducers: {
        updateIndex(state, action: PayloadAction<number>) {
            state.index = action.payload;
        }
    },
    extraReducers: (builder) => {
      // Add reducers for additional action types here, and handle loading state as needed
      builder.addCase(playerThunks.joinGame.fulfilled, (state, action: PayloadAction<JoinGameResponse>) => {
            state.index = action.payload.playerIndex;
            state.waitingForGame = true;
            console.log(`Joining game was successful!. Player will use index <${state.index}`);
      })
    },
});

export default playerSlice;
