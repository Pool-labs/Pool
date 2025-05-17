// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PoolBadges is ERC721Enumerable, Ownable {
    // Badge constants - water/pool themed
    uint256 public constant FIRST_DIVE = 1;      // First pool created
    uint256 public constant SPLASH_MAKER = 2;    // Created 5+ pools
    uint256 public constant RELIABLE_FLOW = 3;   // Perfect payment record
    uint256 public constant RIPPLE_EFFECT = 4;   // Invited 5+ friends
    uint256 public constant POOL_MASTER = 5;     // Advanced user badge
    
    // Badge metadata URI storage
    mapping(uint256 => string) private _tokenURIs;
    
    // Track authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Track next token ID
    uint256 private _nextTokenId = 1;
    
    constructor() ERC721("Pool Badges", "PBADGE") Ownable(msg.sender) {
        // Initialize badge URIs
        _tokenURIs[FIRST_DIVE] = "ipfs://QmXxxx1/first-dive.json";
        _tokenURIs[SPLASH_MAKER] = "ipfs://QmXxxx2/splash-maker.json";
        _tokenURIs[RELIABLE_FLOW] = "ipfs://QmXxxx3/reliable-flow.json";
        _tokenURIs[RIPPLE_EFFECT] = "ipfs://QmXxxx4/ripple-effect.json";
        _tokenURIs[POOL_MASTER] = "ipfs://QmXxxx5/pool-master.json";
    }
    
    // Add a new authorized issuer
    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }
    
    // Remove an authorized issuer
    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
    }
    
    // Award a badge to a user
    function awardBadge(address to, uint256 badgeType) external {
        require(authorizedIssuers[msg.sender] || owner() == msg.sender, 
                "Not authorized to award badges");
        require(badgeType >= FIRST_DIVE && badgeType <= POOL_MASTER, 
                "Invalid badge type");
        
        // Mint new badge to the recipient
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        
        // Set token URI to the appropriate badge type
        _setTokenURI(tokenId, _tokenURIs[badgeType]);
    }
    
    // Check if a user has a specific badge type
    function hasBadge(address owner, uint256 badgeType) external view returns (bool) {
        require(badgeType >= FIRST_DIVE && badgeType <= POOL_MASTER, 
                "Invalid badge type");
        
        // Count how many tokens the user has
        uint256 balance = balanceOf(owner);
        
        // Check each token
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (_getTokenType(tokenId) == badgeType) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get the badge type of a token
    function getBadgeType(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "Token doesn't exist");
        return _getTokenType(tokenId);
    }
    
    // Internal function to get badge type from URI
    function _getTokenType(uint256 tokenId) internal view returns (uint256) {
        string memory uri = tokenURI(tokenId);
        
        // Compare URIs to determine badge type
        if (_compareStrings(uri, _tokenURIs[FIRST_DIVE])) return FIRST_DIVE;
        if (_compareStrings(uri, _tokenURIs[SPLASH_MAKER])) return SPLASH_MAKER;
        if (_compareStrings(uri, _tokenURIs[RELIABLE_FLOW])) return RELIABLE_FLOW;
        if (_compareStrings(uri, _tokenURIs[RIPPLE_EFFECT])) return RIPPLE_EFFECT;
        if (_compareStrings(uri, _tokenURIs[POOL_MASTER])) return POOL_MASTER;
        
        return 0; // Unknown badge type
    }
    
    // Set token URI
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        require(_exists(tokenId), "Token doesn't exist");
        _tokenURIs[tokenId] = uri;
    }
    
    // Get token URI (override)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token doesn't exist");
        return _tokenURIs[tokenId];
    }
    
    // Check if a token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // Compare strings (helper)
    function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}