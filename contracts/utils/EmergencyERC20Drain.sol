pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract EmergencyERC20Drain is Ownable {
    /**
    * @dev Allows owner to withdraw any ERC20 tokens sent by mistake to the contract.
    * Taken from Zilliqa's token contract: https://github.com/Zilliqa/Zilliqa-ERC20-Token
    */
    function drain(
        IERC20 token,
        uint amount
    )
        public
        onlyOwner
    {
        token.transfer(owner(), amount);
    }
}
