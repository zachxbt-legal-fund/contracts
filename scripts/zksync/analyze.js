const fs = require('fs');

const zksync = JSON.parse(fs.readFileSync("./scripts/zksync/zksync.json", "utf-8"))
    .filter(t=>t.from !== "0x6ea158145907a1fac74016087611913a96d96624") // filter outgoing txs

function differentTokens(){
    const tokens = new Set()
    zksync.map(t=>tokens.add(t.tokenContractAddress))
    console.log(tokens)
}

const prices = {
    '0x503234f203fc7eb888eec8513210612a43cf6115': 1, // LUSD
    '0x000000000000000000000000000000000000800a': 1730, //eth price on 20 jun 2023
    '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4': 1, // USDC
    '0x493257fd37edb34451f62edf8d2a0c418852ba4c': 1, // usdt
    /* shitcoins
    '0xe2c55af390a0f82dd3fe29d6b31df2f756f7decd', //shitcoin
    '0x47ef4a5641992a72cfd57b9406c9d9cefee8e0c4',
    '0x47260090ce5e83454d5f05a0abbb2c953835f777',
    
    '0xa6f65bbbb723155074a1c83f25b07ec1f866c706',
    '0x9ad4c4d0800831ed69ab1289df25280ef22801ba',
    '0xd599da85f8fc4877e61f547dfacffe1238a7149e'
    */
  }

async function main(){
    const balances = {}
    zksync.forEach(t=>{
        if(!balances[t.from]){
            balances[t.from] = {zksync: 0, arbi: 0}
        }
        balances[t.from].zksync += (prices[t.tokenContractAddress] ?? 0)*t.realValue
    })
    fs.readFileSync("./scripts/zksync/arbi.csv", "utf-8").split("\n").slice(1).map(r=>{
        const row = r.split(',')
        if(!balances[row[0]]){
            balances[row[0]] = {zksync: 0, arbi: 0}
        }
        balances[row[0]].arbi += Number(row[1])
    })
    fs.writeFileSync("combined-arbi.csv", Object.entries(balances).map(t=>`${t[0]},${t[1].arbi},${t[1].zksync}`).join("\n"))
}

//differentTokens()
main()