// SPDX-License-Identifier: MIT

/**
 * This contract contain all the cryptographic logic
 */
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BoardManagerStorage.sol";


import "./encrypt_verifier.sol";
import "./decrypt_verifier.sol";
interface IEncryptVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[209] memory input
    ) external view;
}

interface IDEcryptVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[4] memory input
    ) external view;
}

struct ShuffleProof {
    uint256[8] proof;
    uint256[104] deck;
}

struct RevealProof {
    uint256[8] proof;
    // 1st is the card value, 2nd and 3rd is the Y, 4th is the personal public key.
    uint256[4] card;
}

contract Verifier is Ownable {
    // ========================== data fields ==========================
    ShuffleProof private shuffleProof;
    uint pk;

    // key: cardIndex
    mapping(uint256 => RevealProof) revealProofs;

    address public game;

    // ========================== Events ==========================

    event Setup();

    IEncryptVerifier public encrypt_verifier;
    IDEcryptVerifier public decrypt_verifier;

    constructor(
        IEncryptVerifier encrypt_verifier_, 
        IDEcryptVerifier decrypt_verifier_
    ) {
        encrypt_verifier = encrypt_verifier_;
        decrypt_verifier = decrypt_verifier_;
    }

    function getShuffleProof() public view returns (ShuffleProof memory) {
        return shuffleProof;
    }

    function getRevealProof(uint256 cardIndex)
        public
        view
        returns (RevealProof memory)
    {
        return revealProofs[cardIndex];
    }

    function setupPK(uint256 pk_) external {
        pk = pk_;
    }

    function setup(uint256[104] calldata startingDeck) external returns (bool) {
        // set the initial proof and deck for this round
        uint256[8] memory proof = [
            uint256(0), uint256(0),
            uint256(0), uint256(0),
            uint256(0), uint256(0),
            uint256(0), uint256(0)
        ];
        shuffleProof = ShuffleProof({proof: proof, deck: startingDeck});

        //revealProofs[0] = RevealProof({proof: proof, card: [0, pk]);

        return true;
    }

    // verify shuffle proof with the last saved deck, and going on
    function verifyShuffleAndSave(ShuffleProof calldata proof)
        external
        returns (bool)
    {
        uint[209] memory input;
        for (uint i = 0; i < 104; i++) {
            input[i] = proof.deck[i];
        }

        for (uint i = 0; i < 104; i++) {
            input[i + 104] = shuffleProof.deck[i];
        }

        input[208] = pk;

        encrypt_verifier.verifyProof(
            [proof.proof[0], proof.proof[1]],
            [[proof.proof[2], proof.proof[3]], [proof.proof[4], proof.proof[5]]],
            [proof.proof[6], proof.proof[7]],
            input
        );

        // save
        shuffleProof = proof;
        return true;
    }

    //
    function verifyRevealAndSave(
        uint256 cardStartIndex,
        RevealProof calldata proof)
        external
        returns (bool)
    {
       decrypt_verifier.verifyProof(
            [proof.proof[0], proof.proof[1]],
            [[proof.proof[2], proof.proof[3]], [proof.proof[4], proof.proof[5]]],
            [proof.proof[6], proof.proof[7]],
            proof.card
        );

        revealProofs[cardStartIndex] = proof;
        shuffleProof.deck[cardStartIndex + 52] = proof.card[0];
        return true;
    }

    // ========================== internals ==========================
}
