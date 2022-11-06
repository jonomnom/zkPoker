import CardComponent from './card';
import { Card } from '../connection/cardInfo';
import "./hand.css";

type HandProps = { hand: Array<Card>, frontFacing: boolean, };

function HandComponent(props: HandProps): JSX.Element {
    const hand: Array<Card> = props.hand;
    return (
        <div className="hand">
          {hand.map((c, i) =>
              <CardComponent key={c} card={c} isFrontFacing={props.frontFacing}
                style={{ left: (i * -12) + "em" }}
              />
          )}
        </div>
    );
}

export default HandComponent;
