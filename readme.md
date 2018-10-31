# Hey mainchain contracts

## Overview
This repository hosts the source code of the Ethereum smart contracts deployed by Hey on the **mainchain**. These consist of four main contracts.

The two main contracts supporting Hey's platform are:
- The **HeyToken**, which is a plain ERC20 token using [OpenZeppelin's SimpleToken implementation](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/67dac7ae9960fd1790671a315cde56c901db5271/contracts/examples/SimpleToken.sol)
- The **Gateway**, which allows users to redeem Hey tokens when providing the rightly signed message (see full architecture). This is a stripped-down version of [Loom Network's Transfer Gateway implementation](https://github.com/loomnetwork/transfer-gateway-example/blob/master/truffle-ethereum/contracts/Gateway.sol) to keep only ERC20 withdrawal capabilities.

Besides, two smart contracts are dedicated to the Token Generation Event (TGE):
- The **VestingTrustee**, which locks tokens from early pre-sale contributors as well as from Hey's team. This is heavily inspired by [SirinLab's vesting trustee contract](https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol).
- The **HeyCrowdsale** (TGE-specific contract), implementing the TimedCrowdsale and FinalizableCrowdsale behaviours. This is mostly an extension of [OpenZeppelin's default Crowdsale contract](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/crowdsale/Crowdsale.sol) with limited customisation.

If you are looking for the social network-related features (e.g., Karma management), please checkout the **sidechain** repository.

## Contracts diagram

### Token, Crowdsale, VestingTrustee

### Gateway

## Reliance on verified code
The vast majority of Hey's sidechain contracts leverage existing, previously audited open-source contract libraries. This table recaps the exact version of each open-source component used in the contracts:

| Domain | File        | Provider           | Source  | Commit hash |
| ------------- | ------------- | ------------- |------------- |------------- |
| Token | ERC20.sol | OpenZeppelin | source | commit |
