import { useAppSelector } from '../../redux/hooks';
import { Web3StateInstance } from '../web3LocalState';
import './devControls.css';
import './gameControls.css';

function DevControls() {
    useAppSelector(state => state.web3.fakeStateToTriggerRerender);
    const requestStack = () => {
        Web3StateInstance.boardManager?.requestStack();
    }
    const refreshGame = () => {
        Web3StateInstance.boardManager?.refreshBoard();
    }
    return (
        <div className="dev-controls">
            <button onClick={requestStack}>
                Request Test Stack
            </button>
            <button onClick={refreshGame}>
                Refresh Board
            </button>
            <p className="stage-info">Stage: {
                [
                    'Game is not created',
                    'Gathering players',
                    'Shuffling the deck',
                    'Providing reveal proofs for other players\' hands',
                    'PreFlop bet',
                    'Providing reveal proofs for community cards',
                    'Flop bet',
                    'Providing reveal proofs for the 4th community card',
                    'Turn bet',
                    'Providing reveal proofs for the 5th community card',
                    'River bet',
                    'Open cards',
                    'Ended'
                ][Web3StateInstance.cachedBoard.stage]
            }</p>
            
        </div>
    );
}

export default DevControls;
