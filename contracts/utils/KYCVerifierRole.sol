pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";

contract KYCVerifierRole {
    using Roles for Roles.Role;

    event KYCVerifierAdded(address indexed account);
    event KYCVerifierRemoved(address indexed account);

    Roles.Role private kycVerifiers;

    constructor() internal {
        _addKYCVerifier(msg.sender);
    }

    modifier onlyKYCVerifier() {
        require(isKYCVerifier(msg.sender), "must be KYC verifier");
        _;
    }

    function isKYCVerifier(address account) public view returns (bool) {
        return kycVerifiers.has(account);
    }

    function addKYCVerifier(address account) public onlyKYCVerifier {
        _addKYCVerifier(account);
    }

    function renounceKYCVerifier() public {
        _removeKYCVerifier(msg.sender);
    }

    function _addKYCVerifier(address account) internal {
        kycVerifiers.add(account);
        emit KYCVerifierAdded(account);
    }

    function _removeKYCVerifier(address account) internal {
        kycVerifiers.remove(account);
        emit KYCVerifierRemoved(account);
    }
}
