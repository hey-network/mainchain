pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./utils/EmergencyERC20Drain.sol";

/**
* @title Hey Token
* @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
* Note they can later distribute these tokens as they wish using `transfer` and other
* `ERC20` functions.
* This code is litterally a copy-paste of OpenZeppelin's Simple Token:
* https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SimpleToken.sol
*/
contract Token is ERC20, EmergencyERC20Drain {

    string public constant name = "HeyToken";
    string public constant symbol = "HEY";
    uint8 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals)); // 1 billion tokens

    /**
    * @dev From Consensys recommendations:
    * https://consensys.github.io/smart-contract-best-practices/tokens/
    * Prevent sending of the token to invalid addresses.
    */
    modifier validDestination(
        address to
    )
    {
        require(to != address(0));
        require(to != address(this));
        _;
    }

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor()
        public
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }


    /**
    * @dev From Consensys recommendations:
    * https://consensys.github.io/smart-contract-best-practices/tokens/
    * Overrides the standard ERC20 transfer to apply the validDestination
    * modifier. All else remains the same.
    */
    function transfer(
        address to,
        uint value
    )
        validDestination(to)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    /**
    * @dev From Consensys recommendations:
    * https://consensys.github.io/smart-contract-best-practices/tokens/
    * Overrides the standard ERC20 transferFrom to apply
    * the validDestination modifier. All else remains the same.
    */
    function transferFrom(
        address from,
        address to,
        uint value
    )
        validDestination(to)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }
}
