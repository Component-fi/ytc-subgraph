import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ConvergentCurvePool } from "../../generated/ConvergentPoolFactory/ConvergentCurvePool";
import { PrincipalPool } from "../../generated/schema";

export const addPrincipalPool = (
    address: string,
    baseToken: string,
    pToken: string,
    timeStretch: BigInt,
    swapFeePercentage: BigInt,
): PrincipalPool => {
    // get the poolId as that will be our ID
    let poolContract = ConvergentCurvePool.bind(Address.fromString(address));

    let id = poolContract.getPoolId().toHexString();

    let principalPool = new PrincipalPool(id);

    principalPool.baseToken = baseToken;
    principalPool.pToken = pToken;
    principalPool.unitSeconds = timeStretch;
    principalPool.swapFeePercentage = swapFeePercentage;
    principalPool.address = Address.fromString(address);

    principalPool.save();
    return principalPool;
}