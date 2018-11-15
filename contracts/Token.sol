/** @title Hey Token Sale
 *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
 *  This smart contract has undertaken X audit and X bounty program.
 *  However, keep in mind that smart contracts still rely on experimental technology.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./utils/EmergencyERC20Drain.sol";

/** @title Hey Token
 *  @dev A basic extension of the ERC20 standard to include additional security
 *  recommendations, mostly from Consensys' Tokens Best Practices:
 *  https://consensys.github.io/smart-contract-best-practices/tokens/
 */
contract Token is ERC20, ERC20Detailed, EmergencyERC20Drain {

    /* *** Token Parameters *** */

    /** @dev Equivalent to 1 billion tokens. Note that here we'd like to use
     *  decimals() to be DRY (and follow OZ's SimpleToken example, however
     *  this crashes the compiler).
     */
    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(18));


    /* *** Modifiers *** */

    /** @dev Prevent sending of the token to invalid addresses. Note that the
     *  address(0) check is already performed as part of the ERC20 standard.
     */
    modifier validDestination(
        address to
    )
    {
        require(to != address(this), "cannot send to contract itself");
        _;
    }


    /* *** Public Functions *** */

    /** @dev Constructor. Mints all tokens at once and give them to the contract
     *  deployer. No further minting is subsequently possible.
     */
    constructor()
        public
        ERC20Detailed("HeyToken", "HEY", 18)
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /** @dev Overrides the standard ERC20 transfer to apply the validDestination
     *  modifier. All else remains the same.
     *  @param to The address which you want to transfer to
     *  @param value The amount of tokens to be transferred
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

    /** @dev Overrides the standard ERC20 transferFrom to apply the validDestination
     *  modifier. All else remains the same.
     *  @param from The address which you want to send tokens from
     *  @param to The address which you want to transfer to
     *  @param value The amount of tokens to be transferred
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
