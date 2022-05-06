import {
  PrincipalLiquidityChangeEvent,
  PrincipalLiquidityPosition,
  PrincipalPool,
  YieldLiquidityChangeEvent,
  YieldLiquidityPosition,
  YieldPool,
} from "../../generated/schema";
import { PoolBalanceChanged } from "../../generated/BalancerVault/IVault";
import { ensureTimestamp } from "./Timestamp";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ensureUser } from "./User";

export const addPrincipalLiquidityChangeEvent = (
  event: PoolBalanceChanged
): PrincipalLiquidityChangeEvent => {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  const timestampEntity = ensureTimestamp(event.block.timestamp);

  let principalLiquidityChangeEvent = new PrincipalLiquidityChangeEvent(id);
  let lp = ensureUser(event.params.liquidityProvider.toHexString()).id;
  principalLiquidityChangeEvent.timestamp = timestampEntity.id;
  principalLiquidityChangeEvent.timestampId = event.block.timestamp;
  principalLiquidityChangeEvent.tokens = event.params.tokens.map<string>((t) =>
    t.toHexString()
  );
  principalLiquidityChangeEvent.deltas = event.params.deltas;
  principalLiquidityChangeEvent.liquidityProvider = lp;

  let poolId = event.params.poolId.toHexString();
  const liquidityPosition = ensurePrincipalLiquidityPosition(poolId, lp);

  principalLiquidityChangeEvent.liquidityPosition = liquidityPosition.id;
  principalLiquidityChangeEvent.save();

  // go through each token that has changed amounts
  for (let i = 0; i < principalLiquidityChangeEvent.tokens.length; i++) {
    if (liquidityPosition.bToken == principalLiquidityChangeEvent.tokens[i]) {
      liquidityPosition.bTokenAmount = liquidityPosition.bTokenAmount.plus(
        principalLiquidityChangeEvent.deltas[i]
      );
    }
    if (liquidityPosition.pToken == principalLiquidityChangeEvent.tokens[i]) {
      liquidityPosition.pTokenAmount = liquidityPosition.pTokenAmount.plus(
        principalLiquidityChangeEvent.deltas[i]
      );
    }
  }

  liquidityPosition.save();
  return principalLiquidityChangeEvent;
};

export const addYieldLiquidityChangeEvent = (
  event: PoolBalanceChanged
): YieldLiquidityChangeEvent => {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  const timestampEntity = ensureTimestamp(event.block.timestamp);

  let yieldLiquidityChangeEvent = new YieldLiquidityChangeEvent(id);
  let lp = ensureUser(event.params.liquidityProvider.toHexString()).id;
  yieldLiquidityChangeEvent.timestamp = timestampEntity.id;
  yieldLiquidityChangeEvent.timestampId = event.block.timestamp;
  yieldLiquidityChangeEvent.tokens = event.params.tokens.map<string>((t) =>
    t.toHexString()
  );
  yieldLiquidityChangeEvent.deltas = event.params.deltas;
  yieldLiquidityChangeEvent.liquidityProvider = lp;

  let poolId = event.params.poolId.toHexString();
  const liquidityPosition = ensureYieldLiquidityPosition(poolId, lp);

  yieldLiquidityChangeEvent.liquidityPosition = liquidityPosition.id;
  yieldLiquidityChangeEvent.save();

  // go through each token that has changed amounts
  for (let i = 0; i < yieldLiquidityChangeEvent.tokens.length; i++) {
    if (liquidityPosition.bToken == yieldLiquidityChangeEvent.tokens[i]) {
      liquidityPosition.bTokenAmount = liquidityPosition.bTokenAmount.plus(
        yieldLiquidityChangeEvent.deltas[i]
      );
    }
    if (liquidityPosition.yToken == yieldLiquidityChangeEvent.tokens[i]) {
      liquidityPosition.yTokenAmount = liquidityPosition.yTokenAmount.plus(
        yieldLiquidityChangeEvent.deltas[i]
      );
    }
  }

  liquidityPosition.save();
  return yieldLiquidityChangeEvent;
};

function ensurePrincipalLiquidityPosition(
  poolId: string,
  providerId: string
): PrincipalLiquidityPosition {
  const id = poolId + "-" + providerId;
  let principalLiquidityPosition = PrincipalLiquidityPosition.load(id);

  if (!principalLiquidityPosition) {
    principalLiquidityPosition = new PrincipalLiquidityPosition(id);
    principalLiquidityPosition.pool = poolId;
    principalLiquidityPosition.liquidityProvider = ensureUser(providerId).id;
    // TODO get the pToken from the poolId
    const principalPool = PrincipalPool.load(poolId);
    if (!!principalPool) {
      principalLiquidityPosition.bToken = principalPool.baseToken;
      principalLiquidityPosition.pToken = principalPool.pToken;
    }
    principalLiquidityPosition.bTokenAmount = BigInt.zero();
    principalLiquidityPosition.pTokenAmount = BigInt.zero();

    principalLiquidityPosition.save();
  }

  return principalLiquidityPosition;
}

function ensureYieldLiquidityPosition(
  poolId: string,
  providerId: string
): YieldLiquidityPosition {
  const id = poolId + "-" + providerId;
  let yieldLiquidityPosition = YieldLiquidityPosition.load(id);

  if (!yieldLiquidityPosition) {
    yieldLiquidityPosition = new YieldLiquidityPosition(id);
    yieldLiquidityPosition.pool = poolId;
    yieldLiquidityPosition.liquidityProvider = ensureUser(providerId).id;
    const yieldPool = YieldPool.load(poolId);
    if (!!yieldPool) {
      yieldLiquidityPosition.bToken = yieldPool.baseToken;
      yieldLiquidityPosition.yToken = yieldPool.yToken;
    }
    yieldLiquidityPosition.bTokenAmount = BigInt.zero();
    yieldLiquidityPosition.yTokenAmount = BigInt.zero();
    yieldLiquidityPosition.save();
  }
  return yieldLiquidityPosition;
}
