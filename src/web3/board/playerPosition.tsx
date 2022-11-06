import HandComponent from "../../cards/hand";
import Avatars from "../../connection/avatars";
import { useAppSelector } from "../../redux/hooks";
import { simplifyAddress } from "../ConnectButton";
import { Web3StateInstance } from "../web3LocalState";
import "./playerPosition.css";

type PlayerPositionComponentProps = {
  style: React.CSSProperties;
  playerIndex: number;
  isFrontFacing: boolean;
};

function PlayerPositionComponent(
  props: PlayerPositionComponentProps
): JSX.Element {
  const r = useAppSelector((state) => state.web3.fakeStateToTriggerRerender);
  const board = Web3StateInstance.cachedBoard;
  const isNextToAct = board.nextPlayerToPlay.toNumber() === props.playerIndex;

  const myStyle = isNextToAct
    ? { borderColor: "red", borderStyle: "solid", fontWeight:"700" }
    : {fontWeight:"400"};
  return (
    <div className="player-position" style={props.style}>
      <div style={{ fontSize: 0 }}>{r}</div>
      <div className="player-status">
        {Web3StateInstance.localState.isOnBigBlind(props.playerIndex) && (
          <div className="icon">BB</div>
        )}
        {Web3StateInstance.localState.isOnSmallBlind(props.playerIndex) && (
          <div className="icon">SB</div>
        )}
        {Web3StateInstance.localState.isDealer(props.playerIndex) && (
          <div className="icon">D</div>
        )}
      </div>
      <div
        className="player-info"
        style={{
          rotate: -1 * parseFloat(props.style.rotate as string) + "rad",
        }}
      >
        <ul
          style={{
            marginLeft: `${props.isFrontFacing ? -10 : 0}em`,
            marginBottom: `${props.isFrontFacing ? 3 : 0}em`,
          }}
        >
          <li>
            {Avatars[props.playerIndex]}{" "}
            {!Web3StateInstance.cachedBoard.playerInPots[props.playerIndex] &&
              "(Folded)"}
          </li>
          <li>
            {simplifyAddress(
              Web3StateInstance.cachedBoard.playerAddresses[props.playerIndex]
            )}
          </li>
          <li>
            In The Stack:&nbsp; <img style={{width:"12px", height:"12px"}}src="https://cryptologos.cc/logos/apecoin-ape-ape-logo.svg?v=023"></img>
            &nbsp;{board.playerStacks[props.playerIndex]
              .toNumber()
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </li>
          <li>
            In The Pot:&nbsp;&nbsp;&nbsp;&nbsp; <img style={{width:"12px", height:"12px"}}src="https://cryptologos.cc/logos/apecoin-ape-ape-logo.svg?v=023"></img>
            &nbsp;{board.playerBets[props.playerIndex]
              .toNumber()
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </li>
          <li>
            To Call:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <img style={{width:"12px", height:"12px"}}src="https://cryptologos.cc/logos/apecoin-ape-ape-logo.svg?v=023"></img>
            &nbsp;{Web3StateInstance.localState.amountToCall()}
          </li>
          <li style={myStyle}>
            {isNextToAct && ">>"} Is Next To Act? {isNextToAct ? "Yes" : "No"}
          </li>
        </ul>
      </div>
      <HandComponent
        hand={Web3StateInstance.localState.cardIndicesToHand(
          board.playerHands[props.playerIndex]
        )}
        frontFacing={props.isFrontFacing}
      />
    </div>
  );
}

export default PlayerPositionComponent;
