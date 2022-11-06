import { useAppSelector } from "../../redux/hooks";
import "./board.css";
import PlayerPositionComponent from "./playerPosition";
import { Web3GameStage } from "../useGameContract";
import { Web3StateInstance } from "../web3LocalState";
import CommunityHandComponent from "../../cards/communityHand";

type BoardComponentProps = {  };

function BoardComponent(props: BoardComponentProps): JSX.Element {
    const r = useAppSelector(state => state.web3.fakeStateToTriggerRerender);
    const board = Web3StateInstance.cachedBoard;
    if (!board) {
        // board is not ready
        return <></>;
    }
    const playerIndex = Web3StateInstance.localState.playerIndex();
    const isInGame = Web3StateInstance.isInGame;

    const ellipse = {
        a: 40,
        b: 35,
    };

    // Add the foci sizes to move from [(-a/2, -b/2); (a/2, b/2)] to [(0,0) (a, b)]
    // Add Math.PI/2 to the angle computation to move the 0th index in the bottom middle (visual slot 0)
    // Compute a "visual index" as opposed to "player index" so the owning player is always centered in the bottom middle (visual slot 0)
    const computeVisualIndex = (index: number) => (playerIndex - index + board.playerAddresses.length) % board.playerAddresses.length;
    const getXOnEllipse = (index: number) => ellipse.a + ellipse.a * Math.cos(Math.PI / 2 + (index * (2*Math.PI) / board.playerHands.length));
    const getYOnEllipse = (index: number) => ellipse.b + ellipse.b * Math.sin(Math.PI / 2 + (index * (2*Math.PI) / board.playerHands.length));
    return (
        <div style={{display: isInGame ? "block": "none"}} className="board">
            <div style={{ fontSize: 0 }}>{r}</div>
            {
                board.playerAddresses.map((_: string, i: number) => computeVisualIndex(i)).map((vIndex: number, pIndex: number) =>
                    <PlayerPositionComponent
                        key={pIndex}
                        style={{
                            fontSize: 8,
                            left: getXOnEllipse(vIndex) + "%",
                            top:  getYOnEllipse(vIndex) + "%",
                            rotate: -Math.PI / 2 + Math.atan2(getYOnEllipse(vIndex) - ellipse.b, getXOnEllipse(vIndex) - ellipse.a) + "rad"
                        }}
                        playerIndex={pIndex}
                        isFrontFacing={(
                            // front facing when it's home player and already decrypted,
                            playerIndex === pIndex && board.stage > Web3GameStage.PreFlopReveal
                        ) || board.stage === Web3GameStage.Ended}
                    />
                )
            }
            <div className="pot">
                Total pot size: ${ board.potSize.toNumber() }
            </div>
            <div className="community-cards" style={{fontSize: 8}}>
                <CommunityHandComponent hand={Web3StateInstance.localState.cardIndicesToHand(board.communityCards)} frontFacings={
                    [
                        Web3StateInstance.cachedBoard.stage > Web3GameStage.FlopReveal,
                        Web3StateInstance.cachedBoard.stage > Web3GameStage.FlopReveal,
                        Web3StateInstance.cachedBoard.stage > Web3GameStage.FlopReveal,
                        Web3StateInstance.cachedBoard.stage > Web3GameStage.TurnReveal,
                        Web3StateInstance.cachedBoard.stage > Web3GameStage.RiverReveal,
                    ]
                } />
            </div>
        </div>
    );
}

export default BoardComponent;
