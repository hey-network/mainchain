pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./utils/EmergencyERC20Drain.sol";

contract Token is ERC20, ERC20Detailed, EmergencyERC20Drain {

    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals())); // 1 billion tokens

    /**
    * @dev From Consensys recommendations:
    * https://consensys.github.io/smart-contract-best-practices/tokens/
    * Prevent sending of the token to invalid addresses.
    * Note that the address(0) check is already performed under ERC20 standard.
    */
    modifier validDestination(
        address to
    )
    {
        require(to != address(this), "cannot send to contract itself");
        _;
    }

    /**
    * @dev Constructor that gives msg.sender all of existing tokens.
    */
    constructor()
        public
        ERC20Detailed("HeyToken", "HEY", 18)
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
        public
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
        public
        validDestination(to)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }
}
