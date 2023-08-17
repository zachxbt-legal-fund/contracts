const hre = require("hardhat");
const { buildTree } = require("./generateProofs");

async function main() {
  const ZachRefund = await hre.ethers.getContractFactory("ZachRefund");
  const zachRefund = await ZachRefund.deploy(buildTree().tree.getHexRoot(), "0x6b175474e89094c44da98b954eedeac495271d0f"); // DAI

  await zachRefund.deployed();

  console.log("Deployed to:", zachRefund.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
