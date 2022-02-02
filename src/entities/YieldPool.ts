import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { BaseToken, YieldPool, YieldToken } from "../../generated/schema";
import { WeightedPool } from "../../generated/WeightedPoolFactory/WeightedPool";

export const addYieldPool = (
    address: string,
    name: string,
    tokens: Address[],
    weights: BigInt[],
    swapFeePercentage: BigInt,
): YieldPool | null => {
    let poolContract = WeightedPool.bind(Address.fromString(address));

    let id = poolContract.getPoolId().toHexString();

    let yieldPool = new YieldPool(id);
    yieldPool.swapFeePercentage = swapFeePercentage;
    yieldPool.name = name;
    yieldPool.address = Address.fromString(address);

    let baseIndex: i32;
    let ytIndex: i32;
    if(BaseToken.load(tokens[0].toHexString())){
        ytIndex = 1;
        baseIndex = 0;
    }else if(YieldToken.load(tokens[0].toHexString())){
        ytIndex = 0;
        baseIndex = 1;
    }else{
        log.error("Token 0 was neither yield or base token, {}", [tokens[0].toHexString()])
        return null;
    }

    yieldPool.baseToken = tokens[baseIndex].toHexString();
    yieldPool.baseTokenWeight = weights[baseIndex];
    yieldPool.yToken = tokens[ytIndex].toHexString();
    yieldPool.yTokenWeight = weights[ytIndex];


    yieldPool.save();

    return yieldPool;
}