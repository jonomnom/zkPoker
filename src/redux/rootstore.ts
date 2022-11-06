import { configureStore } from '@reduxjs/toolkit'

import boardSlice from "./board";
import playerSlice from './player';
import web3Slice from './web3';

const reduxRootStore = configureStore({
    reducer: {
        board: boardSlice.reducer,
        player: playerSlice.reducer,
        web3: web3Slice.reducer
    }
});

export default reduxRootStore;
export type ReduxRootState = ReturnType<typeof reduxRootStore.getState>;
export type AppDispatch = typeof reduxRootStore.dispatch

