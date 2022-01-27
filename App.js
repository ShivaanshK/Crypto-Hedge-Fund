const Web3 = require('web3')

const url = "https://polygon-rpc.com/";
const web3 = new Web3(url);

const address = '0x008062acA356B5F93F2F14b71Fd73db91A606d0C'

const tokens = {
  'SHI3LD': '0xf239e69ce434c7fb408b05a0da416b14917d934e',
  'KOGE': '0x13748d548D95D78a3c83fe3F32604B4796CFfa23',
  'PEAR': '0xc8bcb58caEf1bE972C0B638B1dD8B0748Fdc8A44',
  'SING': '0xCB898b0eFb084Df14dd8E018dA37B4d0f06aB26D'
}

let minABI = [
    {
      "constant":true,
      "inputs":[{"name":"_owner","type":"address"}],
      "name":"balanceOf",
      "outputs":[{"name":"balance","type":"uint256"}],
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[],
      "name":"decimals",
      "outputs":[{"name":"","type":"uint8"}],
      "type":"function"
    }
  ];

  const getBalances = async (contracts = tokens, wallet = address) => {
    let balances = {}
    for (let name in contracts) {
        let contract = new web3.eth.Contract(minABI, contracts[name]);
        let balance = await contract.methods.balanceOf(wallet).call();
        balances[name] = parseInt(balance) / Math.pow(10, (await contract.methods.decimals().call()) )
    }
    return balances;
  }
  let balances = getBalances().then(res => console.log(res))
