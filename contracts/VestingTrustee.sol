pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title VestingTrustee
 * @dev Lends very heavily from SirinLab and Stox's own VestingTrustee contracts
 */
contract VestingTrustee is Ownable {
    using SafeMath for uint256;

    // The address of the ERC20 token to vest.
    IERC20 public token;

    struct Grant {
        uint256 value;
        uint256 start;
        uint256 cliff;
        uint256 end;
        uint256 transferred;
        bool revokable;
    }

    // Grants holder.
    mapping (address => Grant) public grants;

    // Total tokens available for vesting.
    uint256 public totalVesting;

    event NewGrant(address indexed _from, address indexed _to, uint256 _value);
    event UnlockGrant(address indexed _holder, uint256 _value);
    event RevokeGrant(address indexed _holder, uint256 _refund);

    /// @dev Constructor that initializes the address of the ERC20 contract.
    /// @param _token IERC20 The address of the previously deployed ERC20 smart contract.
    constructor(
        IERC20 _token
    )
        public
    {
        require(_token != address(0), "token cannot be zero address");

        token = _token;
    }

    /// @dev Grant tokens to a specified address.
    /// @param _to address The address to grant tokens to.
    /// @param _value uint256 The amount of tokens to be granted.
    /// @param _start uint256 The beginning of the vesting period.
    /// @param _cliff uint256 The date at which the cliff occurs.
    /// @param _end uint256 The end of the vesting period.
    /// @param _revokable bool Whether the grant is revokable or not.
    function createGrant(
        address _to,
        uint256 _value,
        uint256 _start,
        uint256 _cliff,
        uint256 _end,
        bool _revokable
    )
        public
        onlyOwner
    {
        require(_to != address(0), "to cannot be zero address");
        require(_value > 0, "value must be above 0");

        // Make sure that a single address can be granted tokens only once.
        require(grants[_to].value == 0, "only one grant per address");

        // Check for date inconsistencies that may cause unexpected behavior.
        require(_start <= _cliff && _cliff <= _end, "vesting dates must be consistent");

        // Check that this grant doesn't exceed the total amount of tokens currently available for vesting.
        require(totalVesting.add(_value) <= token.balanceOf(address(this)), "grant cannot exceed total amount of tokens available");

        // Assign a new grant.
        grants[_to] = Grant({
            value: _value,
            start: _start,
            cliff: _cliff,
            end: _end,
            transferred: 0,
            revokable: _revokable
        });

        // Tokens granted, increase the total amount vested.
        totalVesting = totalVesting.add(_value);

        emit NewGrant(msg.sender, _to, _value);
    }

    /// @dev Revoke the grant of tokens of a specifed address.
    /// @param _holder The address which will have its tokens revoked.
    function revokeGrant(
        address _holder
    )
        public
        onlyOwner
    {
        Grant storage grant = grants[_holder];

        require(grant.revokable, "grant must be revokable");

        // Send the remaining ERC20 back to the owner.
        uint256 refund = grant.value.sub(grant.transferred);

        // Remove the grant.
        delete grants[_holder];

        totalVesting = totalVesting.sub(refund);
        token.transfer(msg.sender, refund);

        emit RevokeGrant(_holder, refund);
    }

    /// @dev Calculate the total amount of tokens that a holder can claim at a given time.
    /// @param _holder address The address of the holder.
    /// @param _time uint256 The specific time.
    /// @return a uint256 representing a holder's total amount of vested tokens.
    function claimableTokens(
        address _holder,
        uint256 _time
    )
        public
        view
        returns (uint256)
    {
        Grant storage grant = grants[_holder];
        if (grant.value == 0) {
            return 0;
        }

        return calculateClaimableTokens(grant, _time);
    }

    /// @dev Calculate amount of vested tokens at a specifc time.
    /// @param _grant Grant The vesting grant.
    /// @param _time uint256 The time to be checked
    /// @return An uint256 representing the amount of vested tokens of a specific grant.
    ///   |                         _/--------   vestedTokens rect
    ///   |                       _/
    ///   |                     _/
    ///   |                   _/
    ///   |                 _/
    ///   |                /
    ///   |              .|
    ///   |            .  |
    ///   |          .    |
    ///   |        .      |
    ///   |      .        |
    ///   |    .          |
    ///   +===+===========+---------+----------> time
    ///     Start       Cliff      End
    function calculateClaimableTokens(
        Grant _grant,
        uint256 _time
    )
        private
        pure
        returns (uint256)
    {
        // If we're before the cliff, then everything is still vested and nothing can be claimed.
        if (_time < _grant.cliff) {
            return 0;
        }

        // If we're after the end of the vesting period - everything is claimable;
        if (_time >= _grant.end) {
            return _grant.value;
        }

        // Interpolate all claimable tokens: claimableTokens = tokens/// (time - start) / (end - start)
        return _grant.value.mul(_time.sub(_grant.start)).div(_grant.end.sub(_grant.start));
    }

    /// @dev Unlock vested tokens and transfer them to their holder.
    /// @return a uint256 representing the amount of vested tokens transferred to their holder.
    function unlockVestedTokens()
        public
    {
        Grant storage grant = grants[msg.sender];
        require(grant.value != 0, "grant value cannot be 0");

        // Get the total amount of claimable tokens, acccording to grant.
        // solium-disable-next-line security/no-block-members
        uint256 claimable = calculateClaimableTokens(grant, block.timestamp);
        require(claimable != 0, "no tokens claimable at the moment");

        // Make sure the holder doesn't transfer more than what he already has.
        // Note that claimable will always be greater than or equal to
        // transferred by definition, so this is just an extra check.
        uint256 transferable = claimable.sub(grant.transferred);
        require(transferable != 0, "claimable amount already transferred");

        grant.transferred = grant.transferred.add(transferable);
        totalVesting = totalVesting.sub(transferable);
        token.transfer(msg.sender, transferable);

        emit UnlockGrant(msg.sender, transferable);
    }
}
