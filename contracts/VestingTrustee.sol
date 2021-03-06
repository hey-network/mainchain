/** @title Hey Token Sale
*  @author Thomas Vanderstraeten - <thomas@hey.network>
*  Keep in mind that smart contracts still rely on experimental technology.
*/

pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/** @title VestingTrustee
 * @dev Lends very heavily from SirinLab and Stox's own VestingTrustee contracts.
 */
contract VestingTrustee is Ownable {

    /* *** Libraries *** */
    using SafeMath for uint256;


    /* *** Data Structures *** */
    struct Grant {
        uint256 value;
        uint256 start;
        uint256 cliff;
        uint256 end;
        uint256 transferred;
        bool revokable;
    }


    /* *** Variables *** */
    mapping (address => Grant) public grants; // Grants by holder address
    IERC20 private _token;                    // The address of the ERC20 token to vest
    uint256 private _totalVesting;            // Total tokens available for vesting


    /* *** Events *** */
    event GrantCreated(address indexed from, address indexed to, uint256 value);
    event GrantClaimed(address indexed holder, uint256 value);
    event GrantRevoked(address indexed holder, uint256 refund);


    /* *** Public Functions *** */

    /** @dev Constructor. Initializes the ERC20 token linked to the grants.
     *  @param token IERC20 The address of the previously deployed ERC20 smart contract
     */
    constructor(
        IERC20 token
    )
        public
    {
        require(address(token) != address(0), "token cannot be zero address");

        _token = token;
    }

    /** @dev Grant tokens to a specified address.
     *  @param to address The address to grant tokens to
     *  @param value uint256 The amount of tokens to be granted
     *  @param start uint256 The start of the vesting period in seconds since the Unix Epoch
     *  @param cliff uint256 The date at which the cliff occurs in seconds since the Unix Epoch
     *  @param end uint256 The end of the vesting period in seconds since the Unix Epoch
     *  @param revokable bool Whether the grant is revokable or not
     */
    function createGrant(
        address to,
        uint256 value,
        uint256 start,
        uint256 cliff,
        uint256 end,
        bool revokable
    )
        public
        onlyOwner
    {
        require(to != address(0), "to cannot be zero address");
        require(value > 0, "value must be above 0");

        // Check that no grant has previously been assigned to this address
        require(grants[to].value == 0, "only one grant per address");

        // Check for date inconsistencies that may cause unexpected behavior.
        require(start <= cliff && cliff <= end, "vesting dates must be consistent");

        // Check that this grant doesn't exceed the total amount of tokens currently available for vesting.
        require(_totalVesting.add(value) <= _token.balanceOf(address(this)), "grant cannot exceed total amount of tokens available");

        // Assign a new grant.
        grants[to] = Grant({
            value: value,
            start: start,
            cliff: cliff,
            end: end,
            transferred: 0,
            revokable: revokable
        });

        // Tokens granted, increase the total amount vested.
        _totalVesting = _totalVesting.add(value);

        emit GrantCreated(msg.sender, to, value);
    }

    /** @dev Revoke the grant of tokens of a specifed address and returns tokens
     *  to the grant contract owner.
     *  @param holder address The address which will have its grant revoked.
     */
    function revokeGrant(
        address holder
    )
        public
        onlyOwner
    {
        Grant storage grant = grants[holder];

        require(grant.revokable, "grant must be revokable");

        uint256 refund = grant.value.sub(grant.transferred);
        _totalVesting = _totalVesting.sub(refund);
        delete grants[holder];

        // Send the revoked grant tokens back to the contract owner.
        _token.transfer(msg.sender, refund);

        emit GrantRevoked(holder, refund);
    }

    /** @dev Claim vested tokens and transfer them to their holder. Note that
     *  this function has to be called by the grant holder themselves.
     */
    function claimTokens()
        public
    {
        // Get the total amount of claimable tokens, acccording to grant.
        // solium-disable-next-line security/no-block-members
        uint256 claimable = claimableTokens(msg.sender, block.timestamp);
        require(claimable != 0, "no tokens claimable currently");

        Grant storage grant = grants[msg.sender];

        // Make sure the holder doesn't transfer more than what he already has.
        // Note that claimable will always be greater than or equal to
        // transferred by definition, so this is just an extra check.
        uint256 transferable = claimable.sub(grant.transferred);
        require(transferable != 0, "claimable amount already transferred");

        grant.transferred = grant.transferred.add(transferable);
        _totalVesting = _totalVesting.sub(transferable);
        _token.transfer(msg.sender, transferable);

        emit GrantClaimed(msg.sender, transferable);
    }

    /** @dev Calculate the total amount of tokens that a holder can claim at a
     *  given time, from the total amount vested for this holder. This function
     *  does the precheck of making sure that there is actually a grant for this
     *  owner, before delegating to the private _calculateClaimableTokens()
     *  function to derive the claimable amount at the given time.
     *  @param holder address The address of the holder
     *  @param time uint256 The specific time
     *  @return a uint256 representing a holder's total amount of vested tokens
     */
    function claimableTokens(
        address holder,
        uint256 time
    )
        public
        view
        returns (uint256)
    {
        Grant storage grant = grants[holder];
        if (grant.value == 0) {
            return 0;
        }

        return _calculateClaimableTokens(grant, time);
    }

    /**
      * @return The address of the vested token
      */
    function token()
        public
        view
        returns (address)
    {
        return address(_token);
    }

    /**
      * @return The total amount of tokens currently vested
      */
    function totalVesting()
        public
        view
        returns (uint256)
    {
        return _totalVesting;
    }


    /* *** Private Functions *** */

    /** @dev Calculate amount of vested tokens at a given time for a given grant.
     *  Note that this function does not take into account any previously claimed
     *  tokens - it is the responsibility of the caller function to ensure that
     *  the grant holder does not claim the same value multiple times.
     *  @param grant Grant The vesting grant
     *  @param time uint256 The time to be checked
     *  @return An uint256 representing the amount of claimable tokens
     *
     *   |                         ____________ total value
     *   |                       _/
     *   |                     _/
     *   |                   _/
     *   |                 _/
     *   |                /
     *   |              .|
     *   |            .  |
     *   |          .    |
     *   |        .      |
     *   |      .        |
     *   |    .          |
     *   +===+===========+---------+----------> time
     *     Start       Cliff      End
     */
    function _calculateClaimableTokens(
        Grant memory grant,
        uint256 time
    )
        private
        pure
        returns (uint256)
    {
        // If we're before the cliff, then everything is still vested and nothing can be claimed.
        if (time < grant.cliff) {
            return 0;
        }

        // If we're after the end of the vesting period, the full value is claimable;
        if (time >= grant.end) {
            return grant.value;
        }

        // If we're between the cliff and the end time, interpolate linearly using
        // the formula: claimableTokens = total * (time - start) / (end - start)
        return grant.value.mul(time.sub(grant.start)).div(grant.end.sub(grant.start));
    }
}
