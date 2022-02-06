import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as";
import { YieldPool, YieldPoolState, YieldToken } from "../../generated/schema";
import { IVault } from "../../generated/YieldTokenCompounding/IVault";
import { BALANCER_VAULT_ADDRESS } from "../constants";
import { calcSpotPriceYt } from "../helpers/prices";
import { ensureAccruedValue } from "./AccruedValue";
import { ensureRegistry } from "./Registry";
import { ensureTimestamp } from "./Timestamp";


export const addYieldPoolState = (
    timestamp: BigInt,
    poolId: string
): YieldPoolState | null => {
    let id = timestamp.toString() + "-" + poolId;

    let yieldPoolState = new YieldPoolState(id);

    yieldPoolState.pool = poolId;
    yieldPoolState.timestamp = ensureTimestamp(timestamp).id;
    yieldPoolState.timestampId = timestamp;


    let yieldPool  = YieldPool.load(poolId);

    if (!yieldPool){
        log.error("Could not get yield pool state as yield pool {} was not found", [poolId])
        return null;
    }

    let balancerVault = IVault.bind(Address.fromString(BALANCER_VAULT_ADDRESS));
    let tokens = balancerVault.getPoolTokens(Bytes.fromHexString(poolId) as Bytes);

    let tokenAddresses = tokens.value0;
    let balances = tokens.value1;


    let baseIndex = 0;
    let yIndex = 1;
    if(yieldPool.yToken == tokenAddresses[0].toHexString()){
        yIndex = 0;
        baseIndex = 1;
    }

    yieldPoolState.ytReserves = balances[yIndex];
    yieldPoolState.baseReserves = balances[baseIndex];

    yieldPoolState.spotPrice = BigDecimal.fromString(
        calcSpotPriceYt(
            yieldPoolState.baseReserves.toString(),
            yieldPoolState.ytReserves.toString()
        ).toString()
    );

    let yieldToken = YieldToken.load(yieldPool.yToken);

    if (yieldToken){
        yieldPoolState.accruedValue = ensureAccruedValue(
            id,
            yieldToken.term
        ).id
    }

    yieldPoolState.save();
    return yieldPoolState;
}

export function logYieldPoolStates(timestamp: BigInt): void{
    let registry = ensureRegistry();

    let yieldPools = registry.yieldPools;

    for (let i = 0; i<yieldPools.length; i++){
        addYieldPoolState(
            timestamp,
            yieldPools[i]
        )
    }

    registry.lastUpdateYieldPools = timestamp;
    registry.save();
}