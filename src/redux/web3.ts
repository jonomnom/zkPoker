import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Web3State = {
    fakeStateToTriggerRerender: number
};
const initialState: Web3State = { fakeStateToTriggerRerender: 0 };

const web3Slice = createSlice({
    name: "web3",
    initialState,
    reducers: {
        rerender(state, action: PayloadAction) {
            state.fakeStateToTriggerRerender++;
        }
    },
});

export default web3Slice;
