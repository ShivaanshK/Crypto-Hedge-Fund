//Importing required modules
const Web3 = require('web3')
const axios = require('axios');

//Creating a web3 instance of the polygon mainnet
const url = "https://polygon-rpc.com/";
const web3 = new Web3(url);

// Wallet Address and Addresses of the tokens
const address = '0x008062acA356B5F93F2F14b71Fd73db91A606d0C'
const DAI = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
const tokens = {
    'SHI3LD': '0xf239e69ce434c7fb408b05a0da416b14917d934e',
    'KOGECOIN': '0x13748d548D95D78a3c83fe3F32604B4796CFfa23',
    'PEAR': '0xc8bcb58caEf1bE972C0B638B1dD8B0748Fdc8A44',
    'SING': '0xCB898b0eFb084Df14dd8E018dA37B4d0f06aB26D'
}

//ABI for ERC20 Contracts
const ABI = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "type": "function"
    }
];

const getBalances = async (contracts = tokens, wallet = address) => {
    //JSON object of balances for each token
    let balances = {}

    //Loops through all the tokens and finds corressponding balance
    for (let name in contracts) {
        //Creates an instance of the corresponding token's smart contract
        let contract = new web3.eth.Contract(ABI, contracts[name]);
        //Retrieves balance of the token in the given wallet from the Polygon network
        let balance = await contract.methods.balanceOf(wallet).call();
        balances[name] = balance
        //Next line sets the balance as the amount divided by 10^(decimal places in the contract) 
        //balances[name] = parseFloat(balance) / Math.pow(10, (await contract.methods.decimals().call()))
    }

    return balances;
}

const getOneInchExchangeRates = async (balances) => {
    //Get list of available tokens on oneInch for the polygon network
    let availableTokens = (await axios.get('https://api.1inch.io/v4.0/137/tokens')).data.tokens
    let available = {}
    //Check which tokens that we want to exchange are available on oneInch
    for (let token in availableTokens) {
        if((Object.keys(tokens)).includes(availableTokens[token].symbol)) available[availableTokens[token].symbol] = true        
    }
    //Get the amount of DAI for the available tokens that we want to exchange
    amountInDAI = {}
    for (let token in available) {
        let quote = (await axios.get(`https://api.1inch.io/v4.0/137/quote?fromTokenAddress=${tokens[token]}&toTokenAddress=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&amount=${balances[token]}`)).data      
        amountInDAI[token] = parseFloat(quote.toTokenAmount) / Math.pow(10,quote.toToken.decimals) 
    }
    //Set the values for the tokens that aren't available to 0
    for(token in tokens) {
        if(!amountInDAI[token]) amountInDAI[token] = 0
    }
    return amountInDAI
}

const getApeSwapExchangeRates = async (balances) => {
    
}

const main = async () => {
    const balances = await getBalances()
    console.log(balances)
    const oneInchDAI = await getOneInchExchangeRates(balances)
    console.log(oneInchDAI)
    const apeSwapDAI = await getApeSwapExchangeRates(balances)
    console.log(apeSwapDAI)
}

main()
