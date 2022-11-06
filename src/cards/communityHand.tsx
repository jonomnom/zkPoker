

import CardComponent from './card';
import { Card } from '../connection/cardInfo';
import "./hand.css";

type HandProps = { hand: Array<Card>, frontFacings: boolean[] };

function CommunityHandComponent(props: HandProps): JSX.Element {
    const hand: Array<Card> = props.hand;

    return (
        <div className="hand">
          {hand.map((c, i) =>
              <CardComponent key={c} card={c} isFrontFacing={props.frontFacings[i]}
                style={{ left: (i * -12) + "em" }}
              />
          )}
        </div>
    );
}

export default CommunityHandComponent;
