pragma solidity ^0.4.24;

import "./crowdsale/validation/TimedCrowdsale.sol";
import "./crowdsale/distribution/FinalizableCrowdsale.sol";
import "./token/IERC20.sol";
import "./math/SafeMath.sol";

/**
 * @title SampleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 *
 * This code is primarily a copy-paste of OpenZeppelin's Sample Crowdsale:
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SampleCrowdsale.sol
 */
// XXX There doesn't seem to be a way to split this line that keeps solium
// happy. See:
// https://github.com/duaraghav8/Solium/issues/205
// --elopio - 2018-05-10
// solium-disable-next-line max-len
contract HeyCrowdsale is TimedCrowdsale, FinalizableCrowdsale {

  // Needed to compute current rate
  using SafeMath for uint256;

  // The token being sold
  IERC20 private _token;

  // Evolving rates
  uint256 private _firstDayRate;
  uint256 private _rate;

  uint256 private _closingTime;

  // Address where unsold funds are sent at finalization
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
    _token = token;
    _firstDayRate = firstDayRate;
    _rate = rate;
    _pool = pool;
  }

  // Inspired by SirinLab's crowdsale contract:
  // https://github.com/sirin-labs/crowdsale-smart-contract/blob/master/contracts/SirinVestingTrustee.sol
  // Note that the rate() function remains available as it is inherited from the
  // Crowdsale contract.
  function getCurrentRate() public view returns (uint256) {
    if (now < (startTime.add(24 hours))) {
      return _firstDayRate;
    } else {
      return _rate;
    }
  }

  // Override of Crowdsale's default function to reflect changing rate.
  function _getTokenAmount(uint256 weiAmount)
    internal view returns (uint256)
  {
    return weiAmount.mul(getCurrentRate());
  }

  // Inheritance of Crowdsale's default internal function for finalization. We extend
  // it to have all remaining tokens transferred to the Pool where they will be
  // made redeemable by users after Gateway Validator validation.
  // This function is called by the public finalize() function. Note interestingly
  // that this finalize() public function is callable by anyone to avoid having
  // the admin prevent finalization maliciously.
  function _finalization() internal {
    super._finalization();
    remainingBalance = _token.balanceOf(address(this));
    _deliverTokens(_pool, remainingBalance);
  }
}
