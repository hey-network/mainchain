/** @title Hey Token Sale
 *  @author Thomas Vanderstraeten - <thomas@get-hey.com>
 *  This smart contract has undertaken X audit and X bounty program.
 *  However, keep in mind that smart contracts still rely on experimental technology.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./utils/KYC.sol";

/**
 *  @title Hey Token Sale
 *  @dev The only deviations from OpenZeppelin's standard Crowdsale example
 *  is a Pausable behaviour to freeze buying of tokens, and a funneling of
 *  unsold tokens to a Pool address when the sale closes.
 *  Note that we are naming this contract 'TokenSale' to not redeclare the parent
 *  Crowdsale contract, from which Sale indirectly inherits.
 */
contract TokenSale is TimedCrowdsale, FinalizableCrowdsale, Pausable, KYC {

    /* *** Libraries *** */
    using SafeMath for uint256;


    /* *** Sale Parameters *** */
    // Constants
    uint256 private constant MINIMUM_CONTRIBUTION = 0.1 ether; // Minimum contribution
    uint256 private constant FIRST_DAY_DURATION = 24 hours;    // Duration of the first sale day
    // Initialized at contract deployment
    uint256 private _openingTime;   // When the sale starts
    uint256 private _firstDayRate;  // The ETH-to-Token rate for the first day
    uint256 private _rate;          // The ETH-to-Token rate after the first day
    address private _pool;          // The address where unsold tokens are sent at finalization
    IERC20 private _token;          // The token which is sold


    /* *** State-Modifying Functions *** */

    /** @dev Constructor. First contract set up (tokens will also need to be transferred to the contract afterwards)
     *  @param openingTime Time the sale will start in seconds since the Unix Epoch
     *  @param closingTime Time the sale will close in seconds since the Unix Epoch
     *  @param firstDayRate ETH-to-Token rate for the first day of the sale
     *  @param rate ETH-to-Token rate after the first day of the sale
     *  @param wallet The party which will get the funds of the token sale
     *  @param pool The party which will get the unsold tokens at closing of the sale
     *  @param token The ERC20 token being sold
     */
    constructor(
        uint256 openingTime,
        uint256 closingTime,
        uint256 firstDayRate,
        uint256 rate,
        address wallet,
        address pool,
        IERC20 token
    )
        public
        Crowdsale(rate, wallet, token)
        TimedCrowdsale(openingTime, closingTime)
    {
        require(firstDayRate > 0, "first day rate must be above 0");
        require(pool != address(0), "pool cannot be the zero address");

        _openingTime = openingTime;
        _firstDayRate = firstDayRate;
        _rate = rate;
        _pool = pool;
        _token = token;
    }

    /** @dev Called when the sale is finalized - extension of OpenZeppelin's
     *  standard function. We extend it to have all potentially unsold tokens
     *  transferred to the Pool (where they will be made redeemable).
     *  This function is called by the public finalize() function.
     *  Note interestingly that the caller finalize() public function is callable
     *  by anyone to avoid having the admin prevent finalization maliciously.
     */
    function _finalization()
        internal
    {
        super._finalization();
        uint256 remainingBalance = _token.balanceOf(address(this));
        _deliverTokens(_pool, remainingBalance);
    }


    /* *** Internal View Functions *** */

    /** @dev Called before any purchase is confirmed - extension of OpenZeppelin's
     *  standard function to implement the Pausable, MinimumContribution and KYC
     *  behaviours as requirements.
     *  Note that OpenZeppelin's implementation choice has been to have this
     *  function as a view function, although it does not have a return value.
     *  @param beneficiary The party that wishes to receive tokens
     *  @param weiAmount The amount sent in exchange for tokens, in Wei
     */
    function _preValidatePurchase(
        address beneficiary,
        uint256 weiAmount
    )
        internal
        view
    {
        super._preValidatePurchase(beneficiary, weiAmount);
        require(!paused(), "cannot purchase when contract is paused");
        require(msg.value >= MINIMUM_CONTRIBUTION, "contribution must be above minium authorized");
        require(kycAuthorized(beneficiary), "beneficiary must be KYC authorized");
    }

    /** @dev Override of OpenZeppelin's standard function to reflect the
     *  evolving ETH-to-Token rate.
     *  @param weiAmount The amount sent in exchange for tokens, in Wei
     *  @return uint256 The number of tokens purchasable for the Wei amount
     */
    function _getTokenAmount(
        uint256 weiAmount
    )
        internal
        view
        returns (uint256)
    {
        // Note that the decimals of ETH and Token (both 18) cancel each other
        return weiAmount.mul(getCurrentRate());
    }


    /* *** Public View Functions *** */

    /** @dev Override of OpenZeppelin's standard function to reflect the
     *  evolving ETH-to-Token rate.
     *  @return uint256 The current number of tokens purchasable for the Wei amount
     */
    function getCurrentRate()
        public
        view
        returns (uint256)
    {
        // solium-disable-next-line security/no-block-members
        if (block.timestamp < (_openingTime.add(FIRST_DAY_DURATION))) {
            return _firstDayRate;
        } else {
            return _rate;
        }
    }
}
