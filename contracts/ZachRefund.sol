//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZachRefund is Ownable{
    bytes32 public immutable merkleRoot;
    IERC20 public immutable token;

    constructor(bytes32 _merkleRoot, address _token){
        merkleRoot = _merkleRoot;
        token = IERC20(_token);
    }

    function retrieveFundsETH(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }

    function retrieveFund(address tokenFrom, address to, uint amount) external onlyOwner {
        IERC20(tokenFrom).transfer(to, amount);
    }

    // There are some issues with merkle trees such as pre-image attacks or possibly duplicated leaves on
    // unbalanced trees, but here we protect against them by checking against msg.sender and only allowing each account to claim once
    // See https://github.com/miguelmota/merkletreejs#notes for more info
    mapping(address=>bool) public claimed;
    function claim(bytes32[] calldata _merkleProof, uint amount) public payable {
        require(MerkleProof.verify(_merkleProof, merkleRoot, keccak256(abi.encode(msg.sender, amount))) == true, "wrong merkle proof");
        require(claimed[msg.sender] == false, "already claimed");
        claimed[msg.sender] = true;
        token.transfer(msg.sender, amount);
    }
}
