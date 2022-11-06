export enum Suit {
    Spades = "s",
    Hearts = "h",
    Diamonds = "d",
    Clubs = "c"
};

export enum Rank {
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "T",
    Jack = "J",
    Queen = "Q",
    King = "K",
    Ace = "A",
};

export type Card = string;

export default class CardInfo {
    public static card(rank: Rank, suit: Suit): Card {
        return rank + suit;
    }
    public static suit(card: Card): Suit {
        return card[1] as Suit;
    }
    public static rank(card: Card): Rank {
        return card[0] as Rank;
    }
    public static suitSymbol(card: Card): string {
        const symbols = {
            [Suit.Clubs]: "\u2663",
            [Suit.Diamonds]: "\u2666",
            [Suit.Spades]: "\u2660",
            [Suit.Hearts]: "\u2665"
        };
        return symbols[CardInfo.suit(card)];
    }
    public static suitName(card: Card): string {
        const symbols = {
            [Suit.Clubs]: "clubs",
            [Suit.Diamonds]: "diamonds",
            [Suit.Spades]: "spades",
            [Suit.Hearts]: "hearts"
        };
        return symbols[CardInfo.suit(card)];
    }
    public static rankName(card: Card): string {
        const symbols = {
            [Rank.Two]: "two",
            [Rank.Three]: "thre;",
            [Rank.Four]: "four",
            [Rank.Five]: "five",
            [Rank.Six]: "six",
            [Rank.Seven]: "seven",
            [Rank.Eight]: "eight",
            [Rank.Nine]: "nine",
            [Rank.Ten]: "ten",
            [Rank.Jack]: "jack",
            [Rank.Queen]: "queen",
            [Rank.King]: "king",
            [Rank.Ace]: "ace",
        };
        return symbols[CardInfo.rank(card)];
    }
}
