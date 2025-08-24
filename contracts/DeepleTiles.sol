// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeepleTiles is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;

    struct CardMeta {
        string title;           // e.g., "Deeple 001"
        string mediaURI;        // image or metadata URI
        address creator;        // minter/owner at mint time
        uint256 mintedAt;       // timestamp
        bytes32 notesHash;      // keccak256 hash of note sequence for provenance
    }
    mapping(uint256 => CardMeta) public cards; // tokenId => CardMeta

    struct Run {
        address player;
        uint256 score;
        uint256 accuracy; // 0-100
        uint256 ts;
        bytes32 songHash; // keccak256 of notes
    }
    Run[] public leaderboard; // recent runs (demo)

    // per-song counters for a sense of activity
    mapping(bytes32 => uint256) public totalPlays; // songHash => count

    // Events for indexers/UX
    event CardMinted(uint256 indexed tokenId, address indexed to, string title, string mediaURI, bytes32 notesHash);
    event RunPublished(address indexed player, uint256 indexed score, uint256 accuracy, bytes32 indexed songHash);
    event CreatorTipped(uint256 indexed tokenId, address indexed from, uint256 amount);

    constructor() ERC721("Deeple Tiles", "DEEPLE") Ownable(msg.sender) {}


    function mint(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        // Minimal meta for compatibility
        cards[tokenId] = CardMeta({ title: string.concat("Deeple ", tokenId.toString()), mediaURI: uri, creator: msg.sender, mintedAt: block.timestamp, notesHash: bytes32(0) });
        emit CardMinted(tokenId, to, cards[tokenId].title, uri, bytes32(0));
    }


    function mintWithMeta(address to, string memory title, string memory mediaURI, bytes32 notesHash) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = mediaURI; // keep URI for wallets
        cards[tokenId] = CardMeta({ title: title, mediaURI: mediaURI, creator: msg.sender, mintedAt: block.timestamp, notesHash: notesHash });
        emit CardMinted(tokenId, to, title, mediaURI, notesHash);
    }


    function publishRun(uint256 score, uint256 accuracy, bytes32 songHash) external {
        leaderboard.push(Run({ player: msg.sender, score: score, accuracy: accuracy, ts: block.timestamp, songHash: songHash }));
        unchecked { totalPlays[songHash] += 1; }
        emit RunPublished(msg.sender, score, accuracy, songHash);
        // Optional: trim to last N entries to cap storage; omitted in demo for simplicity
    }


    function tipCreator(uint256 tokenId) external payable {
        address creator = cards[tokenId].creator;
        require(creator != address(0), "no creator");
        (bool ok, ) = creator.call{ value: msg.value }("");
        require(ok, "tip failed");
        emit CreatorTipped(tokenId, msg.sender, msg.value);
    }


    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
        return _tokenURIs[tokenId];
    }

    function getCard(uint256 tokenId) external view returns (CardMeta memory) {
        return cards[tokenId];
    }

    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    function getLeaderboard(uint256 start, uint256 count) external view returns (Run[] memory out) {
        uint256 len = leaderboard.length;
        if (start >= len) return new Run[](0);
        uint256 to = start + count;
        if (to > len) to = len;
        uint256 n = to - start;
        out = new Run[](n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = leaderboard[start + i];
        }
    }
} 