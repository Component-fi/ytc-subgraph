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

    log.warning("Trying to add yield pool state {}", [id]);

    let yieldPoolState = new YieldPoolState(id);

    yieldPoolState.pool = poolId;
    yieldPoolState.timestamp = ensureTimestamp(timestamp).id;
    yieldPoolState.timestampId = timestamp;

    log.warning("About to load yield pool", [])


    let yieldPool  = YieldPool.load(poolId);

    if (!yieldPool){
        log.error("Could not get yield pool state as yield pool {} was not found", [poolId])
        return null;
    }

    log.warning("About to bind to balancer vault", [])

    let balancerVault = IVault.bind(Address.fromString(BALANCER_VAULT_ADDRESS));
    let tokens = balancerVault.getPoolTokens(Bytes.fromHexString(poolId) as Bytes);

    let tokenAddresses = tokens.value0;
    let balances = tokens.value1;

    log.warning("About to order the indexes", [])

    let baseIndex = 0;
    let yIndex = 1;
    if(yieldPool.yToken == tokenAddresses[0].toHexString()){
        yIndex = 0;
        baseIndex = 1;
    }

    yieldPoolState.ytReserves = balances[yIndex];
    yieldPoolState.baseReserves = balances[baseIndex];

    log.warning("About to calculate the spotPrice", [])

    yieldPoolState.spotPrice = BigDecimal.fromString(
        calcSpotPriceYt(
            yieldPoolState.baseReserves.toString(),
            yieldPoolState.ytReserves.toString()
        ).toString()
    );
    log.warning("About to load yieldToken", []);

    let yieldToken = YieldToken.load(yieldPool.yToken);

    if (yieldToken){
        yieldPoolState.accruedValue = ensureAccruedValue(
            id,
            yieldToken.term
        ).id
    }

    yieldPoolState.save();
    log.warning("Added yield pool state {}", [id]);
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