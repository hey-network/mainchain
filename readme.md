![](https://travis-ci.org/hey-network/mainchain.svg?branch=master)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2abd2b958d7fed6203e4/test_coverage)](https://codeclimate.com/github/hey-network/mainchain/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/2abd2b958d7fed6203e4/maintainability)](https://codeclimate.com/github/hey-network/mainchain/maintainability)

# Hey mainchain contracts

This repository hosts the source code of the Ethereum smart contracts deployed by Hey on the **mainchain**.

> 📘 If you are looking for the **full description** of Hey's project, consult our **[Manifesto](https://manifesto.hey.network)**.


## ⚠️ Disclaimers
This code and its readme are **still work in progress** and should be considered as such until official communication is made from the Hey team that it has been reviewed and audited. Audit results will be made publicly available once their recommendation has been processed.

Through this document, elements that are **~~stricken through~~** should be considered **even more work in progress** as they are still subject to potentially significant changes.

A **bug bounty** program will likely be considered for product-specific smart contracts (both on the sidechain and mainchain). Stay tuned if you are a Solidity nerd and are excited by this opportunity.


## 📮 Contracts addresses
~~Will be populated after production deployment.~~

## 🎯 Design principles

More than 95% of the mainchain codebase relies on standard, open-source, previously audited contracts. The Token Generation Event (TGE) smart contracts are mostly out-of-box OpenZeppelin's library contracts, while the Gateway contract leverage Loom Network's example.

This approach has been chosen deliberately so that the Hey Team can:
- Get a faster time-to-market
- Decrease security auditing complexity and cost while minimising the likelihood of bugs
- Increase TGE's participants' trust
- Spend more time and energy on specificities of the Hey product that are mostly present on the sidechain contracts ecosystem, and which are the differentiating factor and competitive advantage of Hey as a platform

The Hey Team has taken great care to track provenance of open-source components, and has made sure to thoroughly review each component internally to get a deep grasp of their interface and implementation.


## 🔭 Codebase overview


### Introduction
This repository consists of four main contracts.

The two main contracts supporting Hey's platform are:
- The **Token**, which is a plain ERC20 token using OpenZeppelin's `SimpleToken` [implementation](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/67dac7ae9960fd1790671a315cde56c901db5271/contracts/examples/SimpleToken.sol)
- The **Gateway**, which allows users to redeem Hey tokens when providing the rightly signed message (see full architecture). This is a stripped-down version of Loom Network's `Transfer Gateway` [implementation](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol) to keep only ERC20 withdrawal capabilities.

Besides, two smart contracts are dedicated to the Token Generation Event (TGE):
- The **VestingTrustee**, which locks tokens from early pre-sale contributors as well as from Hey's team. This is heavily inspired by SirinLab and Stox's `VestingTrustee` [contract](https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol).
- The **TokenSale** (TGE-specific contract), implementing the `TimedCrowdsale`, `FinalizableCrowdsale`, and `Pausable` behaviours. This is mostly an extension of OpenZeppelin's default `Crowdsale` [contract](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) with limited customisation.

If you are looking for the social network-related features (e.g., Karma management), please checkout the **sidechain** repository.


### Contracts diagrams
These diagrams express the inheritance and usage relationships amongst contracts. Contracts in blue are the ones that effectively get deployed on the mainchain, composing from higher-level contracts.

#### Token, TokenSale, VestingTrustee

![TGE contracts diagram](https://raw.githubusercontent.com/hey-network/mainchain/master/_readme_assets/TGE%20contracts%20diagram.png)

#### Gateway

![Gateway diagram](https://raw.githubusercontent.com/hey-network/mainchain/master/_readme_assets/Gateway%20diagram.png)


## 💪 Reliance on audited open-source code
The vast majority of Hey's sidechain contracts leverage existing, previously audited open-source contract libraries. This table recaps the exact version of each open-source component used in the contracts:


### Code reused *as-is* with no modification

| Domain | File        | Provider           | Source  | Commit hash |
| ------------- | ------------- | ------------- |------------- |------------- |
| Token | ERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol) | fd4de776519e2bd64dc6ac0efb87e0f603c6608f |
| Token | IERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/IERC20.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 |
| Token | SafeERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/SafeERC20.sol) | bbe804a14bf901bc5f1742ec58665d4b5fd1a2c4 |
| TGE | Crowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) | 6d415c508be94ef8391ed6525df365452466da76 |
| TGE | TimedCrowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/TimedCrowdsale.sol) | 1c5f16ae2659c3c158baebff077cc414fd9c5991 |
| TGE | FinalizableCrowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/distribution/FinalizableCrowdsale.sol) | 5bb865218f02a01d0521c9d9a947cdf4bd32e74c |
| Gateway | ValidatorsManagerContract.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ValidatorManagerContract.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Gateway | ECVerify.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ECVerify.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Gateway | ERC20Receiver.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ERC20Receiver.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Utils | Ownable.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) | 96d6103e0b70c5a09005bc77cf5bb9310fb90ac3 |
| Utils | Pausable.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/45c0c072d11dc90f756575d1d644394deb35c594/contracts/lifecycle/Pausable.sol) | 45c0c072d11dc90f756575d1d644394deb35c594 |
| Utils | Math.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/Math.sol) | a3e312d133f9df1942b96b39cd007c883cd0331f |
| Utils | SafeMath.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 |
| Utils | ReentrancyGuard.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/utils/ReentrancyGuard.sol) | 6d415c508be94ef8391ed6525df365452466da76 |

