import { Board, PlayerAddress } from "./boardApi";

export type JoinGameRequest = {
    playerAddress: PlayerAddress
};
export type JoinGameResponse = {
    playerIndex: number
};

export type RefreshGameRequest = {
    playerAddress: string
};
export type RefreshGameResponse = Board;

// This takes care of check, call and raise depending on the amount send (0 for check, matching bet for call, more for raise)
export type SendBetRequest = {
    playerAddress: PlayerAddress,
    amountToBet: number
};
export type SendBetResponse = {
};

export type FoldRequest = {
    playerAddress: PlayerAddress
};
export type FoldResponse = {
};
