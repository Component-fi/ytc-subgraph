import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as";
import { ConvergentCurvePool } from "../../generated/BalancerVault/ConvergentCurvePool";
import { PrincipalPool, PrincipalPoolState, PrincipalToken, Term } from "../../generated/schema";
import { IVault } from "../../generated/YieldTokenCompounding/IVault";
import { BALANCER_VAULT_ADDRESS } from "../constants";
import { calcFixedAPR, calcSpotPricePt } from "../helpers/prices";
import { ensureTimestamp } from "./Timestamp";

export const addPrincipalPoolState = (
    id: string,
    timestamp: BigInt,
    poolId: string,
): PrincipalPoolState | null => {

    let principalPoolState = new PrincipalPoolState(id);

    principalPoolState.pool = poolId;
    principalPoolState.timestamp = ensureTimestamp(timestamp).id;

    let principalPool = PrincipalPool.load(poolId);

    if (!principalPool){
        log.error("Could not get principal pool state as prinicpal pool {} was not found", [poolId]);
        return null
    }

    let principalPoolContract = ConvergentCurvePool.bind(Address.fromString(principalPool.address.toHexString()));

    principalPoolState.totalSupply = principalPoolContract.totalSupply();

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

    let principalToken = PrincipalToken.load(principalPool.pToken);
    
    if (principalToken){
        let decimals = principalToken.decimals
        
        let expiration = principalToken.expiration;

        let timeRemainingSeconds = expiration.minus(timestamp);

        let spotPrice = calcSpotPricePt(
            principalPoolState.baseReserves.toString(),
            principalPoolState.ptReserves.toString(),
            principalPoolState.totalSupply.toString(),
            timeRemainingSeconds.toI32(),
            principalPool.unitSeconds.toI32(),
            decimals,
        )

        let fixedRate = calcFixedAPR(
            spotPrice,
            timeRemainingSeconds.toI32(),
        )

        principalPoolState.spotPrice = BigDecimal.fromString(spotPrice.toString());
        principalPoolState.fixedRate = BigDecimal.fromString(fixedRate.toString());
    }

    principalPoolState.save();
    return principalPoolState;
}