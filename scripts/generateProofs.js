const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const fs = require('fs');

function paddedBuffer(addr, amount){
    //const [int, decimals] = amount.split('.')
    //const bigint = BigInt(int + (decimals??'').slice(0, 18).padEnd(18, '0'))
    const bigint = BigInt(Number((Number(amount)*1e18).toFixed(0))) // some precision loss
    const buf = Buffer.from(addr.substr(2).padStart(32*2, "0")+bigint.toString(16).padStart(32*2, "0"), "hex")
    return {
        leaf: keccak256(Buffer.concat([buf])),
        amount: bigint.toString()
    }
}

function buildTree() {
    const balances = {}
    fs.readFileSync("./scripts/hildoby-dune.csv", "utf-8").split("\n").slice(1).map(r=>{
        const row = r.split(',')
        const amount = row[5].length===0?'0':row[5]
        const address= row[1].slice('<a href="https://etherscan.io/address/'.length+2, '<a href="https://etherscan.io/address/0x37582978b1aba3a076d398ef624bf680816aaa39'.length+2)
        balances[address] = Number(amount)
    })
    const csv = Object.entries(balances).map(([address, amount])=>({address, amount: amount * 1.078/1.228}))
    const tree = new MerkleTree(csv.map(x => paddedBuffer(x.address, x.amount).leaf), keccak256, { sort: true })
    return {tree, csv}
}

module.exports={
    buildTree,
    paddedBuffer
}

async function main() {
    const {tree, csv} = buildTree()
    console.log("root", tree.getHexRoot())
    const proofs = {}
    for(const {address, amount: amountNum} of csv){
        const {leaf, amount} = paddedBuffer(address, amountNum)
        const proof = tree.getHexProof(leaf)
        proofs[address] = {proof, amount}
    }
    fs.writeFileSync("proofs.json", JSON.stringify(proofs))
}

//main()