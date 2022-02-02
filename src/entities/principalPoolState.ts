import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as";
import { PrincipalPool, PrincipalPoolState } from "../../generated/schema";
import { IVault } from "../../generated/YieldTokenCompounding/IVault";
import { BALANCER_VAULT_ADDRESS } from "../constants";

export const addPrincipalPoolState = (
    id: string,
    timestamp: BigInt,
    poolId: string,
): PrincipalPoolState | null => {

    let principalPoolState = new PrincipalPoolState(id);

    principalPoolState.pool = poolId;
    principalPoolState.timestamp = timestamp

    let principalPool = PrincipalPool.load(poolId);

    if (!principalPool){
        log.error("Could not get principal pool state as prinicpal pool {} was not found", [poolId]);
        return null
    }

    let balancerVault = IVault.bind(Address.fromString(BALANCER_VAULT_ADDRESS));
    let tokens = balancerVault.getPoolTokens(Bytes.fromHexString(poolId) as Bytes);

    let tokenAddresses = tokens.value0;
    let balances = tokens.value1;


    let baseIndex = 0;
    let pIndex = 1;
    if(principalPool.pToken == tokenAddresses[0].toHexString()){
        pIndex = 0;
        baseIndex = 1;
    }

    principalPoolState.ptReserves = balances[pIndex];
    principalPoolState.baseReserves = balances[baseIndex];

    principalPoolState.save();
    return principalPoolState;
}