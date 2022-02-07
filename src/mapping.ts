import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts"
import { CreateCall } from '../generated/WeightedPoolFactory/WeightedPoolFactory';
import { DeployTrancheCall } from '../generated/TrancheFactory/TrancheFactory';
import { CreateCall as CreateCCCall } from '../generated/ConvergentPoolFactory/ConvergentPoolFactory';
import { CompoundCall, } from "../generated/YieldTokenCompounding/YieldTokenCompounding"
import { ensureTerm } from "./entities/Term";
import { ensureEntryTransaction } from "./entities/EntryTransaction";
import { addYieldPool } from "./entities/YieldPool";
import { addPrincipalPool } from "./entities/PrincipalPool";
import { ensureUser } from "./entities/User";
import { ensureAccruedValue } from "./entities/AccruedValue";
import { Swap } from '../generated/BalancerVault/IVault';
import { ELEMENT_DEPLOYER, SECONDS_IN_AN_HOUR, SECONDS_IN_A_DAY } from "./constants";
import { PrincipalPool, Timestamp, YieldPool } from "../generated/schema";
import { addPrincipalPoolState, logPrincipalPoolStates } from "./entities/principalPoolState";
import { addYieldPoolState, logYieldPoolStates } from "./entities/YieldPoolState";
import { logPrices } from "./entities/Price";
import { ensureRegistry } from "./entities/Registry";
import { initialize } from "./initialize";

initialize();

export function handleYieldCompound(call: CompoundCall): void {
    let id = call.transaction.hash.toHex();

    let entryTransaction = ensureEntryTransaction(
        id,
        call.inputs._trancheAddress.toHex(),
        call.inputs._n,
        call.inputs._amount,
        call.outputs.value0,
        call.outputs.value1,
        call.transaction.gasPrice,
        call.transaction.gasLimit,
        call.block.timestamp,
    );


    let userId = call.transaction.from.toHex();

    // generate a new user if they do not yet exist
    ensureUser(userId);
    entryTransaction.from = userId;

    const termEntity = ensureTerm(entryTransaction.term);

    let accruedValue = ensureAccruedValue(call.transaction.hash.toHex(), termEntity.id)
    entryTransaction.accruedValue = accruedValue.id;

    logPrices(
        call.block.timestamp
    );

    entryTransaction.save();
}

export function handleWeightedPoolCreated(call: CreateCall): void {
    if(call.transaction.from.toHexString() == ELEMENT_DEPLOYER){
        addYieldPool(
            call.outputs.value0.toHexString(),
            call.inputs.name,
            call.inputs.tokens,
            call.inputs.weights,
            call.inputs.swapFeePercentage,
        )

    }
}


export function handleCCPoolCreated (call: CreateCCCall): void {
    if(call.transaction.from.toHexString() == ELEMENT_DEPLOYER){
        addPrincipalPool(
            call.outputs.value0.toHexString(),
            call.inputs._underlying.toHexString(),
            call.inputs._bond.toHexString(),
            call.inputs._unitSeconds,
            call.inputs._percentFee,
        )
    }
}


export function handleDeployTranche(call: DeployTrancheCall): void {
    let address: Address = call.outputs.value0;
    let id = address.toHex();

    ensureTerm(id, call.block.timestamp);
}

export function handleSwapEvent(event: Swap): void {
    // first check if the pool is a valid pPool
    let principalPool = PrincipalPool.load(event.params.poolId.toHexString());
    if (principalPool){
        handlePrincipalPoolSwap(event);
    }
    // then check if the pool is a valid yPool
    let yPool = YieldPool.load(event.params.poolId.toHexString());
    if (yPool){
        handleYieldPoolSwap(event);
    }

    // Updates once per day, principalPools, yieldPools and prices
    handleDailyPoolUpdate(event);
    return;
}

function handlePrincipalPoolSwap(event: Swap): void {
    let poolId = event.params.poolId.toHexString();
    let timestamp = event.block.timestamp;

    addPrincipalPoolState(
        timestamp,
        poolId,
    )
}

function handleYieldPoolSwap(event: Swap): void {
    let poolId = event.params.poolId.toHexString();
    let timestamp = event.block.timestamp;

    addYieldPoolState(
        timestamp,
        poolId
    )
}

function handleDailyPoolUpdate(event: ethereum.Event): void {
    // first graph the timestamp
    let timestamp = event.block.timestamp;
    let registry = ensureRegistry();
    // now check if yieldPools or principalPools have been updated in 24 hours

    let oneDayAgo = timestamp.minus(BigInt.fromI64(SECONDS_IN_A_DAY));
    let oneHourAgo = timestamp.minus(BigInt.fromI64(SECONDS_IN_AN_HOUR));

    if ((oneDayAgo).gt(registry.lastUpdatePrincipalPools)){
        logPrincipalPoolStates(timestamp);
    }
    if ((oneDayAgo).gt(registry.lastUpdateYieldPools)){
        logYieldPoolStates(timestamp);
    }
    if ((oneHourAgo).gt(registry.lastUpdatePriceFeeds)){
        logPrices(timestamp)
    }
}