pragma solidity ^0.4.24;

import "./crowdsale/validation/TimedCrowdsale.sol";
import "./crowdsale/distribution/FinalizableCrowdsale.sol";
import "./lifecycle/Pausable.sol";
import "./token/IERC20.sol";
import "./math/SafeMath.sol";

/**
 * @title HeyCrowdsale
 * @dev The only deviation from OpenZeppelin's standard Crowdsale example
 * is a Pausable behaviour to freeze buying of tokens, and a funneling of
 * unsold tokens to a Pool address when the sale closes.
 */
contract HeyCrowdsale is TimedCrowdsale, FinalizableCrowdsale, Pausable {

  // Needed to compute current rate
  using SafeMath for uint256;

  // The token being sold
  IERC20 private _token;

  // Needed to compute current rate
  uint256 private _openingTime;

  // Evolving rates
  uint256 private _firstDayRate;
  uint256 private _rate;

  uint256 private _closingTime;

  // Address where potentially unsold funds are sent at finalization
  address private _pool;

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
    _openingTime = openingTime;
    _token = token;
    _firstDayRate = firstDayRate;
    _rate = rate;
    _pool = pool;
  }

  // Override of parent function to add Pausable behaviour.
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    view
  {
    super._preValidatePurchase(beneficiary, weiAmount);
    require(!paused());
  }

  // Override of parent function to reflect non-constant rate.
  function _getTokenAmount(
    uint256 weiAmount
  )
    internal
    view
    returns (uint256)
  {
    return weiAmount.mul(getCurrentRate());
  }

  // Note that the default rate() function remains available as it is inherited
  // from the Crowdsale contract.
  function getCurrentRate()
    public
    view
    returns (uint256)
  {
    if (now < (_openingTime.add(24 hours))) {
      return _firstDayRate;
    } else {
      return _rate;
    }
  }

  // Override of parent function. We extend it to have all remaining tokens
  // transferred to the Pool where they will be made redeemable.
  // This function is called by the public finalize() function. Note interestingly
  // that the finalize() public function is callable by anyone to avoid having
  // the admin prevent finalization maliciously.
  function _finalization()
    internal
  {
    super._finalization();
    uint256 remainingBalance = _token.balanceOf(address(this));
    _deliverTokens(_pool, remainingBalance);
  }
}
