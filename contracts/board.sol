// Sources flattened with hardhat v2.12.0 https://hardhat.org

// File contracts/v2/BoardManagerStorage.sol


pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

enum GameStage {
    Uncreated,
    GatheringPlayers,
    Shuffle,
    PreFlop, // in pre-flop, every gets 2 cards, and everyone must provide proofs 
    PreFlopBet,
    Flop, // in flop, everyone must provide proofs for community cards
    // Turn,
    // River,
    PostRound
}

enum Rank {
    Spades, 
    Hearts,
    Diamonds,
    Clubs
}

// example: 
// card value: 50
// card info: rank: 50 / 13 = 3 (Clubs), value: 50 % 13 = 11 (2,3,4,5,6,7,8,9,j,>>Q<<,k,a)
struct CardInfo {
    Rank rank;
    uint256 value;
}

// the board state
struct Board {
    // the current game status
    GameStage stage;

    // player infos
    address[] playerAddresses;
    bool[] playerinPots;
    uint256[][] playerHands;
    uint256[] playerBets;
    uint256[] playerStacks;
    bool[] playersDoneForCurrentStage;

    // 
    uint256[] communityCards;

    // next player index to player
    uint256 nextPlayerToPlay;

    uint256 bigBlindSize;

    // the cards on the deck, from index 0 to len - 1 represent from bottom to the top
    // so we can perform pop card easily 
    uint256[] deck;

    // zero address before game ends
    address winner;

    // the required amount of players for this board
    uint256 requiredPlayers;

    // total stack in the pot
    uint256 potSize;
}


// File @openzeppelin/contracts/utils/Context.sol@v4.7.3

// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.7.3

// OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/v2/Verifier.sol


/**
 * This contract contain all the cryptographic logic
 */
pragma solidity ^0.8.0;



struct ShuffleProof {
    uint256[2] proof;
    uint256[] deck;
}

struct RevealProof {
    uint256[2] proof;
    uint256 card;
}

contract Verifier is Ownable {
    // ========================== data fields ==========================
    ShuffleProof private shuffleProof;

    // key: cardIndex
    mapping(uint256 => RevealProof) public revealProofs;

    address public game;

    // ========================== Events ==========================

    event Setup();

    function getShuffleProof() public view returns (ShuffleProof memory) {
        return shuffleProof;
    }

    function getRevealProof(uint256 cardIndex)
        public
        view
        returns (RevealProof memory)
    {
        return revealProofs[cardIndex];
    }

    function setup(uint256[] calldata startingDeck) external returns (bool) {
        // set the initial proof and deck for this round
        uint256[2] memory proof = [uint256(0), uint256(0)];
        shuffleProof = ShuffleProof({proof: proof, deck: startingDeck});

        revealProofs[0] = RevealProof({proof: proof, card: 0});

        return true;
    }

    // verify shuffle proof with the last saved deck, and going on
    function verifyShuffleAndSave(ShuffleProof calldata proof)
        external
        returns (bool)
    {
        // verifyShuffleByCircomGeneratedFunction(proof, last);

        // save
        shuffleProof = proof;
        return true;
    }

    //
    function verifyRevealAndSave(RevealProof calldata proof)
        external
        returns (bool)
    {
        // verifyDrawnByCircomGeneratedFunction(proof, last);

        // save
        revealProofs[proof.card] = proof;
        return true;
    }

    // ========================== internals ==========================
}


// File contracts/v2/BoardManagerBase.sol


pragma solidity ^0.8.0;



