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

export const addPrincipalLiquidityChangeEvent = (
  event: PoolBalanceChanged
): PrincipalLiquidityChangeEvent => {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  let principalLiquidityChangeEvent = PrincipalLiquidityChangeEvent.load(id);

  if (!principalLiquidityChangeEvent) {
    const timestampEntity = ensureTimestamp(event.block.timestamp);

    principalLiquidityChangeEvent = new PrincipalLiquidityChangeEvent(id);
    principalLiquidityChangeEvent.timestamp = timestampEntity.id;
    principalLiquidityChangeEvent.deltas = event.params.deltas;

    principalLiquidityChangeEvent.tokens = event.params.tokens.map<string>(
      (t: Address): string => t.toHexString()
    );

    principalLiquidityChangeEvent.save();
  }

  let lp = event.params.liquidityProvider.toHexString();
  let poolId = event.params.poolId.toHexString();
  const plp = ensurePrincipalLiquidityPosition(poolId, lp);

  // go through each token that has changed amounts
  for (let i = 0; i <= principalLiquidityChangeEvent.tokens.length; i++) {
    if (plp.bToken == principalLiquidityChangeEvent.tokens[i]) {
      plp.bTokenAmount = plp.bTokenAmount.plus(
        principalLiquidityChangeEvent.deltas[i]
      );
    }
    if (plp.pToken == principalLiquidityChangeEvent.tokens[i]) {
      plp.pTokenAmount = plp.pTokenAmount.plus(
        principalLiquidityChangeEvent.deltas[i]
      );
    }
  }

  plp.save();
  return principalLiquidityChangeEvent;
};

export const addYieldLiquidityChangeEvent = (
  event: PoolBalanceChanged
): YieldLiquidityChangeEvent => {
  const id =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let yieldLiquidityChangeEvent = YieldLiquidityChangeEvent.load(id);

  if (!yieldLiquidityChangeEvent) {
    const timestampEntity = ensureTimestamp(event.block.timestamp);

    yieldLiquidityChangeEvent = new YieldLiquidityChangeEvent(id);
    yieldLiquidityChangeEvent.timestamp = timestampEntity.id;
    yieldLiquidityChangeEvent.deltas = event.params.deltas;
    yieldLiquidityChangeEvent.tokens = event.params.tokens.map<string>((t) =>
      t.toHexString()
    );
    yieldLiquidityChangeEvent.liquidityProvider = event.params.liquidityProvider.toHexString();
    yieldLiquidityChangeEvent.save();
  }
  let lp = event.params.liquidityProvider.toHexString();
  let poolId = event.params.poolId.toHexString();
  const ylp = ensureYieldLiquidityPosition(poolId, lp);

  for (let i = 0; i <= yieldLiquidityChangeEvent.tokens.length; i++) {
    if (ylp.bToken == yieldLiquidityChangeEvent.tokens[i]) {
      ylp.bTokenAmount = ylp.bTokenAmount.plus(
        yieldLiquidityChangeEvent.deltas[i]
      );
    }
    if (ylp.yToken == yieldLiquidityChangeEvent.tokens[i]) {
      ylp.yTokenAmount = ylp.yTokenAmount.plus(
        yieldLiquidityChangeEvent.deltas[i]
      );
    }
  }

  //   ylp.save();

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
    principalLiquidityPosition.liquidityProvider = providerId;
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
    yieldLiquidityPosition.liquidityProvider = providerId;
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
