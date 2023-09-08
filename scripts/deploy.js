const hre = require("hardhat");
const { buildTree } = require("./generateProofs");

const CHAIN = "ethereum"

async function main() {
  const ZachRefund = await hre.ethers.getContractFactory("ZachRefund");
  const zachRefund = await ZachRefund.deploy(buildTree(CHAIN).tree.getHexRoot(), CHAIN === "ethereum"?
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "0xaf88d065e77c8cc2239327c5edb3a432268e5831"); // USDC

  await zachRefund.deployed();

  console.log("Deployed to:", zachRefund.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
