import React from 'react';
export type CardTemplateProps = { style: React.CSSProperties, suitSymbol: string, suitName: string };

export function CardTemplateBack(props: { style: React.CSSProperties }) {
    return (
        <span style={props.style} className="middle_center"><img src="img/back.png"/></span>
    );
}
export function CardTemplateRankTwo(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">2</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_center">{props.suitSymbol}</span><span className="suit bottom_center">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">2</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankThree(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">3</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_center">{props.suitSymbol}</span><span className="suit middle_center">{props.suitSymbol}</span><span className="suit bottom_center">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">3</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankFour(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">4</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">4</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankFive(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">5</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_center">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">5</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankSix(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">6</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_left">{props.suitSymbol}</span><span className="suit middle_right">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">6</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankSeven(props: CardTemplateProps) {
    return (
      <div style={props.style}>
        <div className="corner top"><span className="number">7</span><span>{props.suitSymbol}</span></div>
          <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_left">{props.suitSymbol}</span><span className="suit middle_top">{props.suitSymbol}</span><span className="suit middle_right">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span>
        <div className="corner bottom"><span className="number">7</span><span>{props.suitSymbol}</span></div>
      </div>
    );
}
export function CardTemplateRankEight(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">8</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_left">{props.suitSymbol}</span><span className="suit middle_top">{props.suitSymbol}</span><span className="suit middle_right">{props.suitSymbol}</span><span className="suit middle_bottom">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">8</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankNine(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">9</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_top_left">{props.suitSymbol}</span><span className="suit middle_center">{props.suitSymbol}</span><span className="suit middle_top_right">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span><span className="suit middle_bottom_left">{props.suitSymbol}</span><span className="suit middle_bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">9</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankTen(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">10</span><span>{props.suitSymbol}</span></div>
            <span className="suit top_left">{props.suitSymbol}</span><span className="suit top_right">{props.suitSymbol}</span><span className="suit middle_top_left">{props.suitSymbol}</span><span className="suit middle_top_center">{props.suitSymbol}</span><span className="suit middle_top_right">{props.suitSymbol}</span><span className="suit bottom_left">{props.suitSymbol}</span><span className="suit bottom_right">{props.suitSymbol}</span><span className="suit middle_bottom_center">{props.suitSymbol}</span><span className="suit middle_bottom_left">{props.suitSymbol}</span><span className="suit middle_bottom_right">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">10</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankJack(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">J</span><span>{props.suitSymbol}</span></div>
            <span className="face middle_center"><img src={`img/faces/face-jack-${props.suitName}.png`}/></span>
          <div className="corner bottom"><span className="number">J</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankQueen(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">Q</span><span>{props.suitSymbol}</span></div>
            <span className="face middle_center"><img src={`img/faces/face-queen-${props.suitName}.png`}/></span>
          <div className="corner bottom"><span className="number">Q</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankKing(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">K</span><span>{props.suitSymbol}</span></div>
            <span className="face middle_center"><img src={`img/faces/face-king-${props.suitName}.png`}/></span>
          <div className="corner bottom"><span className="number">K</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}
export function CardTemplateRankAce(props: CardTemplateProps) {
    return (
        <div style={props.style}>
          <div className="corner top"><span className="number">A</span><span>{props.suitSymbol}</span></div>
            <span className="suit middle_center">{props.suitSymbol}</span>
          <div className="corner bottom"><span className="number">A</span><span>{props.suitSymbol}</span></div>
        </div>
    );
}