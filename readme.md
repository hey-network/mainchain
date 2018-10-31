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

| Domain | File        | Provider           | Source  | Commit hash |
| ------------- | ------------- | ------------- |------------- |------------- |
| Token | ERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol) | fd4de776519e2bd64dc6ac0efb87e0f603c6608f |
| Token | IERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/IERC20.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 |
| Token | SafeERC20.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/SafeERC20.sol) | bbe804a14bf901bc5f1742ec58665d4b5fd1a2c4 |
| TGE | Crowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) | 6d415c508be94ef8391ed6525df365452466da76 |
| TGE | TimedCrowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/validation/TimedCrowdsale.sol) | 1c5f16ae2659c3c158baebff077cc414fd9c5991 |
| TGE | FinalizableCrowdsale.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/distribution/FinalizableCrowdsale.sol) | 5bb865218f02a01d0521c9d9a947cdf4bd32e74c |
| TGE | VestingTrustee.sol | SirinLab | [source]() |  |
| Gateway | ValidatorsManagerContract.sol | Loomx | [source]() |  |
| Gateway | ECVerify.sol | Loomx | [source]() |  |
| Gateway | ERC20Receiver.sol | Loomx | [source]() |  |
| Utils | Ownable.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) | 96d6103e0b70c5a09005bc77cf5bb9310fb90ac3 |
| Utils | Pausable.sol | OpenZeppelin | [source]() |  |
| Utils | Math.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/Math.sol) | a3e312d133f9df1942b96b39cd007c883cd0331f |
| Utils | SafeMath.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol) | 9b3710465583284b8c4c5d2245749246bb2e0094 |
| Utils | ReentrancyGuard.sol | OpenZeppelin | [source](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/utils/ReentrancyGuard.sol) | 6d415c508be94ef8391ed6525df365452466da76 |

## Token characteristics and test cases

### Requirements

### Test cases

## Crowdsale characteristics and test cases

### Requirements

### Test cases

## Deployment dynamics
