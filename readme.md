# Hey mainchain contracts

## Overview

### Introduction
This repository hosts the source code of the Ethereum smart contracts deployed by Hey on the **mainchain**. These consist of four main contracts.

The two main contracts supporting Hey's platform are:
- The **HeyToken**, which is a plain ERC20 token using OpenZeppelin's `SimpleToken` [implementation](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/67dac7ae9960fd1790671a315cde56c901db5271/contracts/examples/SimpleToken.sol)
- The **Gateway**, which allows users to redeem Hey tokens when providing the rightly signed message (see full architecture). This is a stripped-down version of Loom Network's `Transfer Gateway` [implementation](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol) to keep only ERC20 withdrawal capabilities.

Besides, two smart contracts are dedicated to the Token Generation Event (TGE):
- The **VestingTrustee**, which locks tokens from early pre-sale contributors as well as from Hey's team. This is heavily inspired by SirinLab's `VestingTrustee` [contract](https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol).
- The **HeyCrowdsale** (TGE-specific contract), implementing the `TimedCrowdsale`, `FinalizableCrowdsale`, and `Pausable` behaviours. This is mostly an extension of OpenZeppelin's default `Crowdsale` [contract](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) with limited customisation.

If you are looking for the social network-related features (e.g., Karma management), please checkout the **sidechain** repository.

### Contracts addresses
*Will be populated after production deployment.*

### Contracts diagram

#### Token, Crowdsale, VestingTrustee

#### Gateway

## Reliance on audited open-source code
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
| TGE | VestingTrustee.sol | SirinLab | [source](https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol) | 98ed666c19b77f044e05d8bcec47d62b3e21f88f |
| Gateway | ValidatorsManagerContract.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ValidatorManagerContract.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Gateway | ECVerify.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ECVerify.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Gateway | ERC20Receiver.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/ERC20Receiver.sol) | 24ef3c019441c293f2677b273b8eaa37cabc3c91 |
| Utils | Ownable.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) | 96d6103e0b70c5a09005bc77cf5bb9310fb90ac3 |
| Utils | Math.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/Math.sol) | a3e312d133f9df1942b96b39cd007c883cd0331f |
| Utils | SafeMath.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 |
| Utils | ReentrancyGuard.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/utils/ReentrancyGuard.sol) | 6d415c508be94ef8391ed6525df365452466da76 |

Note that for the VestingTrustee contract, Hey has changed the variable names to reflect the repurposing of the contract for Hey's TGE (e.g., changing `Sirin` prefixes to `Hey` prefixes).

### Code taken *as basis* for custom Hey contracts

| Domain | File        | Provider           | Source  | Commit hash | Changes made |
| ------------- | ------------- | ------------- |------------- |------------- |
| Token | HeyToken.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SimpleToken.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 | Set tokens parameters (`supply`, `name`, `symbol`) |
| Gateway | Gateway.sol | Loomx | [source](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol) | a14917efcb17081878f90ce33d29b280fe6f00da | Keep only ERC20 capabilities |
| Utils | Pausable.sol | OpenZeppelin | [source]() | Allow only owner to pause contract |

## Token characteristics and test cases

### Characteristics

### Test cases

## Crowdsale characteristics and test cases

### Characteristics

### Test cases

## Deployment

### First phase: Token and Crowdsale
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
- HeyToken contract deployed
- HeyCrowdSale contract deployed
- VestingTrustee contract deployed
- 1,000,000,000 tokens minted
- 300,000,000 tokens on Pool account
- `PRESALE_NON_VESTED` tokens distributed amongst presale non-vested buyers accounts
- `PRESALE_VESTED` (for presale buyers) + <span style="color:red">200,000,000</span> (for the Hey team, contributors and advisors) tokens controlled by the VestingTrustee contract, with a balance per vested account
- (500,000,000 - `PRESALE`) of tokens controlled by the HeyCrowdSale contract, where `PRESALE` = `PRESALE_NON_VESTED` + `PRESALE_VESTED`
- HeyCrowdsale contract ready to accept ETH payments against HEY tokens
- HeyCrowdsale contract funneling incoming ETH to Wallet account
- HeyCrowdSale contract configured to send potential remaining tokens post-TGE to Pool account

#### Choreography

All actions performed below should originate from the TGEAdmin account. After deployment, this address should be kept secure as it is still able to call `pause()` on the HeyCrowdsale contract (no other actions allowed on any other contracts). The deployment script is the following:

1. **Deploy HeyToken** (no constructor parameters needed)
2. **Deploy HeyCrowdSale**, with constructor parameters:
    - `openingTime`: TBC
    - `closingTime`: TBC
    - `firstDayRate`: 5500
    - `rate`: 5000
    - `wallet`: Wallet account address
    - `pool`: Pool account address
    - `token`: HeyToken contract address (from previous step)
3. **Deploy VestingTrustee**, with constructor parameter:
    - `token`: HeyToken contract address (from previous step)
4. **Send** 300,000,000 tokens to Pool account
5. **Send** (500,000,000 - `PRESALE`) tokens to the HeyCrowdSale contract address
6. **Send** `PRESALE_NON_VESTED` tokens in total to presale non-vested buyers accounts as per the distribution list (multiple transactions)
7. **Send** `PRESALE_VESTED` + 200,000,000 tokens to the VestingTrustee contract address (from previous step)
8. **Call** the `grant()` function on the VestingTrustee contract once for each presale vested buyer as well as for the Team account with following parameters:
    - `to`: presale buyer account
    - `value`: presale tokens amount purchased (must include 18 decimals)
    - `start`: current time (TBC)
    - `cliff`: time of vesting end (TBC)
    - `end`: time of vesting end (TBC)
    - `revokable`: false

This deployment script is executed via a `nodejs` script using an `HDWallet` over an Infura proxy (TBC: ideally, sign transactions from Ledger hardware wallet rather than sourcing from ENV). The full deployment script code is in [this file](TODO). This script and its outcome are tested in [this file](TODO).

### Second phase: Gateway
This phase will be further documented as the code review and audit progresses. Initally, the tokens to be controlled by the Gateway will be stored on the Pool account. When the Gateway will be deployed, it will benefit from an `allowance` granted to it by the Pool account so that it can distribute tokens on its behalf.