abstract contract BoardManagerBase {
    // the current board data
    Board public board;

    bool public globalPaused;

    address public verifier;

    // ========================== Events ==========================
    event BoardCreated(address indexed creator);
    event BoardRefreshed(address indexed refresher);
    event JoinedBoard(address indexed player);
    event Checked(address indexed checker);
    event Raised(address indexed raiser);
    event Called(address indexed caller);
    event Folded(address indexed folder);
    event GameStageChanged(GameStage indexed stage);
    event StackRequested(address indexed requester);

    event DeckShuffled(address indexed player);
    event RevealProofProvided(
        address indexed sender,
        uint256 indexed cardIndex);
    event BatchRevealProofProvided(
        address indexed sender,
        uint256 indexed cardCount);

    // ========================== Public ==========================
    // create a board for a new game, reverts when
    // - the current board is not ended yet
    // - parameter checking fails
    function createBoard(uint256 requiredPlayers, uint256 bigBlindSize) external virtual;

    // simply going to the next board, for dev purpose, anyone can call it
    function refreshBoard() external virtual;
    
    // player call this function to join the created board, reverts when
    // - user has joined
    // - board players reach the limit
    function joinBoard() external virtual returns (uint256 playerIndex);

    // player call this function to check, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't check according to the game logic
    // - game stage mismatch
    function check() external virtual;

    // player call this function to raise, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't raise according to the game logic
    // - game stage mismatch
    function raise(uint256 amount) external virtual;

    // player call this function to call, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't call according to the game logic
    // - game stage mismatch
    function call(uint256 amount) external virtual;

    // player call this function to fold, reverts when
    // - it's not the player's turn
    // - player is not in the pot anymore
    // - player can't fold according to the game logic
    // - game stage mismatch
    function fold() external virtual;
    

    // everyone needs to shuffle the deck in order of joining, fails when
    // - user who's not his turn calls this func
    // - user shuffle twice
    // - proof verification fails
    function shuffleDeck(ShuffleProof calldata proof) external virtual;

    // everyone needs to provide the reveal proof to reveal a specific card of the deck, fails when
    // - user who's not his turn calls this func
    // - user provide for that card twice
    // - proof verification fails
    function provideRevealProof(RevealProof calldata proof) external virtual;
    function batchProvideRevealProof(RevealProof[] calldata proof) external virtual;

    // open the cards in the caller's hand to the public, there are two cards so the proofs, fails when
    // - user who's not his turn calls this func
    // - user open for their cards twice
    // - proof verification fails
    function openCards(RevealProof[] calldata proofs) external virtual returns (uint256[] memory);

    // call this function the contract will calculate the hands of all players and save the winner
    // also transfers all the bets on the table to the winner
    function announceWinner() external view virtual returns (address winner, uint256 highestScore);

    // dev purpose, request test stack for playing, will send 1000 stack to the called
    function requestStack() external virtual;

    // ========================== View functions ==========================
    function getShuffleProof() public view virtual returns (ShuffleProof memory);
    function getRevealProof(uint256 cardIndex) public view virtual returns (RevealProof memory);
    // return uint256(-1) to indicated not found
    function findPlayerIndex(address player) public view virtual returns (int256);

    function canCall(uint256 playerIndex, uint256 amount) public view virtual returns (bool);
    function canRaise(uint256 playerIndex, uint256 amount) public view virtual returns (bool);  
    function canCheck(uint256 playerIndex) public view virtual returns (bool);  
    function canFold(uint256 playerIndex) public view virtual returns (bool);
    
    function potSize() public view virtual returns (uint256);  
    function amountToCall() public view virtual returns (uint256);  
    function smallBlindSize() public view virtual returns (uint256);
}


// File contracts/v2/GameUtils.sol


pragma solidity ^0.8.0;



