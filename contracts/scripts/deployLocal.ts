import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, waffle, ethers } from "hardhat";
import { Verifier, MentalPokerGame } from "../types";

export const prepare = async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const deployer = signers[0];

    let artifact = await artifacts.readArtifact('Verifier');
    const verifier = <Verifier>await waffle.deployContract(deployer, artifact, []);
    await verifier.deployed();

    // deploy contract on local testnet
    artifact = await artifacts.readArtifact('MentalPokerGame');
    const pokerGame = <MentalPokerGame>await waffle.deployContract(deployer, artifact, [verifier.address]);
    await pokerGame.deployed();

    // set game address to verifier
    await verifier.setGame(pokerGame.address);

    // init game
    await pokerGame.setupGame();
    await pokerGame.setMaxPlayerPerRound(2);

    console.log(`poker game: ${pokerGame.address}, verifier: ${verifier.address}`);

    return { pokerGame, verifier };
};

prepare();