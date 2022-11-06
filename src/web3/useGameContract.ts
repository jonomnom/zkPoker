import { BigNumber, Contract, ethers } from 'ethers';
import { useMemo } from 'react';
import { Id, toast } from 'react-toastify';
import { useAccount, useContract, useSigner } from 'wagmi';
import BoardManagerABI from '../constants/abi/BoardManager.json';
import { A, X, R } from '../prover/constant';
import VerifierABI from '../constants/abi/Verifier.json';
import { GAME_CONTRACT_ADDRESS, OP_GOERLI_CHAIN_ID, VERIFIER_CONTRACT_ADDRESS } from '../constants/contracts';
import { useAppDispatch } from '../redux/hooks';
import web3Slice from '../redux/web3';
import { Web3StateInstance } from './web3LocalState';

export enum Web3GameStage {
    Uncreated,
    GatheringPlayers,
    Shuffle,
    PreFlopReveal, // in pre-flop, every gets 2 cards, and everyone must provide proofs 
    PreFlopBet,
    FlopReveal, // in flop, everyone must provide proofs for community cards
    FlopBet,
    TurnReveal,
    TurnBet,
    RiverReveal,
    RiverBet,
    PostRound,
    Ended
}


export type ShuffleProof = {
    proof: [BigNumber, BigNumber, BigNumber, BigNumber,
            BigNumber, BigNumber, BigNumber, BigNumber];
    deck: BigNumber[];
}

export interface RevealProof {
    proof: [BigNumber, BigNumber, BigNumber, BigNumber,
            BigNumber, BigNumber, BigNumber, BigNumber];
    card: BigNumber[]; // card index
}

export interface RevealProofExt extends RevealProof {
    unlocks: BigNumber;
}

export type Board = {
    bigBlindSize: BigNumber;
    communityCards: BigNumber[];
    nextPlayerToPlay: BigNumber;
    playerAddresses: string[];
    playerBets: BigNumber[]
    playerHands: BigNumber[][];
    playerStacks: BigNumber[];
    playerInPots: boolean[];
    playersDoneForCurrentStage: boolean[];
    dealerIndex: BigNumber;
    potSize: BigNumber;
    requiredPlayers: BigNumber;
    stage: number;
    winner: string;
}


const unifiedContractCaller = async (contract: Contract, method: string, ...params: any[]) => {
    let pendingId: Id = 0;
    try {
        pendingId = toast.loading('Transaction is pending', {
            position: 'bottom-right',
            closeOnClick: true,
            theme: 'dark',
            style: {
                fontSize: '20px',
            }
        })
        const res = (await contract[method](...params));
        await res.wait();
        
        toast.success('Success', {
            position: "top-center",
        });
    } catch (e: any) {
        console.error('get error', e);
        toast.error(e.reason, {
            position: "top-center",
            style: {
                fontSize: '20px',
            }
        });
    }
    toast.dismiss(pendingId);
    
}

