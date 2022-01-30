//Importing required modules
const Web3 = require('web3')
const axios = require('axios')
const ABIs = require('./ABI')

//Declare ABIs
const erc20ABI = ABIs.erc20ABI
const apeFactoryABI = ABIs.apeFactoryABI
const apeRouterABI = ABIs.apeRouterABI
const cafeFactoryABI = ABIs.cafeFactoryABI
const cafeRouterABI = ABIs.cafeRouterABI

//Creating a web3 instance of the polygon mainnet
const url = "https://polygon-rpc.com/"
const web3 = new Web3(url);

// Wallet Address and Addresses of the tokens
const address = '0x008062acA356B5F93F2F14b71Fd73db91A606d0C'
const DAI = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'
const USDC = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
const tokens = {
    'SHI3LD': '0xf239e69ce434c7fb408b05a0da416b14917d934e',
    'KOGECOIN': '0x13748d548D95D78a3c83fe3F32604B4796CFfa23',
    'PEAR': '0xc8bcb58caEf1bE972C0B638B1dD8B0748Fdc8A44',
    'SING': '0xCB898b0eFb084Df14dd8E018dA37B4d0f06aB26D'
}

const getBalances = async (contracts = tokens, wallet = address) => {
    //JSON object of balances for each token
    let balances = {}
    //Loops through all the tokens and finds corressponding balance
    for (let name in contracts) {
        //Creates an instance of the corresponding token's smart contract
        const contract = new web3.eth.Contract(erc20ABI, contracts[name])
        //Retrieves balance of the token in the given wallet from the Polygon network
        let balance = await contract.methods.balanceOf(wallet).call()
        balances[name] = balance
        //Next line sets the balance as the amount divided by 10^(decimal places in the contract) 
        //balances[name] = parseFloat(balance) / Math.pow(10, (await contract.methods.decimals().call()))
    }
    return balances
}

const getOneInchExchangeRates = async balances => {
    //Get list of available tokens on oneInch for the polygon network
    let availableTokens = (await axios.get('https://api.1inch.io/v4.0/137/tokens')).data.tokens
    let available = {}
    //Check which tokens that we want to exchange are available on oneInch
    for (let token in availableTokens) {
        if ((Object.keys(tokens)).includes(availableTokens[token].symbol)) available[availableTokens[token].symbol] = true
    }
    //Get the amount of DAI for the available tokens that we want to exchange
    amountInDAI = {}
    for (let token in available) {
        let quote = (await axios.get(`https://api.1inch.io/v4.0/137/quote?fromTokenAddress=${tokens[token]}&toTokenAddress=0x8f3cf7ad23cd3cadbd9735aff958023239c6a063&amount=${balances[token]}`)).data
        amountInDAI[token] = parseFloat(quote.toTokenAmount) / Math.pow(10, quote.toToken.decimals)
    }
    //Set the values for the tokens that aren't available to 0
    for (let token in tokens) {
        if (!amountInDAI[token]) amountInDAI[token] = 0
    }
    return amountInDAI
}

const getApeSwapExchangeRates = async balances => {
    //Create instances of the Apeactory and ApeRouterContracts
    const apeFactoryContract = new web3.eth.Contract(apeFactoryABI, '0xCf083Be4164828f00cAE704EC15a36D711491284')
    const apeRouterContract = new web3.eth.Contract(apeRouterABI, '0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607')

    //Shows that ApeSwap has no direct pairs between the tokens and DAI, but it does have somme for USDC
    availablePairsWithDAI = {}
    availablePairsWithUSDC = {}
    for (token in tokens) {
        let pair = await apeFactoryContract.methods.getPair(tokens[token], DAI).call()
        if (parseInt(pair, 16) != 0) availablePairsWithDAI[token] = { token: 'DAI', pair }
        pair = await apeFactoryContract.methods.getPair(tokens[token], USDC).call()
        if (parseInt(pair, 16) != 0) availablePairsWithUSDC[token] = pair
    }

    amountInDAI = {}
    if (Object.keys(availablePairsWithDAI).length === 0) {
        //Decimals for USDC and DAI
        const usdcDecimals = await (new web3.eth.Contract(erc20ABI, USDC)).methods.decimals().call()
        const daiDecimals = await (new web3.eth.Contract(erc20ABI, DAI)).methods.decimals().call()
        for (token in availablePairsWithUSDC) {
            //Decimals for the token
            const tokenDecimals = await (new web3.eth.Contract(erc20ABI, tokens[token])).methods.decimals().call()
            //Gets the amount that will be payed out in USD for 1 token
            const priceInUSDC = await apeRouterContract.methods.getAmountsOut((Math.pow(10, tokenDecimals)).toString(), [tokens[token], USDC]).call()
            //Calculates the amount that will be payed out for the amount of tokens in balances[token] with the correct amount of decimals
            const amountInUSDC = (parseFloat(priceInUSDC[1]) / Math.pow(10, usdcDecimals)) * (parseFloat(balances[token]) / Math.pow(10, tokenDecimals))

            //Gets the amount that will be payed out in DAI for 1 USDC
            const priceInDAI = await apeRouterContract.methods.getAmountsOut((Math.pow(10, usdcDecimals)).toString(), [USDC, DAI]).call()
            //Calculates the amount that will be payed out for the amountInUSDC with the correct amount of decimals
            const tokenAmountInDAI = (parseFloat(priceInDAI[1]) / Math.pow(10, daiDecimals)) * amountInUSDC

            amountInDAI[token] = tokenAmountInDAI
        }
    }

    //Set the values for the tokens that aren't available to 0
    for (let token in tokens) {
        if (!amountInDAI[token]) amountInDAI[token] = 0
    }

    return amountInDAI

}

