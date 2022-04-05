import { Address, ethereum, log, BigInt } from '@graphprotocol/graph-ts';
import { test, assert, newMockEvent } from 'matchstick-as/assembly/index';
import { IVault__getPoolTokenInfoResult, Swap } from '../generated/BalancerVault/IVault';
import { PoolCreated } from '../generated/WeightedPoolFactory/WeightedPoolFactory';
import { addPrincipalPool } from '../src/entities/PrincipalPool';
import { addYieldPool } from '../src/entities/YieldPool';
import { handleSwapEvent, handleWeightedPoolCreated } from '../src/mapping';
import {principalPools} from "./poolFixtures";

test ('Can add pool created by element Multisig', () => {

    for(let i=0; i<principalPools.length; i++){
        let pool = principalPools[i];

        addPrincipalPool(
            pool[0],
            pool[1],
            pool[2],
            BigInt.fromString(pool[3]),
            BigInt.fromString(pool[4])
        )
    }

    let newSwapEvent = createNewSwapEvent(
        "0x231e687c9961d3a27e6e266ac5c433ce4f8253e4000200000000000000000023",
        "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0x000000000000000000000000476c5e26a75bd202a9683ffd34359c0cc15be0ff",
        BigInt.fromI64(8919770990158596465),
        BigInt.fromI64(3500000000)
    )

    handleSwapEvent(newSwapEvent);
});

export function createNewSwapEvent(
    poolAddress: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: BigInt,
    amountOut: BigInt,

): Swap {
    let mockEvent = newMockEvent();

    let newWeightedPoolCreatedEvent = new Swap(
        mockEvent.address,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters
    )

    newWeightedPoolCreatedEvent.parameters = new Array()

    let poolAddressBytes: Address = Address.fromString(poolAddress);
    let poolAddressParam = new ethereum.EventParam('poolId', ethereum.Value.fromAddress(poolAddressBytes))
    newWeightedPoolCreatedEvent.parameters.push(poolAddressParam);

    let tokenInBytes: Address = Address.fromString(tokenIn);
    let tokenInParam = new ethereum.EventParam('tokenIn', ethereum.Value.fromAddress(tokenInBytes))
    newWeightedPoolCreatedEvent.parameters.push(tokenInParam);

    let tokenOutBytes: Address = Address.fromString(tokenOut);
    let tokenOutParam = new ethereum.EventParam('tokenOut', ethereum.Value.fromAddress(tokenOutBytes))
    newWeightedPoolCreatedEvent.parameters.push(tokenOutParam);

    let amountInParam = new ethereum.EventParam('amountIn', ethereum.Value.fromSignedBigInt(amountIn));
    newWeightedPoolCreatedEvent.parameters.push(amountInParam);
    let amountOutParam = new ethereum.EventParam('amountOut', ethereum.Value.fromSignedBigInt(amountOut));
    newWeightedPoolCreatedEvent.parameters.push(amountOutParam);

    return newWeightedPoolCreatedEvent;
}