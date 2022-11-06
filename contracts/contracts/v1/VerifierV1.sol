// SPDX-License-Identifier: MIT

/**
 * This contract contain all the cryptographic logic
 * todo: add onlyGame modifier for verification functions
 */
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/access/Ownable.sol";

struct Deck {
    uint256[52] cards;
}

struct ShuffleProof {
    uint256[2] proof;
    Deck nextDeck;
}

struct DrawProof {
    uint256[2] proof;
    uint256 originalCard;
    uint256 decryptedCard;
}

contract VerifierV1 is Ownable {
    // ========================== data fields ==========================
    uint256 public constant TOTAL_CARD_NUMBER = 52;
    // key: roundId
    mapping(uint256 => ShuffleProof) public shuffleProofs;

    // key: keccak(target + roundId)
    mapping(bytes32 => DrawProof) public drawProofs;

    address public game;

    // ========================== Events ==========================

    event Setup(uint256 indexed roundId);

    event ShuffleProofVerified(address indexed sender, uint256 indexed roundId);

    event DrawProofVerified(
        address indexed sender,
        address indexed target,
        uint256 indexed roundId
    );

    // ========================== Modifier ==========================
    modifier onlyGame() {
        require(msg.sender == game, "only game");
        _;
    }

    // ========================== public functions ==========================

    function setGame(address game_) external onlyOwner {
        game = game_;
    }

    function getShuffleProof(uint256 roundId)
        public
        view
        returns (ShuffleProof memory)
    {
        return shuffleProofs[roundId];
    }

    function getDrawProof(address user, uint256 roundId)
        public
        view
        returns (DrawProof memory)
    {
        bytes32 k = keccak256(abi.encode(user, roundId));
        return drawProofs[k];
    }

    function setup(uint256 roundId) external onlyGame returns (bool) {
        // set the initial proof and deck for this round
        uint256[2] memory proof;
        uint256[TOTAL_CARD_NUMBER] memory cards;
        // cards are inited with 1,2,3,...
        for (uint256 i = 0; i < TOTAL_CARD_NUMBER; i++) {
            cards[i] = i + 1;
        }
        shuffleProofs[roundId] = ShuffleProof({
            proof: proof,
            nextDeck: Deck({cards: cards})
        });

        bytes32 k = keccak256(abi.encode(address(0), roundId));
        drawProofs[k] = DrawProof({
            proof: proof,
            originalCard: 0,
            decryptedCard: 0
        });

        return true;
    }

    // verify shuffle proof with the last saved deck, and going on
    function verifyShuffleAndSave(ShuffleProof calldata proof, uint256 roundId)
        external
        onlyGame
        returns (bool)
    {
        // todo: skipped the actual developing-expensive proof verification

        // verifyShuffle(proof, last);

        // save
        shuffleProofs[roundId] = proof;
        emit ShuffleProofVerified(msg.sender, roundId);
        return true;
    }

    //
    function verifyDrawnAndSave(
        DrawProof calldata proof,
        address target,
        uint256 roundId
    ) external onlyGame returns (bool) {
        // todo: skipped the actual developing-expensive proof verification

        // verifyDrawn(proof, last);

        // save
        bytes32 k = keccak256(abi.encode(target, roundId));
        drawProofs[k] = proof;
        emit DrawProofVerified(msg.sender, target, roundId);
        return true;
    }

    // ========================== internals ==========================
}