Note that the Pausable contract leverages a version of the contract that predated migration to a Roles-based ownership system. We prefer to stick to a single owner for the sake of simplicity, especially given the limited number of actions that can be performed by the owner in the context of the TGE (that is, only call `pause()`).


### Code taken *as basis* for custom Hey contracts

| Domain | File   | Provider           | Source  | Modifications brought |
| ----- | ------- | ------------- |------------- |------ |
| Token | Token.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SimpleToken.sol) | Set tokens parameters (`supply`, `name`, `symbol`) |
| TGE | VestingTrustee.sol | SirinLab | [source](https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol) | Make `Ownable` i.o. `Claimable`, change `Sirin` to `Hey` in functions and variables names, adhere to latest Solidity best practices |
| Gateway | Gateway.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol)  | Keep only ERC20 transfer capabilities, locked to Token token |


## 🔵 Token characteristics and test cases

### Overall description

#### ERC20 behaviour

The Hey Token conforms to the ERC20 specifications, directly extending OpenZeppelin's related library.

#### ERC20 parameters

The Hey Token has the following parameters:

| Parameter | Value       | Comment |
| ------------- | ------------- | ------------- |
| Name | HeyToken | |
| Symbol | HEY | |
| Decimals | 18 | |
| Total supply | 1,000,000 | Minted to owner address at creation |

#### Additional behaviours

The Hey Token extends the ERC20 specifications to include two additional security features:

