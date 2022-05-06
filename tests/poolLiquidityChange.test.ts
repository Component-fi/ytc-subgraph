import { Address, ethereum, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { PoolBalanceChanged } from "../generated/BalancerVault/IVault";
import { clearStore, test, assert } from "matchstick-as/assembly/index";
import { addPrincipalLiquidityChangeEvent } from "../src/entities/Liquidity";

export function createNewPoolBalanceChangedEvent(
  poolId: string,
  liquidityProvider: string,
  tokens: string[],
  deltas: string[]
): PoolBalanceChanged {
  let mockEvent = newMockEvent();
  let newGravatarEvent = new PoolBalanceChanged(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );

  newGravatarEvent.parameters = new Array();
  let poolParam = new ethereum.EventParam(
    "poolId",
    ethereum.Value.fromBytes(Bytes.fromHexString(poolId) as Bytes)
  );
  let lpParam = new ethereum.EventParam(
    "liquidityProvider",
    ethereum.Value.fromAddress(Address.fromString(liquidityProvider))
  );
  let tokensParam = new ethereum.EventParam(
    "tokens",
    ethereum.Value.fromAddressArray(
      tokens.map<Address>((a) => Address.fromString(a))
    )
  );
  let deltasParam = new ethereum.EventParam(
    "deltas",
    ethereum.Value.fromSignedBigIntArray(
      deltas.map<BigInt>((d) => BigInt.fromString(d))
    )
  );

  newGravatarEvent.parameters.push(poolParam);
  newGravatarEvent.parameters.push(lpParam);
  newGravatarEvent.parameters.push(tokensParam);
  newGravatarEvent.parameters.push(deltasParam);

  return newGravatarEvent;
}

test("liquidityProvider field is not null", () => {
  // Create mock events
  let newPoolBalanceChangedEvent = createNewPoolBalanceChangedEvent(
    "0x10a2f8bd81ee2898d7ed18fb8f114034a549fa59000200000000000000000090",
    "0x0a81cd012c41aa46b18636d9c26da722ee245596",
    [
      "0x8a2228705ec979961f0e16df311debcf097a2766",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    ],
    ["201479559", "249641318"]
  );

  // Call mapping functions passing the events we just created
  addPrincipalLiquidityChangeEvent(newPoolBalanceChangedEvent);

  // Assert the state of the store
  assert.fieldEquals(
    "PrincipalLiquidityChangeEvent",
    newPoolBalanceChangedEvent.transaction.hash.toHexString() +
      "-" +
      newPoolBalanceChangedEvent.logIndex.toString(),
    "liquidityProvider",
    "0x0a81cd012c41aa46b18636d9c26da722ee245596"
  );
  assert.fieldEquals(
    "PrincipalLiquidityChangeEvent",
    newPoolBalanceChangedEvent.transaction.hash.toHexString() +
      "-" +
      newPoolBalanceChangedEvent.logIndex.toString(),
    "tokens",
    "[0x8a2228705ec979961f0e16df311debcf097a2766, 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48]"
  );

  assert.fieldEquals(
    "PrincipalLiquidityPosition",
    newPoolBalanceChangedEvent.params.poolId.toHexString() +
      "-" +
      newPoolBalanceChangedEvent.params.liquidityProvider.toHexString(),
    "liquidityProvider",
    "0x0a81cd012c41aa46b18636d9c26da722ee245596"
  );

  // Clear the store in order to start the next test off on a clean slate
  clearStore();
});

test("liquidityProvider field is not null 2", () => {
  let newPoolBalanceChangedEvent2 = createNewPoolBalanceChangedEvent(
    "0x10a2f8bd81ee2898d7ed18fb8f114034a549fa59000200000000000000000090",
    "0x89effb23b27b35c7d4659ec93faaa7c7b6b38954",
    [
      "0x8a2228705ec979961f0e16df311debcf097a2766",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    ],
    ["100099999", "131611114"]
  );

  addPrincipalLiquidityChangeEvent(newPoolBalanceChangedEvent2);

  // Assert the state of the store
  assert.fieldEquals(
    "PrincipalLiquidityChangeEvent",
    newPoolBalanceChangedEvent2.transaction.hash.toHexString() +
      "-" +
      newPoolBalanceChangedEvent2.logIndex.toString(),
    "liquidityProvider",
    "0x89effb23b27b35c7d4659ec93faaa7c7b6b38954"
  );
  assert.fieldEquals(
    "PrincipalLiquidityChangeEvent",
    newPoolBalanceChangedEvent2.transaction.hash.toHexString() +
      "-" +
      newPoolBalanceChangedEvent2.logIndex.toString(),
    "tokens",
    "[0x8a2228705ec979961f0e16df311debcf097a2766, 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48]"
  );

  assert.fieldEquals(
    "PrincipalLiquidityPosition",
    newPoolBalanceChangedEvent2.params.poolId.toHexString() +
      "-" +
      newPoolBalanceChangedEvent2.params.liquidityProvider.toHexString(),
    "liquidityProvider",
    "0x89effb23b27b35c7d4659ec93faaa7c7b6b38954"
  );

  // Clear the store in order to start the next test off on a clean slate
  clearStore();
});
