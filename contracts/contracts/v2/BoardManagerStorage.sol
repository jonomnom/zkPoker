// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

enum GameStage {
    Uncreated,
    GatheringPlayers,
    Shuffle,
    PreFlop, // in pre-flop, every gets 2 cards, and everyone must provide proofs
    PreFlopBet,
    Flop, // in flop, everyone must provide proofs for community cards
    FlopBet,
    Turn, // need reveal
    TurnBet,
    River, // need reveal
    RiverBet,
    PostRound, // waiting to announce winner
    Ended
}

enum Rank {
    Spades, 
    Hearts,
    Diamonds,
    Clubs
}

// example: 
// card value: 50
// card info: rank: 50 / 13 = 3 (Clubs), value: 50 % 13 = 11 (2,3,4,5,6,7,8,9,j,>>Q<<,k,a)
struct CardInfo {
    Rank rank;
    uint256 value;
}

// the board state
struct Board {
    // the current game status
    GameStage stage;

    // player infos
    address[] playerAddresses;
    uint256[][] playerHands;
    uint256[] playerBets;
    uint256[] playerStacks;
    bool[] playersDoneForCurrentStage;
    bool[] playerInPots;

    uint256[] communityCards;

    // next player index to player
    uint256 nextPlayerToPlay;

    uint256 dealerIndex;

    uint256 bigBlindSize;

    // zero address before game ends
    address winner;

    // the required amount of players for this board
    uint256 requiredPlayers;

    // total stack in the pot
    uint256 potSize;
}
