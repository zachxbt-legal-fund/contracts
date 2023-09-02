const fs = require('fs');

let total = 0
fs.readFileSync("./scripts/hildoby-dune.csv", "utf-8").split("\n").slice(1).map(r=>{
    const row = r.split(',')
    const amount = row[5].length===0?'0':row[5]
    total+=Number(amount)
})
console.log(total)