import React, { useRef } from 'react';
import { Hand } from "../../connection/boardApi";
import './gameControls.css';
import pokersolver from "pokersolver";
import Avatars from '../../connection/avatars';
import { BigNumber } from 'ethers';
import { Web3GameStage } from '../useGameContract';
import { useAppSelector } from '../../redux/hooks';
import { Web3StateInstance } from '../web3LocalState';
import { decrypt, pk, pkArray, readFileInWeb, samplePermutation, shuffleEncrypt, skArray } from '../../prover/prover';
import { R } from '../../prover/constant';


function GameControls() {
    useAppSelector(state => state.web3.fakeStateToTriggerRerender);
    const playerIndex = Web3StateInstance.localState.playerIndex();
    const raiseInputRef: React.Ref<HTMLInputElement> = useRef<HTMLInputElement>(null);

    if (playerIndex === -1) {
        Web3StateInstance.isInGame = false;
        if (Web3StateInstance.cachedBoard.stage > Web3GameStage.GatheringPlayers) {
            return <div>You haven't joined the game!</div>
        }
    }

    const createGame = async () => {
        Web3StateInstance.boardManager?.createBoard(BigNumber.from(3), BigNumber.from(100));
    }
    const joinGame = () => {
        readFileInWeb()
        if (!Web3StateInstance.isInGame) {
            Web3StateInstance.boardManager?.joinBoard();
        }
    };

    // when not board created, create one
    if (Web3StateInstance.cachedBoard?.stage === Web3GameStage.Uncreated) {
        return (
            <div className="game-controls">
                <button onClick={createGame}>Create game</button>
            </div>
        );
    }


    if (Web3StateInstance.cachedBoard?.stage === Web3GameStage.GatheringPlayers) {
        return (
            <div className="game-controls">
                <button onClick={joinGame}>
                    {Web3StateInstance.isInGame ? 'Joined' : 'Join game'}
                </button>
                {Web3StateInstance.isInGame && <p>Still need {
                    Web3StateInstance.cachedBoard.requiredPlayers.sub(Web3StateInstance.cachedBoard.playerAddresses.length).toNumber()} players to join.</p>}
            </div>
        );
    }

    const canCheck = Web3StateInstance.localState.canCheck();
    const canRaise = Web3StateInstance.localState.canRaise(100);
    const isActive = Web3StateInstance.localState.canAct();
    const winnerIndex = Web3StateInstance.cachedBoard.playerAddresses.indexOf(Web3StateInstance.cachedBoard.winner);
    const potSize = Web3StateInstance.cachedBoard.potSize.toNumber();
    const amountToCall = Web3StateInstance.localState.amountToCall();
    const smallBlindSize = Web3StateInstance.cachedBoard.bigBlindSize.toNumber() / 2;
    const inRevealPhase = Web3StateInstance.localState.isInRevealPhase();
    const isBetRound = Web3StateInstance.localState.isBetRound();
    const playerStack = Web3StateInstance.cachedBoard.playerStacks[playerIndex].toNumber();
    const playerHand: Hand | undefined = Web3StateInstance.localState.cardIndicesToHand(
        Web3StateInstance.cachedBoard.playerHands[playerIndex]
    );
    const communityHand: Hand = Web3StateInstance.localState.cardIndicesToHand(
        Web3StateInstance.cachedBoard.communityCards
    );

    const shuffleDeck = async () => {
        if (Web3StateInstance.boardManager) {
            // prover generate shuffle proof
            const proof = await Web3StateInstance.boardManager.getShuffleProof();
            // const A = samplePermutation(52);
            // const enc_proof = await shuffleEncrypt(A, proof.deck, R, pk);
            //await Web3StateInstance.boardManager?.shuffleDeck(enc_proof);
            await Web3StateInstance.boardManager?.shuffleDeck(proof);
        }
    };
    if (Web3StateInstance.cachedBoard?.stage === Web3GameStage.Shuffle) {
        const mystyle = {
            marginLeft: "2px",
            width: "10em",
            fontSize: "18px",
        };
        return (
            <div className="game-controls">
                Wait for everyone to shuffle the deck.
                {
                    isActive &&
                    <span>Your turn to shuffle!</span>
                }
                <button onClick={shuffleDeck} style={mystyle}>{`Shuffle Deck ${playerIndex+1} / 3`}</button>
            </div>
        );
    }



    const callOrCheck = () => {
        if (canCheck) {
            Web3StateInstance.boardManager?.check();
        } else {
            Web3StateInstance.boardManager?.call(BigNumber.from(Web3StateInstance.localState.amountToCall()));
        }
    };

    const raise = () => {
        const amountToRaise = raiseInputRef.current?.value || 0;
        Web3StateInstance.boardManager?.raise(BigNumber.from(amountToRaise));
    };
    const fold = () => {
        Web3StateInstance.boardManager?.fold();
    };
    // 
    const revealCards = async () => {
        let cardIndices: Array<BigNumber> = [];
        console.log('======');
        switch (Web3StateInstance.cachedBoard.stage) {
            // fetch the card needs to be decrypted, player hands hold the indexes of the cards, which are
            // already in the range of [53, 103]
            case Web3GameStage.PreFlopReveal: {
                const othersHands = Web3StateInstance.cachedBoard.playerHands.reduce((all: BigNumber[], hand: BigNumber[], index) => {
                    if (index !== Web3StateInstance.localState.playerIndex()) {
                        return [...all, ...hand];
                    }
                    return all;
                }, [])
                cardIndices = [...othersHands];
                break;
            }
            // provide proofs for current 3 community cards
            case Web3GameStage.FlopReveal: {
                console.log(`Providing proofs, flop community cards:`, Web3StateInstance.cachedBoard.communityCards);
                cardIndices = [...Web3StateInstance.cachedBoard.communityCards];
                break;
            }
            case Web3GameStage.TurnReveal: {
                console.log(`Providing proofs, turn community cards:`, Web3StateInstance.cachedBoard.communityCards);
                cardIndices = [...Web3StateInstance.cachedBoard.communityCards];
                break;
            }
            case Web3GameStage.RiverReveal: {
                console.log(`Providing proofs, river community cards:`, Web3StateInstance.cachedBoard.communityCards);
                cardIndices = [...Web3StateInstance.cachedBoard.communityCards];
                break;
            }
            case Web3GameStage.PostRound: {
                const myHand = Web3StateInstance.cachedBoard.playerHands[playerIndex];
                console.log(`Providing proofs for my hand:`, myHand);
                cardIndices = [...myHand];
                break;
            }
            default:
                break;
        }
        if (!Web3StateInstance.boardManager) {
            console.log('board manager not ready');
            return;
        }

        const currentCardProofs = await Web3StateInstance.boardManager.getRevealProofs(cardIndices);

        //prover generate decrypt proof : TODO
        // const Y = currentCardProofs
        // const proof = decrypt(Y, skArray[0], pkArray[0])

        await Web3StateInstance.boardManager.provideRevealProof(currentCardProofs, cardIndices);
    }

    if (inRevealPhase) {
        const displayText = () => {
            if (Web3StateInstance.cachedBoard?.stage === Web3GameStage.RiverReveal) {
                return `Show Hand ${playerIndex+1} / 3`
            } else {
                return `Reveal ${playerIndex+1} / 3`
            }
        }
        return <div className="game-controls">
            <button disabled={!isActive || !inRevealPhase} onClick={revealCards}>{displayText()}</button>
        </div>
    }


    if (isBetRound) {
        return (
            <div className="game-controls">
                <input className="raise-input-range" type="range" ref={raiseInputRef} name="raise-input"
                    min={amountToCall} max={playerStack} defaultValue={amountToCall} step={smallBlindSize}
                />
                <label className="raise-input-label" htmlFor="raise-input">Raise with ${raiseInputRef.current?.valueAsNumber}</label>
                <br />
                <button disabled={!isActive} onClick={callOrCheck}> {canCheck ? "Check" : "Call"} </button>
                <button disabled={!isActive || !canRaise} onClick={raise}>Raise</button>
                <button disabled={!isActive} onClick={fold}>Fold</button>
                <div style={{ display: playerHand ? "block" : "none" }}
                    className="hand-visualizer">
                    I'm currently holding a: <span>{playerHand && playerHand.length && pokersolver.Hand.solve([...communityHand, ...playerHand]).descr}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="game-controls">
            {
                <div className="winner">
                    [{Avatars[winnerIndex]}] won the game and took the pot of ${potSize}! <br />
                </div>
            }
        </div>
    )

}

export default GameControls;