contract GameUtils {
    uint256 public immutable CARD_NUM = 52;

    function createInitialBoard(uint256 requiredPlayers, uint256 bigBlindSize)
        internal
        pure
        returns (Board memory board)
    {
        address[] memory playerAddresses = new address[](0);
        bool[] memory playerinPots = new bool[](0);
        uint256[][] memory playerHands = new uint256[][](0);
        uint256[] memory playerBets = new uint256[](0);
        uint256[] memory playerStacks = new uint256[](0);
        bool[] memory playersDoneForCurrentStage = new bool[](0);
        uint256[] memory cards = createInitialCards();

        board = Board({
            stage: GameStage.GatheringPlayers,
            playerAddresses: playerAddresses,
            playerinPots: playerinPots,
            playerHands: playerHands,
            playerBets: playerBets,
            playerStacks: playerStacks,
            playersDoneForCurrentStage: playersDoneForCurrentStage,
            communityCards: new uint256[](0),
            nextPlayerToPlay: 0,
            bigBlindSize: bigBlindSize,
            deck: cards,
            winner: address(0),
            potSize: 0,
            requiredPlayers: requiredPlayers
        });
    }

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


// File contracts/v2/BoardManager.sol


pragma solidity ^0.8.0;






enum BetType {
    Call,
    Fold,
    Raise,
    Check
}

contract BoardManager is Ownable, BoardManagerBase, GameUtils {
    uint256 public immutable MIN_BIG_BLIND_SIZE = 10;
    uint256 public immutable MIN_PLAYERS = 3;

    // ========================= Modiftiers =============================
    modifier onlyGameStages(GameStage stage) {
        require(stage == board.stage, "invalid game stage");
        _;
    }

    // ========================= Public functions =============================
    function setVerifier(address verifier_) external onlyOwner {
        require(verifier_ != address(0), "zero address verifier");
        verifier = verifier_;
    }

    function createBoard(uint256 requiredPlayers, uint256 bigBlindSize)
        external
        override
        onlyGameStages(GameStage.Uncreated)
    {
        require(
            requiredPlayers > MIN_PLAYERS && bigBlindSize > MIN_BIG_BLIND_SIZE,
            "required players > 3 && big blind size > 10"
        );

        // create board
        board = createInitialBoard(requiredPlayers, bigBlindSize);
        emit BoardCreated(msg.sender);
    }

    function refreshBoard() external override {
        board = createInitialBoard(board.requiredPlayers, board.bigBlindSize);
        emit BoardRefreshed(msg.sender);
    }

    function joinBoard()
        external
        override
        onlyGameStages(GameStage.GatheringPlayers)
        returns (uint256)
    {
        uint256[] memory initialHand = new uint256[](0);
        board.playerAddresses.push(msg.sender);
        board.playerinPots.push(true);
        board.playerHands.push(initialHand);
        board.playerBets.push(0);
        board.playerStacks.push(0);
        board.playersDoneForCurrentStage.push(true);

        // return the index
        return board.playerAddresses.length - 1;
    }

    function check()
        external
        override
        onlyGameStages(GameStage.PreFlopBet)
    {
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
    {
        int256 signedPlayerIndex = findPlayerIndex(msg.sender);
        uint256 playerIndex = uint256(signedPlayerIndex);
        require(playerIndex >= 0, "user not exist");
        require(verifier != address(0), "empty verifier");
        require(
            Verifier(verifier).verifyShuffleAndSave(proof),
            "verification failed"
        );

        emit DeckShuffled(msg.sender);
        _moveToTheNext();
    }

    function provideRevealProof(RevealProof calldata proof) public override 
    {
        // needs provide proofs in preflop and flop round
        require(board.stage == GameStage.PreFlop || board.stage == GameStage.Flop, "cannot reveal proof");
        int256 signedPlayerIndex = findPlayerIndex(msg.sender);
        uint256 playerIndex = uint256(signedPlayerIndex);
        require(playerIndex >= 0, "user not exist");
        require(verifier != address(0), "empty verifier");
        require(
            Verifier(verifier).verifyRevealAndSave(proof),
            "verification failed"
        );

        emit RevealProofProvided(msg.sender, proof.card);
        _moveToTheNext();
    }

    function batchProvideRevealProof(RevealProof[] calldata proofs)
        external
        override
    {
        require(proofs.length > 0, "empty proofs");
        for (uint256 i = 0; i < proofs.length; ++i) {
            provideRevealProof(proofs[i]);
        }
    }

    // todo
    function openCards(RevealProof[] calldata proofs)
        external
        override
        returns (uint256[] memory)
    {}

    // extremely simplfied version of competing
    function announceWinner()
        external
        view
        override
        onlyGameStages(GameStage.Ended)
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
    }

    function requestStack() external override {
        int256 playerIndex = findPlayerIndex(msg.sender);
        require(playerIndex >= 0, "you are not in");
        board.playerStacks[uint256(playerIndex)] += 1000;
        emit StackRequested(msg.sender);
    }

    // ========================== View functions ==========================
    function getShuffleProof()
        public
        view
        override
        returns (ShuffleProof memory)
    {
        return Verifier(verifier).getShuffleProof();
    }

    function getRevealProof(uint256 cardIndex)
        public
        view
        override
        returns (RevealProof memory)
    {
        return Verifier(verifier).getRevealProof(cardIndex);
    }

    function canCall(uint256 playerIndex, uint256 amount)
        public
        view
        override
        returns (bool)
    {
        return
            board.nextPlayerToPlay == playerIndex &&
            board.playerinPots[playerIndex];
        // todo: && betAmount > lastBetAmount
    }

    function canCheck(uint256 playerIndex) public view override returns (bool) {
        return
            board.nextPlayerToPlay == playerIndex &&
            board.playerinPots[playerIndex];
        // && nobodyBet()
    }

    function canRaise(uint256 playerIndex, uint256 amount)
        public
        view
        override
        returns (bool)
    {
        return
            board.nextPlayerToPlay == playerIndex &&
            board.playerinPots[playerIndex];
        // todo: && betAmount > lastBetAmount
    }

    function canFold(uint256 playerIndex) public view override returns (bool) {
        return
            board.nextPlayerToPlay == playerIndex &&
            board.playerinPots[playerIndex];
    }

    function potSize() public view override returns (uint256 result) {
        for (uint256 i = 0; i < board.playerBets.length; ++i) {
            result += board.playerBets[i];
        }
    }

    // return -1 if not found
    function findPlayerIndex(address player)
        public
        view
        override
        returns (int256 result)
    {
        result = -1;
        address[] storage playerAddresses = board.playerAddresses;
        for (uint256 i = 0; i < playerAddresses.length; ++i) {
            if (playerAddresses[i] == player) {
                result = int256(i);
            }
        }
    }

    // todo
    function amountToCall() public view override returns (uint256) {}

    function smallBlindSize() public view override returns (uint256) {
        return board.bigBlindSize / 2;
    }

    // ========================== Internals ==========================
    function _moveToTheNext() internal returns (bool gameStageChanged) {
        if (board.nextPlayerToPlay != board.playerAddresses.length - 1) {
            board.nextPlayerToPlay++;
            return false;
        }
        uint256 nextStatus = uint256(board.stage) + 1;
        // when the status reach the end, there is no way for this game to be replayed
        require(nextStatus <= uint256(GameStage.Ended), "game already ended");
        board.stage = GameStage(nextStatus);

        board.nextPlayerToPlay = 0;
        emit GameStageChanged(GameStage(nextStatus));
        return true;
    }

    function _performBetWithAmount(BetType betType, uint256 amount) internal {
        int256 signedPlayerIndex = findPlayerIndex(msg.sender);
        uint256 playerIndex = uint256(signedPlayerIndex);
        require(playerIndex >= 0, "user not exist");
        if (betType == BetType.Call) {
            require(canCall(playerIndex, amount), "cannot call");
            require(
                board.playerStacks[playerIndex] >= amount,
                "insufficient amount"
            );
            board.playerStacks[playerIndex] -= amount;
            board.playerBets[playerIndex] += amount;
            board.potSize += amount;
        } else if (betType == BetType.Raise) {
            require(canRaise(playerIndex, amount), "cannot raise");
            board.playerStacks[playerIndex] -= amount;
            board.playerBets[playerIndex] += amount;
            board.potSize += amount;
        } else if (betType == BetType.Check) {
            require(canCheck(playerIndex), "cannot raise");
            // nothing happens when check
        } else if (betType == BetType.Fold) {
            require(canFold(playerIndex), "cannot fold");
            board.playerinPots[playerIndex] = false;
        }
        board.playersDoneForCurrentStage[playerIndex] = true;
        _moveToTheNext();
    }

    function _performBet(BetType betType) internal {
        _performBetWithAmount(betType, 0);
    }
}
