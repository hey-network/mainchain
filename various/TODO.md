Currently, unable to deploy from Truffle with Nano Ledger S.

First running the following command:

```
truffle migrate --network ropstenLedger --verbose-rpc
```

Getting the following error:

```
Error encountered, bailing. Network state unknown. Review successful transactions manually.
Expected to to be of type string, encountered: undefined
```

Note the `to to` in the error message. Actually means that a `to` parameter somewhere is missing.
Strangely enough this error message does not arise when deploying on Ropsten using a simple HDWalletProvider.

The RPC payloads from both deployment methods have been compared and are exactly the same (except for the `from` address of course).

More debugging necessary.