const getCafeSwapExchangeRates = async balances => {
    //Create instances of the CafeFactory and CafeRouterContracts
    const cafeFactory = new web3.eth.Contract(cafeFactoryABI, '0x5eDe3f4e7203Bf1F12d57aF1810448E5dB20f46C')
    const cafeRouter = new web3.eth.Contract(cafeRouterABI, '0x9055682E58C74fc8DdBFC55Ad2428aB1F96098Fc')

    //Shows that CafeSwap has no direct pairs between the tokens and DAI, but it does have somme for USDC
    availablePairsWithDAI = {}
    availablePairsWithUSDC = {}
    for (token in tokens) {
        let pair = await cafeFactory.methods.getPair(tokens[token], DAI).call()
        if (parseInt(pair, 16) != 0) availablePairsWithDAI[token] = { token: 'DAI', pair }
        pair = await cafeFactory.methods.getPair(tokens[token], USDC).call()
        if (parseInt(pair, 16) != 0) availablePairsWithUSDC[token] = pair
    }

    amountInDAI = {}
    if (Object.keys(availablePairsWithDAI).length === 0) {
        //Decimals for USDC and DAI
        const usdcDecimals = await (new web3.eth.Contract(erc20ABI, USDC)).methods.decimals().call()
        const daiDecimals = await (new web3.eth.Contract(erc20ABI, DAI)).methods.decimals().call()
        for (token in availablePairsWithUSDC) {
            //Decimals for the token
            const tokenDecimals = await (new web3.eth.Contract(erc20ABI, tokens[token])).methods.decimals().call()
            //Gets the amount that will be payed out in USD for 1 token
            const priceInUSDC = await cafeRouter.methods.getAmountsOut((Math.pow(10, tokenDecimals)).toString(), [tokens[token], USDC]).call()
            //Calculates the amount that will be payed out for the amount of tokens in balances[token] with the correct amount of decimals
            const amountInUSDC = (parseFloat(priceInUSDC[1]) / Math.pow(10, usdcDecimals)) * (parseFloat(balances[token]) / Math.pow(10, tokenDecimals))

            //Gets the amount that will be payed out in DAI for 1 USDC
            const priceInDAI = await cafeRouter.methods.getAmountsOut((Math.pow(10, usdcDecimals)).toString(), [USDC, DAI]).call()
            //Calculates the amount that will be payed out for the amountInUSDC with the correct amount of decimals
            const tokenAmountInDAI = (parseFloat(priceInDAI[1]) / Math.pow(10, daiDecimals)) * amountInUSDC

            amountInDAI[token] = tokenAmountInDAI
        }
    }

    //Set the values for the tokens that aren't available to 0
    for (let token in tokens) {
        if (!amountInDAI[token]) amountInDAI[token] = 0
    }

    return amountInDAI
}

const comparePrices = async (oneInch, apeSwap, cafeSwap) => {
    let maxAmounts = {}
    for (token in tokens) {
        const arr = [oneInch[token], apeSwap[token], cafeSwap[token]]
        const max = Math.max(...arr)
        maxAmounts[token] = { amount: max, exchange: arr.indexOf(max) == 0 ? "1inch" : arr.indexOf(max) == 1 ? "Apeswap" : "Cafeswap" }
    }
    return maxAmounts
}

//main function for the program: calls the functions above to get the best case amount of DAI
const main = async () => {
    const balances = await getBalances()
    const oneInchDAI = await getOneInchExchangeRates(balances)
    const apeSwapDAI = await getApeSwapExchangeRates(balances)
    const cafeSwapDAI = await getCafeSwapExchangeRates(balances)
    const bestRates = await comparePrices(oneInchDAI, apeSwapDAI, cafeSwapDAI)

    console.log("Maximum Amount of DAI and the exchange to use for each token:")
    console.log(bestRates)
    let totalDAI = 0
    for (token in bestRates) {
        totalDAI += bestRates[token].amount
    }
    console.log("Total amount of DAI: " + totalDAI)
}

main()
