const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const fs = require('fs');

function paddedBuffer(addr, amount){
    //const [int, decimals] = amount.split('.')
    //const bigint = BigInt(int + (decimals??'').slice(0, 18).padEnd(18, '0'))
    const bigint = BigInt(Number((Number(amount)*1e18).toFixed(0))) // some precision loss
    const buf = Buffer.from(addr.substr(2).padStart(32*2, "0")+bigint.toString(16).padStart(32*2, "0"), "hex")
    return Buffer.concat([buf]);
}

async function main() {
    const csv = fs.readFileSync("./scripts/hildoby-dune.csv", "utf-8").split("\n").slice(1).map(r=>{
        const row = r.split(',')
        return {
            amount: row[5].length===0?'0':row[5],
            address: row[1].slice('<a href="https://etherscan.io/address/'.length, '<a href="https://etherscan.io/address/0x37582978b1aba3a076d398ef624bf680816aaa39'.length)
        }
    })
    const tree = new MerkleTree(csv.map(x => paddedBuffer(x.address, x.amount)), keccak256, { sort: true })
    console.log("root", tree.getHexRoot())
    const proofs = {}
    for(const {address, amount} of csv){
        const leaf = paddedBuffer(address, amount)
        const proof = tree.getHexProof(leaf)
        proofs[address]=proof
    }
    fs.writeFileSync("proofs.json", JSON.stringify(proofs))
}

main()