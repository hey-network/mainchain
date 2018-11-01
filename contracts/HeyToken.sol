pragma solidity ^0.4.24;

import "./token/ERC20.sol";

/**
* @title SimpleToken
* @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
* Note they can later distribute these tokens as they wish using `transfer` and other
* `ERC20` functions.
* This code is litterally a copy-paste of OpenZeppelin's Simple Token:
* https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SimpleToken.sol
*/
contract HeyToken is ERC20 {

    string public constant name = "HeyToken";
    string public constant symbol = "HEY";
    uint8 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals)); // 1 billion tokens

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor()
        public
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
