// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BoardManagerStorage.sol";
import "./IBoardManager.sol";
import "./Verifier.sol";
import "./GameUtils.sol";

enum BetType {
    Call,
    Fold,
    Raise,
    Check
}

contract BoardManager is Ownable, IBoardManager, GameUtils {
    // the current board data
    // Solidity: it's have to be private to expose the dynamic members with a view function
    Board board;

    // mapping player address -> player index of joining
    mapping(address => uint256) playerIndexesMap;

    // mapping player address -> player in pot status
    mapping(address => bool) playerInPotsMap;

    bool public globalPaused;

    address public verifier;

    uint256 public immutable MIN_BIG_BLIND_SIZE = 10;
    uint256 public immutable MIN_PLAYERS = 3;

    // ========================= Modiftiers =============================
    modifier onlyGameStages(GameStage stage) {
        require(stage == board.stage, "invalid game stage");
        _;
    }

    modifier checkExist() {
        uint256 index = playerIndexesMap[msg.sender];
        require(board.playerAddresses[index] == msg.sender, "player not joined");
        _;
    }

    modifier checkTurn() {
        require(
            board.nextPlayerToPlay == playerIndexesMap[msg.sender],
            "not your turn"
        );
        _;
    }
    
    // ====================================================================
    // ========================= Public functions =========================
    // these public functions are intended to be interacted with end users
    // ====================================================================
    constructor(address verifier_) {
        require(verifier_ != address(0), "zero address verifier");
        verifier = verifier_;
    }

    // we can't export dynamic mappings, so it's a workaround
    function getBoard() public view returns (Board memory) {
        return board;
    }

    function createBoard(uint256 requiredPlayers, uint256 bigBlindSize)
        external
        override
        onlyGameStages(GameStage.Uncreated)
    {
        require(
            requiredPlayers >= MIN_PLAYERS &&
                bigBlindSize >= MIN_BIG_BLIND_SIZE,
            "required players >= 3 && big blind size >= 10"
        );

        // create board, stage is already created
        refreshBoard();
        board.requiredPlayers = requiredPlayers;
        board.bigBlindSize = bigBlindSize;
        emit BoardCreated(msg.sender);
    }

    function refreshBoard() public override {
        _clearMappings();
        board.stage = GameStage.GatheringPlayers;
        board.playerAddresses = new address[](0);
        board.playerHands = new uint256[][](0);
        board.playerBets = new uint256[](0);
        board.playerStacks = new uint256[](0);
        board.playerInPots = new bool[](0);
        board.communityCards = new uint256[](0);
        board.winner = address(0);
        board.potSize = 0;

        // we don't set dealer index and next player index till we done player gathering

        emit BoardRefreshed(msg.sender);
    }

    function joinBoard()
        external
        override
        onlyGameStages(GameStage.GatheringPlayers)
        returns (uint256)
    {
        require(!playerInPotsMap[msg.sender], "already joined");

        uint256[] memory initialHand = new uint256[](0);
        board.playerAddresses.push(msg.sender);
        board.playerHands.push(initialHand);
        board.playerBets.push(0);
        // get 1000 stack initially
        board.playerStacks.push(1000);
        board.playersDoneForCurrentStage.push(true);
        board.playerInPots.push(true);

         // set flag
        playerInPotsMap[msg.sender] = true;
        playerIndexesMap[msg.sender] = board.playerAddresses.length - 1;

        // when enough players are there, let's go
        if (board.playerAddresses.length == board.requiredPlayers) {
            board.stage = GameStage.Shuffle;
            // dealer index is always the last joined player
            board.dealerIndex = board.playerAddresses.length - 1;
            // next player to play is 1 ahead of dealer index, which is 0
            board.nextPlayerToPlay = 0;
            // set big blind bet size and small blind bet size
            board.playerBets[0] = board.bigBlindSize;
            board.playerStacks[0] -= board.bigBlindSize;
            board.playerBets[1] = board.bigBlindSize / 2;
            board.playerStacks[1] -= board.bigBlindSize / 2;
        }

        emit JoinedBoard(msg.sender);

        // return the index
        return board.playerAddresses.length - 1;
    }

    function check() external override {
        _performBet(BetType.Check);
    }

    function call(uint256 amount) external override {
        _performBetWithAmount(BetType.Call, amount);
    }

    function raise(uint256 amount) external override {
        _performBetWithAmount(BetType.Raise, amount);
    }

    function fold() external override {
        _performBet(BetType.Fold);
    }

    function shuffleDeck(ShuffleProof calldata proof)
        external
        override
        onlyGameStages(GameStage.Shuffle)
        checkTurn
        checkExist
    {
        require(verifier != address(0), "empty verifier");
        require(
            Verifier(verifier).verifyShuffleAndSave(proof),
            "verification failed"
        );

        emit DeckShuffled(msg.sender);
        _moveToTheNext();
    }

    function provideRevealProof(RevealProof[] calldata proofs)
        external
        override
        checkExist
        checkTurn
    {
        // needs provide proofs in preflop and flop round
        require(isRevealRound(), "cannot reveal proof");
        require(proofs.length > 0, "empty proofs");

        uint256 cardStartIndex;
        if (board.stage == GameStage.PreFlop) {
            cardStartIndex = 0;
        } else if (board.stage == GameStage.Flop) {
            cardStartIndex = 6;
        } else if (board.stage == GameStage.Turn) {
            cardStartIndex = 9;
        } else if (board.stage == GameStage.River) {
            cardStartIndex = 10;
        }
        
        for (uint256 i = 0; i < proofs.length; ++i) {
            _provideRevealProof(
                cardStartIndex + i,
                proofs[i]);
        }
        emit BatchRevealProofProvided(msg.sender, proofs.length);

        _moveToTheNext();
    }

    // extremely simplfied version of competing
    function announceWinner()
        external
        override
        onlyGameStages(GameStage.PostRound)
        returns (address winner, uint256 highestScore)
    {
        for (uint256 i = 0; i < board.playerAddresses.length; ++i) {
            uint256 score = 0;
            uint256[] storage cards = board.playerHands[i];
            for (uint256 j = 0; j < cards.length; ++j) {
                score += cards[j];
            }
            if (highestScore < score) {
                highestScore = score;
                winner = board.playerAddresses[i];
            }
        }
        // save winner
        board.winner = winner;
    }

    function requestStack() external override checkExist {
        uint256 playerIndex = playerIndexesMap[msg.sender];
        board.playerStacks[playerIndex] += 1000;
        emit StackRequested(msg.sender);
    }

    // ====================================================================
    // ========================== View functions ==========================
    // ====================================================================
    function getShuffleProof()
        public
        view
        override
        returns (ShuffleProof memory)
    {
        return Verifier(verifier).getShuffleProof();
    }

    function getRevealProofs(uint256[] memory cardIndexes)
        public
        view
        override
        returns (RevealProof[] memory proofs)
    {
        require(cardIndexes.length > 0, "");
        proofs = new RevealProof[](cardIndexes.length);
        for (uint256 i = 0; i < cardIndexes.length; ++i) {
            RevealProof memory proof = Verifier(verifier).getRevealProof(cardIndexes[i]);
            proofs[i] = proof;
        }
    }

    function isBetRound() public view returns (bool) {
        return board.stage == GameStage.PreFlopBet
            || board.stage == GameStage.FlopBet
            || board.stage == GameStage.TurnBet
            || board.stage == GameStage.RiverBet;
    }

    function isRevealRound() public view returns (bool) {
        return board.stage == GameStage.PreFlop 
            || board.stage == GameStage.Flop 
            || board.stage == GameStage.Turn 
            || board.stage == GameStage.River
            // in the post round, everyone needs to provide proof to open the card
            || board.stage == GameStage.PostRound;
    }

    function canCall(address player, uint256 amount)
        public
        view
        override
        returns (bool)
    {
        return isBetRound() &&
            board.nextPlayerToPlay == playerIndexesMap[player] &&
            playerInPotsMap[player];
        // todo: && betAmount > lastBetAmount
    }

    function canCheck(address player) public view override returns (bool) {
        return isBetRound() &&
            board.nextPlayerToPlay == playerIndexesMap[player] &&
            playerInPotsMap[player];
        // && nobodyBet()
    }

    function canRaise(address player, uint256 amount)
        public
        view
        override
        returns (bool)
    {
        return isBetRound() &&
            board.nextPlayerToPlay == playerIndexesMap[player] &&
            playerInPotsMap[player];
        // todo: && betAmount > lastBetAmount
    }

    function canFold(address player) public view override returns (bool) {
        return isBetRound() &&
            board.nextPlayerToPlay == playerIndexesMap[player] &&
            playerInPotsMap[player];
    }

    // todo
    function amountToCall() public view override returns (uint256) {}

    function smallBlindSize() public view override returns (uint256) {
        return board.bigBlindSize / 2;
    }


    // ====================================================================
    // ========================= Internals functions ======================
    // ====================================================================

    function _moveToTheNext() internal returns (bool gameStageChanged) {
        // if there is no players joined, like while creating board, we move to the next round
        if (
            board.playerAddresses.length > 0 &&
            board.nextPlayerToPlay != board.dealerIndex
        ) {
            board.nextPlayerToPlay++;

            // skip the users who have folded
            address nextPlayer = board.playerAddresses[board.nextPlayerToPlay];

            // we can skip reveal round, otherwise we can't get complete reveal proof
            if (!playerInPotsMap[nextPlayer] && !isRevealRound()) {
                return _moveToTheNext();
            }
            emit NextPlayer(board.nextPlayerToPlay);
            return false;
        }
        uint256 nextStatus = uint256(board.stage) + 1;
        // when the status reach the end, there is no way for this game to be replayed
        require(
            nextStatus <= uint256(GameStage.PostRound),
            "game already ended"
        );

        // now it's another round
        board.stage = GameStage(nextStatus);

        emit GameStageChanged(GameStage(nextStatus));

        // post round
        _postRound();

        return true;
    }

    // Do something right after the game stage updated
    function _postRound() internal {
        uint256 len = board.playerAddresses.length;
        if (board.stage == GameStage.PreFlop) {
            // now it's preflop, assign 2 cards to each players
            for (uint256 i = 0; i < len; ++i) {
                board.playerHands[i] = new uint256[](2);
                board.playerHands[i][0] = 52 + i * 2;
                board.playerHands[i][1] = 52 + i * 2 + 1;
            }
        } else if (board.stage == GameStage.Flop) {
            // now it's flop, assign 3 cards to community deck
            board.communityCards = new uint256[](3);
            board.communityCards[0] = 52 + len * 2;
            board.communityCards[1] = 52 + len * 2 + 1;
            board.communityCards[2] = 52 + len * 2 + 2;
        }
        else if (board.stage == GameStage.Turn) {
            // now it's turn, assign 1 card to community deck
            board.communityCards.push(52 + len * 2 + 3);
        }
        else if (board.stage == GameStage.River) {
            // now it's river, assign 1 card to community deck
            board.communityCards.push(52 + len * 2 + 4);
        }
        else if (board.stage == GameStage.Ended) {
            _saveWinner();
        } else {
            // preflopreveal, flopreveal, turnreveal, riverreveal, postroundreveal
            // Gathering, shuffle, uncreated
            // these stages are all can't be skipped, so the next index start from 0, 
            board.nextPlayerToPlay = 0;
            return;
        }

        // start from the next non-folded player
        board.nextPlayerToPlay = _firstNonFoldedPlayer();
    }

    function _performBetWithAmount(BetType betType, uint256 amount)
        internal
        checkExist
        checkTurn
    {
        require(isBetRound(), "can't bet now");
        uint256 playerIndex = playerIndexesMap[msg.sender];

        if (betType == BetType.Call) {
            require(canCall(msg.sender, amount), "cannot call");
            require(
                board.playerStacks[playerIndex] >= amount,
                "insufficient amount"
            );
            board.playerStacks[playerIndex] -= amount;
            board.playerBets[playerIndex] += amount;
            board.potSize += amount;
        } else if (betType == BetType.Raise) {
            require(canRaise(msg.sender, amount), "cannot raise");
            board.playerStacks[playerIndex] -= amount;
            board.playerBets[playerIndex] += amount;
            board.potSize += amount;
        } else if (betType == BetType.Check) {
            require(canCheck(msg.sender), "cannot raise");
            // nothing happens when check
        } else if (betType == BetType.Fold) {
            require(canFold(msg.sender), "cannot fold");
            playerInPotsMap[msg.sender] = false;
            board.playerInPots[playerIndex] = false;
            if(_tryAnnounceWinnerDirectly()) {
                return;
            }
        }
        // play is done for this round
        board.playersDoneForCurrentStage[playerIndex] = true;
        _moveToTheNext();
    }

    function _performBet(BetType betType) internal {
        _performBetWithAmount(betType, 0);
    }

    function _provideRevealProof(
        uint256 cardStartIndex,
        RevealProof calldata proof) internal {
        require(verifier != address(0), "empty verifier");
        require(
            Verifier(verifier).verifyRevealAndSave(cardStartIndex, proof),
            "verification failed"
        );
    }

    function _clearMappings() internal {
        address[] storage addrs = board.playerAddresses;
        for (uint256 i = 0; i < addrs.length; ++i) {
            delete playerInPotsMap[addrs[i]];
            delete playerIndexesMap[addrs[i]];
        }
    }

    // if there is only one player left, announce winner directly
    function _tryAnnounceWinnerDirectly() internal returns (bool hasWinner) {
        uint256 stillInPot;
        uint256 winnerIndex;
        for (uint256 i = 0; i < board.playerInPots.length; ++i) {
            if(board.playerInPots[i]) {
                stillInPot++;
                winnerIndex = i;
            }
        }
        if (stillInPot == 1) {
            board.winner = board.playerAddresses[winnerIndex];
            board.stage = GameStage.Ended;
            board.playerStacks[winnerIndex] += board.potSize; 
            board.potSize = 0;
            hasWinner = true;
        }
    }

    function _firstNonFoldedPlayer() internal view returns (uint256 index) {
        for (uint256 i = 0; i < board.playerAddresses.length; ++i) {
            if (board.playerInPots[i]) {
                index = i;
            }
        }
    }

    function _saveWinner() internal {
        uint highestScore;
        for (uint256 i = 0; i < board.playerAddresses.length; ++i) {
            if (!board.playerInPots[i]) {
                continue;
            }
            uint256 score = 0;
            uint256[] storage cards = board.playerHands[i];
            for (uint256 j = 0; j < cards.length; ++j) {
                score += cards[j];
            }
            if (highestScore < score) {
                highestScore = score;
                board.winner = board.playerAddresses[i];
            }
        }
    }

}

