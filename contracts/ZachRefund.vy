# @version ^0.3.9
"""
@title Refund Contract for ZachXBT Legal Case
@custom:contract-name ZachRefund
@license GNU Affero General Public License v3.0 only
@author pcaversaccio
"""


# @dev We import the `ERC20` interface, which is a
# built-in interface of the Vyper compiler.
from vyper.interfaces import ERC20


# @dev The 32-byte Merkle root hash.
# @notice If you declare a variable as `public`,
# Vyper automatically generates an `external`
# getter function for the variable.
MERKLE_ROOT: public(immutable(bytes32))


# @dev The ERC-20 compatible (i.e. ERC-777 is also viable)
# underlying token contract.
TOKEN: public(immutable(ERC20))


# @dev Mapping from claimant address to Boolean.
claimed: public(HashMap[address, bool])


# @dev Returns the address of the current owner.
owner: public(address)


# @dev Emitted when the ownership is transferred
# from `previous_owner` to `new_owner`.
event OwnershipTransferred:
    previous_owner: indexed(address)
    new_owner: indexed(address)


@external
@payable
def __init__(merkle_root_: bytes32, token_: ERC20):
    """
    @dev To omit the opcodes for checking the `msg.value`
         in the creation-time EVM bytecode, the constructor
         is declared as `payable`.
    @param merkle_root_ The 32-byte Merkle root hash.
    @param token_ The ERC-20 compatible (i.e. ERC-777 is also viable)
           underlying token contract.
    """
    MERKLE_ROOT = merkle_root_
    TOKEN = token_
    self._transfer_ownership(msg.sender)


@external
def retrieve_funds_eth(to: address):
    """
    @dev Retrieves all ether stored in this contract.
    @notice Note that this function can only be
            called by the current `owner`.
    @param to The 20-byte address of the receiver.
    """
    self._check_owner()
    # Note that the call will revert on a failure as this
    # is default behaviour by `raw_call`.
    raw_call(to, b"", value=self.balance)


@external
def retrieve_funds(token_from: ERC20, to: address, amount: uint256):
    """
    @dev Retrieves `amount` of an ERC-20 compatible (i.e. ERC-777
         is also viable) token stored in this contract.
    @notice Note that this function can only be
            called by the current `owner`.
    @param token_from The ERC-20 compatible (i.e. ERC-777 is also
           viable) underlying token contract.
    @param to The 20-byte address of the receiver.
    @param amount The 32-byte token amount to be sent.
    """
    self._check_owner()
    # To deal with (potentially) non-compliant ERC-20 tokens that do have
    # no return value, we use the kwarg `default_return_value` for external
    # calls. This function was introduced in Vyper version 0.3.4. For more
    # details see:
    # - https://github.com/vyperlang/vyper/pull/2839,
    # - https://github.com/vyperlang/vyper/issues/2812,
    # - https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca.
    assert token_from.transfer(to, amount, default_return_value=True), "ZachRefund: transfer operation did not succeed"


@external
def claim(proof: DynArray[bytes32, 4096], amount: uint256):
    """
    @dev Claims `amount` of an ERC-20 compatible (i.e. ERC-777
         is also viable) token stored in this contract.
    @param proof The 32-byte array containing sibling hashes
           on the branch from the `leaf` to the `root` of the
           Merkle tree.
    @param amount The 32-byte token amount to be claimed.
    """
    assert (self.claimed[msg.sender] == False and self._verify(proof, MERKLE_ROOT, keccak256(_abi_encode(msg.sender, amount)))),\
            "ZachRefund: merkle proof verification did not succeed"
    self.claimed[msg.sender] = True
    assert TOKEN.transfer(msg.sender, amount, default_return_value=True), "ZachRefund: transfer operation did not succeed"


@external
def transfer_ownership(new_owner: address):
    """
    @dev Transfers the ownership of the contract
         to a new account `new_owner`.
    @notice Note that this function can only be
            called by the current `owner`. Also,
            the `new_owner` cannot be the zero address.
    @param new_owner The 20-byte address of the new owner.
    """
    self._check_owner()
    assert new_owner != empty(address), "Ownable: new owner is the zero address"
    self._transfer_ownership(new_owner)


@external
def renounce_ownership():
    """
    @dev Leaves the contract without an owner.
    @notice Renouncing ownership will leave the
            contract without an owner, thereby
            removing any functionality that is
            only available to the owner.
    """
    self._check_owner()
    self._transfer_ownership(empty(address))


@internal
@pure
def _verify(proof: DynArray[bytes32, 4096], root: bytes32, leaf: bytes32) -> bool:
    """
    @dev Returns `True` if it can be proved that a `leaf` is
         part of a Merkle tree defined by `root`.
    @notice Each pair of leaves and each pair of pre-images
            are assumed to be sorted.
    @param proof The 32-byte array containing sibling hashes
           on the branch from the `leaf` to the `root` of the
           Merkle tree.
    @param root The 32-byte Merkle root hash.
    @param leaf The 32-byte leaf hash.
    @return bool The verification whether `leaf` is part of
            a Merkle tree defined by `root`.
    """
    return self._process_proof(proof, leaf) == root


@internal
@pure
def _process_proof(proof: DynArray[bytes32, 4096], leaf: bytes32) -> bytes32:
    """
    @dev Returns the recovered hash obtained by traversing
         a Merkle tree from `leaf` using `proof`.
    @notice Each pair of leaves and each pair of pre-images
            are assumed to be sorted.
    @param proof The 32-byte array containing sibling hashes
           on the branch from the `leaf` to the `root` of the
           Merkle tree.
    @param leaf The 32-byte leaf hash.
    @return bytes32 The 32-byte recovered hash by using `leaf`
            and `proof`.
    """
    computed_hash: bytes32 = leaf
    for i in proof:
        computed_hash = self._hash_pair(computed_hash, i)
    return computed_hash


@internal
@pure
def _hash_pair(a: bytes32, b: bytes32) -> bytes32:
    """
    @dev Returns the keccak256 hash of `a` and `b` after concatenation.
    @notice The concatenation pattern is determined by the sorting assumption
            of hashing pairs.
    @param a The first 32-byte hash value to be concatenated and hashed.
    @param b The second 32-byte hash value to be concatenated and hashed.
    @return bytes32 The 32-byte keccak256 hash of `a` and `b`.
    """
    if (convert(a, uint256) < convert(b, uint256)):
        return keccak256(concat(a, b))
    else:
        return keccak256(concat(b, a))


@internal
def _check_owner():
    """
    @dev Throws if the sender is not the owner.
    """
    assert msg.sender == self.owner, "Ownable: caller is not the owner"


@internal
def _transfer_ownership(new_owner: address):
    """
    @dev Transfers the ownership of the contract
         to a new account `new_owner`.
    @notice This is an `internal` function without
            access restriction.
    @param new_owner The 20-byte address of the new owner.
    """
    old_owner: address = self.owner
    self.owner = new_owner
    log OwnershipTransferred(old_owner, new_owner)
