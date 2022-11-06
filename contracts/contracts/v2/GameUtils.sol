// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BoardManagerStorage.sol";

contract GameUtils {
    uint256 public immutable CARD_NUM = 52;

    function createInitialCards()
        internal
        pure
        returns (uint256[] memory cards)
    {
        cards = new uint256[](CARD_NUM);
        for (uint256 i = 0; i < CARD_NUM; ++i) {
            cards[i] = i + 1;
        }
        return cards;
    }

    function getCardInfo(uint256 val) public pure returns (CardInfo memory) {
        return CardInfo({rank: Rank(val / 13), value: val % 13});
    }
}
