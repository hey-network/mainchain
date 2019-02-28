/** @title Hey Token Sale
*  @author Thomas Vanderstraeten - <thomas@hey.network>
*  Keep in mind that smart contracts still rely on experimental technology.
*/

pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./gateway/ValidatorsManager.sol";
import "./gateway/ERC20Receiver.sol";

contract ERC20Token {
    function transfer(address to, uint256 value) public returns (bool);
}

contract Gateway is ERC20Receiver, ValidatorsManager {

    using SafeMath for uint256;

    // From user to ERC20 balance
    mapping (address => uint256) public balances;
    // ERC20 contract address (HEY token)
    address public tokenAddress;

    event ERC20Withdrawn(address indexed owner, uint256 value);
    event ERC20Received(address from, uint256 amount);

    constructor (
        address _tokenAddress,
        address[] memory _validators,
        uint8 _threshold_num,
        uint8 _threshold_denom
    )
        public
        ValidatorsManager(_tokenAddress, _validators, _threshold_num, _threshold_denom)
    {
        tokenAddress = _tokenAddress;
    }

    function withdrawERC20(
        uint256 amount,
        bytes calldata signature
    )
        external
        isVerifiedByValidator(amount, signature)
    {
        // This transfer transaction depletes the ERC20 balance of the Gateway
        // contract itself - using the balance provisioned by the admin.
        ERC20Token(tokenAddress).transfer(msg.sender, amount);
        emit ERC20Withdrawn(msg.sender, amount);
    }

    function onERC20Received(
        address _from,
        uint256 amount
    )
        public
        returns (bytes4)
    {
        emit ERC20Received(_from, amount);
        return ERC20_RECEIVED;
    }
}
