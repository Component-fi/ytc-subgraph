import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as";
import { YieldPool, YieldPoolState } from "../../generated/schema";
import { IVault } from "../../generated/YieldTokenCompounding/IVault";
import { BALANCER_VAULT_ADDRESS } from "../constants";


export const addYieldPoolState = (
    id: string,
    timestamp: BigInt,
    poolId: string
): YieldPoolState | null => {

    let yieldPoolState = new YieldPoolState(id);

    yieldPoolState.pool = poolId;
    yieldPoolState.timestamp = timestamp;

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

    yieldPoolState.save();
    return yieldPoolState;
}