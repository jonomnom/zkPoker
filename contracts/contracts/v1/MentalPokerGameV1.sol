// SPDX-License-Identifier: MIT
/**
 * This contract contain all the game logic
 */
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "./VerifierV1.sol";

enum GameStatus {
    UNSET,
    SET_AND_UNSTARTED,
    STARTED,
    ALL_SHUFFLED,
    ALL_PROVIDED_DRAW_PROOF,
    ALL_OPENED_CARD,
    ENDED
}

enum PlayerStatus {
    UNSHUFFLED,
    SHUFFLED,
    DRAWN_DARD_PROOF_PROVIDED,
    CARD_OPENED,
    ENDED
}

struct Player {
    address addr;
    uint256 joinTimestamp;
    PlayerStatus status;
    string name;
}

struct RoundInfo {
    uint256 roundId;
    // for fast look-up
    mapping(address => Player) players;
    // for iterate all the players
    address[] playerAddresses;
}

contract MentalPokerGame is Ownable {
    // ========================== data fields ==========================
    // containing all the data for all rounds
    mapping(uint256 => RoundInfo) private rounds;

    // current round
    uint256 public currentRoundId;

    uint256 public maxPlayerPerRound = 10;

    // current game status
    GameStatus public status;

    // verifier address
    VerifierV1 public verifier;

    // ========================== Events ==========================
    event VerifierSet(address indexed verifier);

    event MaxPlayerPerRound(uint256 indexed count);

    event PlayerRegistered(address indexed player, string indexed name, uint256 indexed roundId);

    // anyone can call this to set up a new game
    event GameStatusUpdated(uint256 indexed roundId, GameStatus indexed status);

    // emit every time deck shuffled by player
    event DeckShuffled(address indexed player, uint256 indexed roundId);

    // emit every time set a new blocking player
    event NextBlockingUser(
        uint256 indexed playerIndex,
        uint256 indexed roundId
    );

    // emit every time deck shuffled by player
    event CardDrawnProofProvided(
        address indexed player,
        uint256 indexed roundId
    );

    // emit every time user submit their draw card proof and
    event OpenCard(address indexed player, uint256 indexed roundId);

    // ========================== modifiers ==========================
    modifier onlyStatus(GameStatus status_) {
        require(status == status_, "wrong game status");
        _;
    }

    modifier onlyRound(uint256 roundId) {
        require(currentRoundId == roundId, "wrong round");
        _;
    }

    modifier checkPlayerExist() {
        Player storage playerInfo = rounds[currentRoundId].players[msg.sender];
        require(playerInfo.joinTimestamp != 0, "you didn't join this round");
        _;
    }

    // ========================== public functions ==========================
    constructor(VerifierV1 verifier_) {
        verifier = verifier_;
        emit VerifierSet(address(verifier));
    }

    function setMaxPlayerPerRound(uint256 count) external onlyOwner {
        maxPlayerPerRound = count;
        emit MaxPlayerPerRound(count);
    }

    function filteredPlayerStatusCount(uint256 roundId, PlayerStatus status_)
        public
        view
        returns (uint256)
    {
        RoundInfo storage roundInfo = rounds[roundId];
        address[] storage addrs = roundInfo.playerAddresses;
        uint256 len = addrs.length;
        uint256 count = 0;
        for (uint256 i = 0; i < len; ++i) {
            if (roundInfo.players[addrs[i]].status == status_) {
                count++;
            }
        }
        return count;
    }

    // Solidity: to export the dynamic fields which are behind the private access
    function getGameInfo()
        external
        view
        returns (uint256 roundId, Player[] memory playerInfos, GameStatus gameStatus)
    {
        roundId = currentRoundId;
        address[] storage playerAddresses = rounds[roundId].playerAddresses;
        gameStatus = status;
        
        playerInfos = new Player[](playerAddresses.length);

        for (uint256 i = 0; i < playerAddresses.length; ++i) {
            playerInfos[i] = rounds[roundId].players[playerAddresses[i]];
        }
    }

    // return the next RoundId
    function setupGame()
        external
        virtual
        onlyStatus(GameStatus.UNSET)
        returns (uint256)
    {
        require(verifier.setup(currentRoundId), "setup failed");
        currentRoundId++;

        _onToTheNextStatus();
        return currentRoundId;
    }

    // player should call this function to join the game
    function registerPlayer(string calldata name)
        external
        virtual
        onlyStatus(GameStatus.SET_AND_UNSTARTED)
    {
        RoundInfo storage info = rounds[currentRoundId];
        require(
            info.playerAddresses.length <= maxPlayerPerRound,
            "reach player limit"
        );
        require(
            info.players[msg.sender].joinTimestamp == 0,
            "user registered!"
        );
        Player memory player = Player({
            addr: msg.sender,
            name: name,
            joinTimestamp: block.timestamp,
            status: PlayerStatus.UNSHUFFLED
        });
        info.players[msg.sender] = player;
        info.playerAddresses.push(msg.sender);
        emit PlayerRegistered(msg.sender, name, currentRoundId);

        // when reach to the player limit, go to the next status
        if (info.playerAddresses.length == maxPlayerPerRound) {
            _onToTheNextStatus();
        }
    }

    // shuffle the deck
    // proof: proof for going to the next deck
    function shuffleDeck(ShuffleProof calldata proof)
        external
        onlyStatus(GameStatus.STARTED)
        checkPlayerExist
    {
        RoundInfo storage roundInfo = rounds[currentRoundId];
        Player storage playerInfo = roundInfo.players[msg.sender];
        uint256 playerCount = roundInfo.playerAddresses.length;

        require(
            playerInfo.status != PlayerStatus.SHUFFLED,
            "already shuffled!"
        );

        // try to verify
        require(
            verifier.verifyShuffleAndSave(proof, currentRoundId),
            "shuffle verify failed"
        );

        // verification passes, proof is saved in Verification contract, now modify game storage
        playerInfo.status = PlayerStatus.SHUFFLED;
        emit DeckShuffled(msg.sender, currentRoundId);

        bool noBlocker = filteredPlayerStatusCount(
            currentRoundId,
            PlayerStatus.SHUFFLED
        ) == playerCount;
        if (noBlocker) {
            _onToTheNextStatus();
        }
    }

    // provide card proof for all the other players, so the target player can draw the card sometime later,
    // like at the competiton stage. The orders of the proofs for each user should passed by `proofIndexes`
    function batchProvideDrawCardProof(
        DrawProof[] calldata proofs,
        uint256[] memory proofIndexes
    ) external onlyStatus(GameStatus.ALL_SHUFFLED) checkPlayerExist {
        RoundInfo storage roundInfo = rounds[currentRoundId];
        Player storage playerInfo = roundInfo.players[msg.sender];

        address[] storage playerAddresses = roundInfo.playerAddresses;
        uint256 playerCount = playerAddresses.length;

        require(proofs.length == playerCount - 1, "proof count != other player count");
        require(proofs.length == proofIndexes.length, "proof count != index count");

        require(
            playerInfo.status != PlayerStatus.DRAWN_DARD_PROOF_PROVIDED,
            "you have provided proofs"
        );

        for (uint256 i = 0; i < proofs.length; ++i) {
            require(
                verifier.verifyDrawnAndSave(
                    proofs[i],
                    playerAddresses[proofIndexes[i]],
                    currentRoundId
                ),
                "draw proof verify failed"
            );
        }

        // change the player status
        playerInfo.status = PlayerStatus.DRAWN_DARD_PROOF_PROVIDED;

        // check if all users have shuffled
        bool noBlocker = filteredPlayerStatusCount(
            currentRoundId,
            PlayerStatus.DRAWN_DARD_PROOF_PROVIDED
        ) == playerCount;
        // when all players have shuffled, move to the next status
        if (noBlocker) {
            _onToTheNextStatus();
        }

        emit CardDrawnProofProvided(msg.sender, currentRoundId);
    }

    // users must call this function to open card with their proofs and values
    function openCard(DrawProof calldata proof)
        external
        onlyStatus(GameStatus.ALL_PROVIDED_DRAW_PROOF)
        checkPlayerExist
    {
        RoundInfo storage roundInfo = rounds[currentRoundId];
        Player storage playerInfo = roundInfo.players[msg.sender];
        uint256 playerCount = roundInfo.playerAddresses.length;

        require(
            playerInfo.status != PlayerStatus.CARD_OPENED,
            "you have opened card"
        );

        require(
            verifier.verifyDrawnAndSave(
                proof,
                msg.sender, // proof himself
                currentRoundId
            ),
            "open card proof verify failed"
        );

        playerInfo.status = PlayerStatus.CARD_OPENED;

        bool noBlocker = filteredPlayerStatusCount(
            currentRoundId,
            PlayerStatus.CARD_OPENED
        ) == playerCount;
        if (noBlocker) {
            _onToTheNextStatus();
        }
        emit OpenCard(msg.sender, currentRoundId);
    }

    // anyone can call this function to trigger the calculation and get
    // the final winner
    function compete()
        external
        view
        onlyStatus(GameStatus.ALL_OPENED_CARD)
        returns (uint256, address)
    {
        RoundInfo storage roundInfo = rounds[currentRoundId];
        address[] storage playerAddresses = roundInfo.playerAddresses;
        uint256 userCount = playerAddresses.length;
        uint256 biggestCard = 0;
        uint256 winnerIndex = 0;
        for (uint256 i = 0; i < userCount; ++i) {
            DrawProof memory proof = verifier.getDrawProof(
                playerAddresses[i],
                currentRoundId
            );
            if (biggestCard < proof.decryptedCard) {
                biggestCard = proof.decryptedCard;
                winnerIndex = i;
            }
        }
        return (biggestCard, playerAddresses[winnerIndex]);
    }

    // ========================== internals ==========================
    // shift game status to the next
    function _onToTheNextStatus() internal {
        uint256 nextStatus = uint256(status) + 1;
        // when the status reach the end, there is no way for this game to be replayed
        require(nextStatus <= uint256(GameStatus.ENDED), "game already ended");
        _updateGameStatus(GameStatus(nextStatus));
    }

    function _updateGameStatus(GameStatus status_) internal {
        status = status_;
        emit GameStatusUpdated(currentRoundId, status_);
    }
}
