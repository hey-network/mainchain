pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./gateway/ValidatorsManagerContract.sol";
import "./gateway/ERC20Receiver.sol";

contract ERC20Token {
    function transfer(address to, uint256 value) public returns (bool);
}

contract Gateway is ERC20Receiver, ValidatorsManagerContract {

    using SafeMath for uint256;

    // From user to ERC20 balance
    mapping (address => uint256) balances;
    // ERC20 contract address (HEY token)
    address tokenAddress;

    event ERC20Withdrawn(address indexed owner, uint256 value);
    event ERC20Received(address from, uint256 amount);

    constructor (
        address _tokenAddress,
        address[] _validators,
        uint8 _threshold_num,
        uint8 _threshold_denom
    )
        public
        ValidatorsManagerContract(_tokenAddress, _validators, _threshold_num, _threshold_denom)
    {
        tokenAddress = _tokenAddress;
    }

    function withdrawERC20(
        uint256 amount,
        bytes signature
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
