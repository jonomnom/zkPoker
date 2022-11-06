// interactively play the mental poker game

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { artifacts, ethers, waffle } from 'hardhat';
import { MentalPokerGame, Verifier } from '../types';
import { listenForGameStatusUpdated, listenForPlayerRegister, openCard, provideCardDrawingProof, shuffleDeck } from './contractUtils';
import { BigNumber } from 'ethers';
import { Actions, interactiveLoop } from './interactiveLoop';

enum GameStatus {
    UNSET,
    SET_AND_UNSTARTED,
    STARTED,
    ALL_SHUFFLED,
    ALL_DRAWN_CARD,
    ALL_OPENED_CARD,
    ENDED,
}

const GameStatusMap: {
    [k: number]: string
} = {
    [GameStatus.UNSET]: 'Not setup',
    [GameStatus.SET_AND_UNSTARTED]: 'Setup, not started',
    [GameStatus.STARTED]: 'Started, waiting for everyone shuffle the deck',
    [GameStatus.ALL_SHUFFLED]: 'All players shuffled, waiting for everyone provide the card proofs',
    [GameStatus.ALL_DRAWN_CARD]: 'All players provided the card proofs, waiting for everyone open their cards',
    [GameStatus.ALL_OPENED_CARD]: 'All players open their cards',
    [GameStatus.ENDED]: 'Ended'
}

const PlayerStatusMap: {
    [k: number]: string
} = {
    0: 'Not shuffled yet',
    1: 'Shuffled, not provided card proof for others yet',
    2: 'Card proofs provided, not opened card yet',
    3: 'Card opened',
    4: 'Ended'
}

let roundId = BigNumber.from(0);


const log = (...args: any[]) => {
    console.log(`[Round: ${roundId}]:`, ...args);
}

const main = async () => {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const pokerArtifact = await artifacts.readArtifact('MentalPokerGame');
    const verifierArtifact = await artifacts.readArtifact('Verifier');
    const pokerGame = <MentalPokerGame>await ethers.getContractAtFromArtifact(pokerArtifact, '{{pokerGameLocal}}');
    const verifier = <Verifier>await ethers.getContractAtFromArtifact(verifierArtifact, '{{verifierLocal}}');
    const player = signers[2];

    roundId = await pokerGame.currentRoundId();
    const {
        playerInfos,
    } = await pokerGame.getGameInfo();
    log(`My address: ${player.address}, joined players: ${playerInfos.length}`);

    listenForPlayerRegister(pokerGame, async (addr: string, name: string) => {
        log(`Player joined, address: ${addr}`);
        const {
            playerInfos,
        } = await pokerGame.getGameInfo();
        const max = await pokerGame.maxPlayerPerRound();
        console.log(`Total joined user: ${playerInfos.length}, still need ${max.toNumber() - playerInfos.length}`)
    });

    listenForGameStatusUpdated(pokerGame, async (
        roundId: BigNumber, status: number
    ) => {
        console.log(`Game status updated: ${GameStatusMap[status]}`);
    });

    await interactiveLoop(async (action: Actions) => {
        switch (action) {
            case Actions.REGISTER: {
                log(`Registering your to the game.`);
                await pokerGame.connect(player).registerPlayer('bob');
                // test
                // await pokerGame.connect(player1).registerPlayer('dylan');
                break;
            }
            case Actions.SHUFFLE: {
                log(`Shuffling deck.`);
                await shuffleDeck(pokerGame, verifier, roundId, player);
                // test
                // await shuffleDeck(pokerGame, verifier, roundId, player1);
                log(`Done shuffling deck.`);
                break;
            }
            case Actions.PROVIDE_DRAW_PROOF: {
                log(`Providing card drawing proofs for all other players.`);
                const {
                    playerInfos
                } = await pokerGame.getGameInfo();
                await provideCardDrawingProof(pokerGame, verifier, roundId, playerInfos.map(info => info.addr), player);
                // test
                // await provideCardDrawingProof(pokerGame, verifier, roundId, playerInfos.map(info => info.addr), player1);
                log(`Done providing proofs.`);
                break;
            }
            case Actions.OPEN_CARD: {
                log(`Every open card.`);
                await openCard(pokerGame, verifier, roundId, player);
                // test
                // await openCard(pokerGame, verifier, roundId, player1);
                log(`Done open card.`);
                break;
            }
            case Actions.CHECK_WINNER: {
                log(`Check winner.`);
                const [value, winner] = await pokerGame.compete();
                log(`${winner} won with card ${value.toString()}`);
                break;
            }
            case Actions.GAME_INFO: {
                const {
                    roundId,
                    playerInfos,
                    gameStatus
                } = await pokerGame.getGameInfo();
                const playerInfoStr = playerInfos.map(info => {
                    return `${info.name} - ${PlayerStatusMap[info.status]}`
                }).join('\n')
                console.log(`Current game round: ${roundId}\n Game status: ${GameStatusMap[gameStatus]} \n There are ${playerInfos.length} players:\n ${playerInfoStr}`);
            }
            default:
                return;
        }
    });
}

main();

