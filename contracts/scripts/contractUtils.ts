import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { MentalPokerGame, Verifier } from "../types";
import { DrawProofStruct } from "../types/contracts/MentalPokerGame";

// test
const randomCard = () => {
    return Math.ceil(Math.random() * 52);
}


export const listenForPlayerRegister = (contract: MentalPokerGame, handle: any) => {
    const filter = contract.filters.PlayerRegistered();
    contract.on(filter, handle);
}


export const listenForGameStatusUpdated = (contract: MentalPokerGame, handle: any) => {
    const filter = contract.filters.GameStatusUpdated();
    contract.on(filter, handle);
}

export const listenForDeckShuffled = (contract: MentalPokerGame, handle: any) => {
    const filter = contract.filters.DeckShuffled();
    contract.on(filter, handle);
}

export const shuffleDeck = async (contract: MentalPokerGame, verifier: Verifier, roundId: BigNumber, signer: SignerWithAddress) => {
    const { proof, nextDeck: currentDeck } = await verifier.getShuffleProof(roundId);
    /**
     * todo: calculate proof and next deck here
     * ......
     * .....
     */
    console.log(`[Round: ${roundId}] Fetched current proof from contract`);
    const fakeProof = proof;
    const fakeNextDeck = currentDeck;
    await contract.connect(signer).shuffleDeck({
        proof: fakeProof,
        nextDeck: fakeNextDeck,
    });
}

export const provideCardDrawingProof = async (contract: MentalPokerGame, verifier: Verifier, roundId: BigNumber, playerAddresses: string[], signer: SignerWithAddress) => {
    // const { proof, nextDeck: currentDeck } = await verifier.getDrawProof(roundId);
    /**
     * todo: calculate proof and next deck here
     * ......
     * .....
     */
    const fakeProof: [BigNumber, BigNumber] = [BigNumber.from(0), BigNumber.from(0)];
    // calculate indexes
    const others = playerAddresses.filter((player: string) => player !== signer.address);
    const indexes = others.map(other => playerAddresses.findIndex(player => player === other));
    const batchProofs: DrawProofStruct[] = Array.from({ length: playerAddresses.length - 1 }).map(() => {
        return {
            proof: fakeProof,
            originalCard: BigNumber.from(randomCard()),
            decryptedCard: BigNumber.from(randomCard())
        }
    });
    console.log(`[Round: ${roundId}] Providing proofs for players: ${indexes.join(', ')}`);
    await contract.connect(signer).batchProvideDrawCardProof(batchProofs, indexes);
}


export const openCard = async (contract: MentalPokerGame, verifier: Verifier, roundId: BigNumber, signer: SignerWithAddress) => {
    // const { proof, nextDeck: currentDeck } = await verifier.getShuffleProof(roundId);
    /**
     * todo: calculate proof and next deck here
     * ......
     * .....
     */
    console.log(`[Round: ${roundId}] Opening card`);
    const fakeProof: [BigNumber, BigNumber] = [BigNumber.from(0), BigNumber.from(0)];
    await contract.connect(signer).openCard({
        proof: fakeProof,
        originalCard: BigNumber.from(randomCard()),
        decryptedCard: BigNumber.from(randomCard())
    });
}




