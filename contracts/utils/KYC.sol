pragma solidity ^0.4.24;

import "./KYCVerifierRole.sol";

/**
 * @title KYC
 * @dev Implements a list of accounts that have been reviewed and authorized
 * after a KYC process.. Since it is less critical than owning the contract,
 * the role of KYC can be accomplished by several addresses, which is
 * implemented using a custom KYCVerifierRole.
 */
contract KYC is KYCVerifierRole {

    event KYCAuthorizationGranted(address indexed by, address indexed account);
    event KYCAuthorizationReverted(address indexed by, address indexed account);

    mapping(address => bool) private _authorizedAccounts;

    /**
     * @return true if `account` has been KYC authorized.
     */
    function kycAuthorized(address account) public view returns (bool) {
      return _authorizedAccounts[account];
    }

    /**
     * @dev Allows a KYC verifier to grant KYC authorization to accounts.
     * @param accounts Array of addresses that have been KYC authorized.
     */
    function grantKYCAuthorizations(
        address[] accounts
    )
        public
        onlyKYCVerifier
    {
        for (uint256 i = 0; i < accounts.length ; i++) {
            _authorizedAccounts[accounts[i]] = true;
            emit KYCAuthorizationGranted(msg.sender, accounts[i]);
        }
    }

    /**
     * @dev Allows a KYC verifier to revert previous KYC authorization to accounts.
     * @param accounts The addresses that have been KYC reverted.
     */
    function revertKYCAuthorizations(
        address[] accounts
    )
        public
        onlyKYCVerifier
    {
        for (uint256 i = 0; i < accounts.length ; i++) {
            _authorizedAccounts[accounts[i]] = false;
            emit KYCAuthorizationReverted(msg.sender, accounts[i]);
        }
    }
}
