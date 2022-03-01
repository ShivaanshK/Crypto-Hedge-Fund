# Diffuse Project

# Task

Given a Polygon network wallet address:

`0x008062acA356B5F93F2F14b71Fd73db91A606d0C`


…and a list of tokens on the Polygon network:

`SHI3LD 0xf239e69ce434c7fb408b05a0da416b14917d934e`

`KOGE 0x13748d548D95D78a3c83fe3F32604B4796CFfa23`

`PEAR 0xc8bcb58caEf1bE972C0B638B1dD8B0748Fdc8A44`

`SING 0xCB898b0eFb084Df14dd8E018dA37B4d0f06aB26D`


Your task is to first investigate how to retrieve the wallet’s token balances by calling/interacting with smart contracts in any programming language of your choice. Note that you must directly interact with smart contracts instead of relying on a 3rd party API such as Moralis to retrieve the balances.


Once you have the token balances, you are to find out the maximum total value of the tokens in DAI (0x8f3cf7ad23cd3cadbd9735aff958023239c6a063) if they can be swapped through the following exchanges: 1inch (https://1inch.io/), Apeswap (https://apeswap.finance/), and Cafeswap (https://cafeswap.finance/). You'll want to consider which exchange gives the best exchange rate. Note the maximum value of each token and the exchange that gives the best rate.

# Instructions to execute the program

Setup:
`node.js` and `npm` must be installed on your system to run this program

Execution:
1. cd into the directory
2. run `npm i`
3. run `node App.js`

# High level approach

For simplicity, the program calls the `main()` function which in turn calls the helper functions to produce the output. In order to interact with the Polygon Network and its smart contracts, I use web3.js and connect it to https://polygon-rpc.com/. 

First, we have to retrieve the balances of each of the tokens provided: we do this by instantiating the ERC20 contract for each of these tokens and calling the `balanceOf()` method with the wallet address as the sole parameter. 

Next, we have to find the amount of DAI that each of the exchanges will give for the token balances. For the one 1inch exchange, I used their REST API. First, I retrieved the list of all tokens that are supported by them. Then, for all the available tokens, I requested a quote for how much DAI we would receive for the balance of the token. For the Apeswap and Cafeswap exchanges, I realized that there were no direct pairs between the tokens and DAI, but some tokens could be swapped for USDC and then DAI. In order to retrieve these values, I interacted with the Factory and Router contracts for each of the exchanges. I used the `getPair()` method from the Factory contracts to check which pairs existed. Then, I called the `getAmountsOut()` method in the Router contracts to retrieve the quotes and did some arithmetic to convert it to the actual token value in DAI. The `getApeSwapExchangeRates()` and `getCafeSwapExchangeRates()` functions could have been modularized, but for readability and simplicity, I chose not to for now.

Lastly, we call the `compareAmounts()` function to compare the amounts of DAI that we are retrieving for each token and exchange. Then we print the results to the console.
