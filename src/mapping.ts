import { Address, log } from "@graphprotocol/graph-ts"
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
import { ELEMENT_DEPLOYER } from "./constants";
import { PrincipalPool, YieldPool } from "../generated/schema";
import { addPrincipalPoolState } from "./entities/principalPoolState";
import { addYieldPoolState } from "./entities/YieldPoolState";
import { logPrices } from "./entities/Price";

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
    return;
}

function handlePrincipalPoolSwap(event: Swap): void {
    let poolId = event.params.poolId.toHexString();
    let timestamp = event.block.timestamp;
    let id = timestamp.toString() + poolId;

    addPrincipalPoolState(
        id,
        timestamp,
        poolId,
    )

    logPrices(
        timestamp
    );
}

function handleYieldPoolSwap(event: Swap): void {
    let poolId = event.params.poolId.toHexString();
    let timestamp = event.block.timestamp;
    let id = timestamp.toString() + poolId;
    log.warning('Starting to handle yieldpoolswap', []);

    addYieldPoolState(
        id,
        timestamp,
        poolId
    )
}


// export function handleUpdateAccrual(block: ethereum.Block): void {

//     let timestamp = block.timestamp;

//     let secondsInDay: BigInt = BigInt.fromI32(86400);
//     const termList = TermList.load("0");

//     if (!termList){
//         return;
//     }
//     log.debug("termlist: {}", [termList.id.toString()]);

//     // If it's been longer than a day since the last update
//     if (timestamp.minus(termList.lastUpdate).gt(secondsInDay)){
//         log.debug("timestamp: {}", [timestamp.toString()]);
//         log.debug("termlist timestamp: {}", [termList.lastUpdate.toString()]);
//         // for each term
//         let terms = termList.activeTerms;
//         log.debug("first term: {}", [termList.activeTerms[0]]);

//         for(let i = 0; i < terms.length; i++){
//             let term = terms[i];
//             log.debug("Term loop: {}", [term])
//             const termEntity = Term.load(term);

//             if (!termEntity){
//                 continue;
//             }

//             // if the term is now expired, remove it from the active termList
//             if (timestamp.gt(termEntity.expiration)){
//                 log.debug("Term expired: {}", [term])
//                 // remove it from the active term list
//             } else { 
//                 // add a new amccrued value
//                 let address: Address = Address.fromString(termEntity.id);
//                 const trancheContract = ITranche.bind(address);
//                 const wrappedPosition = trancheContract.position();
//                 const wrappedPositionContract = IWrappedPosition.bind(wrappedPosition);
//                 const trancheSupply = trancheContract.totalSupply();
//                 let interestSupply = trancheContract.interestSupply();
//                 let wrappedSupply = wrappedPositionContract.balanceOfUnderlying(address);


//                 log.debug(
//                     "term: {}, trancheSupply: {}, wrappedSupply: {}, interestSupply: {}",
//                     [
//                         term,
//                         trancheSupply.toString(),
//                         wrappedSupply.toString(),
//                         interestSupply.toString()
//                     ]
//                 )


//                 const accruedValueEntity = new AccruedValue(timestamp.toString() + term);
//                 accruedValueEntity.timestamp = timestamp;
//                 accruedValueEntity.trancheSupply = trancheSupply;
//                 accruedValueEntity.wrappedSupply = wrappedSupply;
//                 accruedValueEntity.ytSupply = interestSupply;
//                 accruedValueEntity.save();
//             }
//         }

//         termList.lastUpdate = timestamp;
//         termList.save();
//     }
// }