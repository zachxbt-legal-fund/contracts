const fs = require('fs');

async function main(){
    let total = []
    for (let i = 0; i<1000; i+=100){
        const data = await fetch(`https://www.oklink.com/api/explorer/v2/zksync/addresses/0x6ea158145907a1fac74016087611913a96d96624/transfers/condition/token?t=1693782946164&offset=${i}&limit=100&address=0x6ea158145907a1fac74016087611913a96d96624&start=&end=&direction=3&otherAddress=&value=&valueUpperLimit=&tokenType=ERC20&nonzeroValue=true`, {
            headers: {
                "x-apikey": "xxx"
            }
        }).then(r=>r.json())
        total = total.concat(data.data.hits)
    }
    fs.writeFileSync("zksync.json", JSON.stringify(total))
    console.log(total.length)
}

main()