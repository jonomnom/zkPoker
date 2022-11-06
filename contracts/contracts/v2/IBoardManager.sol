// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./BoardManagerStorage.sol";
import "./Verifier.sol";


interface IBoardManager {
    // ========================== Events ==========================
    event BoardCreated(address indexed creator);
    event BoardRefreshed(address indexed refresher);
    event JoinedBoard(address indexed player);
    event Checked(address indexed checker);
    event Raised(address indexed raiser);
    event Called(address indexed caller);
    event Folded(address indexed folder);
    event NextPlayer(uint256 indexed playerIndex);
    event GameStageChanged(GameStage indexed stage);
    event StackRequested(address indexed requester);

    event DeckShuffled(address indexed player);
    event RevealProofProvided(
        address indexed sender,
        uint256 indexed cardIndex);
    event BatchRevealProofProvided(
        address indexed sender,
        uint256 indexed cardCount);

    // ========================== Public ==========================
    // create a board for a new game, reverts when
    // - the current board is not ended yet
    // - parameter checking fails
    function createBoard(uint256 requiredPlayers, uint256 bigBlindSize) external;

    // simply going to the next board, for dev purpose, anyone can call it
    function refreshBoard() external;
    
    // player call this function to join the created board, reverts when
    // - user has joined
    // - board players reach the limit
    function joinBoard() external returns (uint256 playerIndex);

    // player call this function to check, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't check according to the game logic
    // - game stage mismatch
    function check() external;

    // player call this function to raise, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't raise according to the game logic
    // - game stage mismatch
    function raise(uint256 amount) external;

    // player call this function to call, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't call according to the game logic
    // - game stage mismatch
    function call(uint256 amount) external;

    // player call this function to fold, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't fold according to the game logic
    // - game stage mismatch
    function fold() external;
    

    // everyone needs to shuffle the deck in order of joining, fails when
    // - user who's not his turn calls this func
    // - user shuffle twice
    // - proof verification fails
    function shuffleDeck(ShuffleProof calldata proof) external;

    // everyone needs to provide the reveal proof to reveal a specific card of the deck, fails when
    // - user who's not his turn calls this func
    // - user provide for that card twice
    // - proof verification fails
    function provideRevealProof(RevealProof[] calldata proof) external;

    // call this function the contract will calculate the hands of all players and save the winner
    // also transfers all the bets on the table to the winner
    function announceWinner() external returns (address winner, uint256 highestScore);

    // dev purpose, request test stack for playing, will send 1000 stack to the called
    function requestStack() external;

    // ========================== View functions ==========================
    function getShuffleProof() external view returns (ShuffleProof memory);
    function getRevealProofs(uint256[] memory cardIndexes) external view returns (RevealProof[] memory);

    function canCall(address player, uint256 amount) external view returns (bool);
    function canRaise(address player, uint256 amount) external view returns (bool);  
    function canCheck(address player) external view returns (bool);  
    function canFold(address player) external view returns (bool);
    
    function amountToCall() external view returns (uint256);  
    function smallBlindSize() external view returns (uint256);
}
