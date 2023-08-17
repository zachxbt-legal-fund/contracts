const { expect } = require("chai");
const { ethers } = require("hardhat");
const { buildTree, paddedBuffer } = require("../scripts/generateProofs");

async function deployContract(name, params = []) {
    const Contract = await ethers.getContractFactory(name);
    const contract = await Contract.deploy(...params);
    await contract.deployed();
    return contract
}

const donorAddress = "0xed6b3dc95e6e41156cde61a206668935d7e958a4" // random addy from csv
const donorAmount = 687.316

describe("Merkle tree", function () {
    it("works on-chain", async function () {
        const [signer, attacker] = await ethers.getSigners();
        const { tree } = buildTree()
        const token = await deployContract("MockToken")
        const refund = await deployContract("ZachRefund", [tree.getHexRoot(), token.address])
        token.transfer(refund.address, ethers.utils.parseEther("1000000")) // 1M
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [donorAddress],
        });
        const donor = await ethers.provider.getSigner(
            donorAddress
        );
        await signer.sendTransaction({
            to: donorAddress,
            value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
        });
        const {leaf, amount} = paddedBuffer(donorAddress, donorAmount)
        const proof = tree.getHexProof(leaf)
        await refund.connect(donor).claim(proof, amount)
        await expect(
            refund.connect(donor).claim(proof, amount)
        ).to.be.revertedWith('MerkleVerificationFail()');
        await expect(
            refund.connect(attacker).claim(proof, amount)
        ).to.be.revertedWith('MerkleVerificationFail()');
    })
})