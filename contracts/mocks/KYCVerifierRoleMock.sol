pragma solidity ^0.4.24;

import "../utils/KYCVerifierRole.sol";

contract KYCVerifierRoleMock is KYCVerifierRole {
  function removeKYCVerifier(address account) public {
    _removeKYCVerifier(account);
  }

  function onlyKYCVerifierMock() public view onlyKYCVerifier {
  }

  // Causes a compilation error if super._removeKYCVerifier is not internal
  function _removeKYCVerifier(address account) internal {
    super._removeKYCVerifier(account);
  }
}
