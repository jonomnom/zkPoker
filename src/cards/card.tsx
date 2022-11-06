
import React, { useState } from 'react';
import CardInfo, { Card, Rank } from '../connection/cardInfo';
import "./card.css";
import { CardTemplateBack, CardTemplateRankAce, CardTemplateRankEight, CardTemplateRankFive, CardTemplateRankFour, CardTemplateRankJack, CardTemplateRankKing, CardTemplateRankNine, CardTemplateRankQueen, CardTemplateRankSeven, CardTemplateRankSix, CardTemplateRankTen, CardTemplateRankThree, CardTemplateRankTwo } from './cardTemplates';

type CardComponentProps = { style: React.CSSProperties, card: Card, isFrontFacing: boolean };

function CardComponent(props: CardComponentProps): JSX.Element {
    const card: Card = props.card;
    const rank: Rank = CardInfo.rank(card);
    const suitSymbol: string = CardInfo.suitSymbol(card);
    const suitName: string = CardInfo.suitName(card);

    const rootRef: React.Ref<HTMLDivElement> = React.useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    const getCardClasses = () => {
        return `card card-${props.isFrontFacing ? CardInfo.rankName(card) : "back"} ${CardInfo.suitName(card)} ${isFocused && "focused"}`;
    };
    const toggleCardFocus = () => {
        setIsFocused(!isFocused);
    };
    return (
        <div ref={rootRef} className={getCardClasses()} style={props.style} onMouseEnter={toggleCardFocus} onMouseLeave={toggleCardFocus}>
          {
            {
              [Rank.Two]:    <CardTemplateRankTwo   style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Three]:  <CardTemplateRankThree style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Four]:   <CardTemplateRankFour  style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Five]:   <CardTemplateRankFive  style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Six]:    <CardTemplateRankSix   style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Seven]:  <CardTemplateRankSeven style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Eight]:  <CardTemplateRankEight style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Nine]:   <CardTemplateRankNine  style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Ten]:    <CardTemplateRankTen   style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Jack]:   <CardTemplateRankJack  style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Queen]:  <CardTemplateRankQueen style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.King]:   <CardTemplateRankKing  style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
              [Rank.Ace]:    <CardTemplateRankAce   style={{ display: props.isFrontFacing ? "block" : "none" }} suitName={suitName} suitSymbol={suitSymbol} />,
            }[rank]
        }
        <CardTemplateBack style={{ display: !props.isFrontFacing ? "block" : "none" }} />
        </div>
    );
}

export default CardComponent;