- `validDestination`: as per [Consensys' Best Practices](https://consensys.github.io/smart-contract-best-practices/tokens/), prevents the sending of Hey Tokens to the Hey Token contract itself. It does so with a modifier added to the `transfer()` and `transferFrom()` functions.
- `EmergencyERC20Drain`: as per [Zilliqua's Token Contract](https://github.com/Zilliqa/Zilliqa-ERC20-Token), allows the owner to salvage any ERC20 tokens sent to the contract by mistake by draining them to the owner address. It does so with the `drain()` functions.

### Specifications and related tests

The full token test suite can be run with the command `npm run test:token`. Each specification of the token can also be verified individually with its dedicated test:

| Characteristic | Test command |
| ------------- | ------------- |
| Name is `HeyToken` | `npm run test:token:name` |
| Symbol is `HEY` | `npm run test:token:symbol` |
| Number of decimals is `18` | `npm run test:token:decimals` |
| Total supply is `1,000,000,000` | `npm run test:token:supply` |
| Cannot receive Hey Tokens (`validDestination` behaviour) | `npm run test:token:valid-destination` |
| Conforms to ERC20 transfers interface (required check due to extention of `transfer()` and `transferFrom()` functions) | `npm run test:token:transfers` |
| Allows owner to drain ERC20 tokens sent by mistake | `npm run test:token:drain` |

### Characteristics


### Test cases


## 🛒 TokenSale characteristics and test cases


### Characteristics


### Test cases


## 🚀 Deployment


### First phase: Token and TokenSale
The first deployment phase intends on making the platform fully ready for the TGE. It does not include yet the Gateway contract deployment as it will still be pending thorough code review and auditing by then (as this audit will be partly supported by funds collected during the TGE).

#### Prerequisites
- Connection to the Ethereum mainnet
- Latest version of contracts builds (run compilation with `truffle compile`)
- Fully green specs (run tests with `npm t`)
- Secured control of TGEAdmin account, with enough ETH on account for contract deployment
- Secured control of Pool account
- Secured control of Team account
- Secured control of Wallet account
- List of presale buyers non-vested addresses with number of tokens per account (`PRESALE_NON_VESTED` tokens in total)
- List of presale buyers vested addresses with number of tokens purchased per address and vesting period if any (`PRESALE_VESTED` tokens in total)

#### Outcome
- Token contract deployed
- TokenSale contract deployed
- VestingTrustee contract deployed
- 1,000,000,000 tokens minted
- 300,000,000 tokens on Pool account
- `PRESALE_NON_VESTED` tokens distributed amongst presale non-vested buyers accounts
- `PRESALE_VESTED` (for presale buyers) + ~~200,000,000~~ (for the Hey team, contributors and advisors) tokens controlled by the VestingTrustee contract, with a balance per vested account
- (500,000,000 - `PRESALE`) of tokens controlled by the TokenSale contract, where `PRESALE` = `PRESALE_NON_VESTED` + `PRESALE_VESTED`
- TokenSale contract ready to accept ETH payments against HEY tokens
- TokenSale contract funneling incoming ETH to Wallet account
- TokenSale contract configured to send potential remaining tokens post-TGE to Pool account

#### Choreography

All actions performed below should originate from the TGEAdmin account. After deployment, this address should be kept secure as it is still able to call `pause()` on the TokenSale contract (no other actions allowed on any other contracts). The deployment script is the following:

1. **Deploy Token** (no constructor parameters needed)
2. **Deploy TokenSale**, with constructor parameters:
    - `openingTime`: ~~TBC~~
    - `closingTime`: ~~TBC~~
    - `firstDayRate`: 5500
    - `rate`: 5000
    - `wallet`: Wallet account address
    - `pool`: Pool account address
    - `token`: Token contract address (from previous step)
3. **Deploy VestingTrustee**, with constructor parameter:
    - `token`: Token contract address (from previous step)
4. **Send** 300,000,000 tokens to Pool account
5. **Send** (500,000,000 - `PRESALE`) tokens to the TokenSale contract address
6. **Send** `PRESALE_NON_VESTED` tokens in total to presale non-vested buyers accounts as per the distribution list (multiple transactions)
7. **Send** `PRESALE_VESTED` + ~~200,000,000~~ tokens to the VestingTrustee contract address (from previous step)
8. **Call** the `createGrant()` function on the VestingTrustee contract once for each presale vested buyer as well as for the Team account with following parameters:
    - `to`: presale buyer account
    - `value`: presale tokens amount purchased (must include 18 decimals)
    - `start`: ~~current time~~
    - `cliff`: ~~TBC~~
    - `end`: ~~TBC~~
    - `revokable`: false

This deployment script is executed via a `nodejs` script using an `HDWallet` over an Infura proxy (TBC: ideally, sign transactions from Ledger hardware wallet rather than sourcing from ENV). ~~The full deployment script code is in [this file](TODO). This script and its outcome are tested in [this file](TODO).~~


### Second phase: Gateway
This phase will be further documented as the code review and audit progresses. Initally, the tokens to be controlled by the Gateway will be stored on the Pool account. When the Gateway will be deployed, it will benefit from an `allowance` granted to it by the Pool account so that it can distribute tokens on its behalf.

## Security checks

### Tools used to check the code
- SmartCheck (online tool): https://tool.smartdec.net/, using link to GitHub repo
- Securify (online tool): https://securify.chainsecurity.com/, using zipped repo
- Mythril: `npm run mythril` (must be fixed for TokenSale, investigating `--max-depth` issue)
- Oyente: https://github.com/melonproject/oyente, pull the latest Oyente Docker container, then run `docker run -v $(pwd)/contracts:/oyente/oyente/contracts -i -t luongnguyen/oyente`. You can then run `cd oyente` then `python oyente.py -s Token.sol`, and so for other contracts. Unfortunately at the time of writing, Oyente does not support the EVM and solc versions we use in this project, hence no analysis could be run.