export const getBoardManager = (contract: Contract, verifierContract: Contract) => {
    if (!contract) {
        return null;
    }
    return {
        // create a board for a new game, reverts when
        // - the current board is not ended yet
        // - parameter checking fails
        async createBoard(requiredPlayers: BigNumber, bigBlindSize: BigNumber) {
            await unifiedContractCaller(contract, 'createBoard', requiredPlayers, bigBlindSize, X, 27);
        },

        // simply going to the next board, for dev purpose, anyone can call it
        async refreshBoard() {
            await unifiedContractCaller(contract, 'refreshBoard');
        },

        // player call this function to join the created board, reverts when
        // - user has joined
        // - board players reach the limit
        async joinBoard() {
            return unifiedContractCaller(contract, 'joinBoard');
        },

        // player call this function to check, reverts when
        // - it's not the player's turn
        // - player is not in the pot anymore
        // - player can't check according to the game logic
        // - game stage mismatch
        async check() {
            return unifiedContractCaller(contract, 'check');
        },

        // player call this function to raise, reverts when
        // - it's not the player's turn
        // - player is not in the pot anymore
        // - player can't raise according to the game logic
        // - game stage mismatch
        async raise(amount: BigNumber) {
            return unifiedContractCaller(contract, 'raise', amount);
        },
        // player call this function to call, reverts when
        // - it's not the player's turn
        // - player is not in the pot anymore
        // - player can't call according to the game logic
        // - game stage mismatch
        async call(amount: BigNumber) {
            return unifiedContractCaller(contract, 'call', amount);
        },

        // player call this function to fold, reverts when
        // - it's not the player's turn
        // - player is not in the pot anymore
        // - player can't fold according to the game logic
        // - game stage mismatch
        async fold() {
            return unifiedContractCaller(contract, 'fold');
        },

        // everyone needs to shuffle the deck in order of joining, fails when
        // - user who's not his turn calls this func
        // - user shuffle twice
        // - proof verification fails
        async shuffleDeck(proof: ShuffleProof) {
            return unifiedContractCaller(contract, 'shuffleDeck', proof);
        },

        // everyone needs to provide the reveal proof to reveal a specific card of the deck, fails when
        // - user who's not his turn calls this func
        // - user provide for that card twice
        // - proof verification fails
        async provideRevealProof(proofs: RevealProof[], cardIndexes: BigNumber[]) {
            return unifiedContractCaller(contract, 'provideRevealProof', proofs, cardIndexes);
        },

        // dev purpose, request test stack for playing, will send 1000 stack to the called
        async requestStack() {
            return unifiedContractCaller(contract, 'requestStack');
        },

        // ========================== View functions ==========================
        async board() {
            Web3StateInstance.cachedBoard = <Board>(await contract.getBoard());
            console.log(`fetching board info...`);
            return Web3StateInstance.cachedBoard;
        },
        async getShuffleProof() {
            return <ShuffleProof>contract.getShuffleProof();
        },
        async getRevealProofs(cardIndex: BigNumber[]) {
            return <RevealProof[]>contract.getRevealProofs(cardIndex);
        },

        async canCall(player: string, amount: BigNumber) {
            return <Boolean>contract.canCall(player, amount);
        },

        async canRaise(player: string, amount: BigNumber) {
            return <Boolean>contract.canRaise(player, amount);
        },

        async canCheck(player: string) {
            return <Boolean>contract.canCheck(player);
        },

        async canFold(player: string) {
            return <Boolean>contract.canFold(player);
        },
        async amountToCall() {
            return <BigNumber>contract.amountToCall();
        },

        async smallBlindSize() {
            return <BigNumber>contract.amountToCall();
        },

        onGameStageChange(listener: (stage: Web3GameStage, ...args: any[]) => void) {
            const filter = contract.filters.BoardCreated();
            // to prevent multiple listening
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onBoardRefreshed(listener: (refresher: string, ...args: any[]) => void) {
            const filter = contract.filters.BoardRefreshed();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onJoinedBoard(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.JoinedBoard();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onChecked(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.Checked();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onRaised(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.Raised();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onCalled(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.Called();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onFolded(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.Folded();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onStackRequested(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.StackRequested();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onDeckShuffled(listener: (player: string, ...args: any[]) => void) {
            const filter = contract.filters.DeckShuffled();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onBatchRevealProofProvided(listener: (player: string, cardCount: BigNumber, ...args: any[]) => void) {
            const filter = contract.filters.BatchRevealProofProvided();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        },

        onNextPlayer(listener: (playIndex: BigNumber) => void) {
            const filter = contract.filters.NextPlayer();
            contract.removeAllListeners(filter);
            contract.on(filter, listener);
        }

    };
};

export type Web3BoardManager = ReturnType<typeof getBoardManager>;

export const useGameContract = () => {
    const { address } = useAccount();

    const { data: signer } = useSigner();
    const dispatch = useAppDispatch();
    const contract = useContract({
        address: GAME_CONTRACT_ADDRESS[OP_GOERLI_CHAIN_ID],
        abi: BoardManagerABI,
        signerOrProvider: signer,
    });
    const verifierContract = useContract({
        address: VERIFIER_CONTRACT_ADDRESS[OP_GOERLI_CHAIN_ID],
        abi: VerifierABI,
        signerOrProvider: signer,
    });
    return useMemo(() => {
        if (!contract || !contract.signer || !verifierContract || !verifierContract.signer) {
            return null;
        }
        const boardManager = getBoardManager(contract, verifierContract);
        // Store the web3 manager into the store so the UI can access it
        Web3StateInstance.boardManager = boardManager;

        boardManager?.onGameStageChange((gameStage: Web3GameStage, ...args: any[]) => {
            console.log('onGameStageChange', gameStage);
            dispatch(web3Slice.actions.rerender());
        });

        boardManager?.onBoardRefreshed((refresher: string, ...args: any[]) => {
            console.log('onBoardRefreshed', refresher);
            dispatch(web3Slice.actions.rerender());
        });

        boardManager?.onJoinedBoard(async (player: string) => {
            console.log(`new user joined: ${player}`);
            Web3StateInstance.isInGame = address === player;
            dispatch(web3Slice.actions.rerender());
        });

        boardManager?.onNextPlayer((playIndex: BigNumber) => {
            if (Web3StateInstance.cachedBoard.nextPlayerToPlay.eq(playIndex)) {
                return;
            }
            console.log('next player index:', playIndex);
            dispatch(web3Slice.actions.rerender());
        });

        boardManager?.onStackRequested((player: string) => {
            console.log('onStackRequested', player);
            dispatch(web3Slice.actions.rerender());
        });

        return boardManager;

        // ...
    }, [contract, verifierContract, address, dispatch]);
}

