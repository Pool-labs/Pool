// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PoolDroplet is ERC20, Ownable {
    // Events
    event RewardIssued(address indexed to, uint256 amount, string reason);
    
    // Mapping to track issuers
    mapping(address => bool) public authorizedIssuers;

    constructor() ERC20("Pool Droplet", "DROP") Ownable(msg.sender) {
        // Mint initial supply to owner
        _mint(msg.sender, 100_000_000 * 10**decimals());
    }
    
    // Add a new authorized issuer 
    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }
    
    // Remove an authorized issuer
    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
    }
    
    // Issue rewards to a user
    function issueReward(address to, uint256 amount, string calldata reason) 
        external {
        require(authorizedIssuers[msg.sender] || owner() == msg.sender, 
                "Not authorized to issue rewards");
        
        // Mint new tokens to the user
        _mint(to, amount);
        
        // Emit event for tracking
        emit RewardIssued(to, amount, reason);
    }
}