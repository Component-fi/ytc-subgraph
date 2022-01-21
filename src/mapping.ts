import { BigInt, Address, Bytes, log } from "@graphprotocol/graph-ts"
import { ApproveTranchePTOnBalancerCall, CompoundCall } from "../generated/YieldTokenCompounding/YieldTokenCompounding"
import { EntryTransaction, Term } from "../generated/schema"
import { ITranche } from "../generated/YieldTokenCompounding/ITranche";

export function handleNewTermApproval(call: ApproveTranchePTOnBalancerCall): void {
    let address: Address = call.inputs._trancheAddress;
    let id = address.toHex();

    if (!Term.load(id)){
        let term = new Term(id);
        const tranche = ITranche.bind(address);
        term.baseTokenAddress = tranche.underlying();
        term.expiration = tranche.unlockTimestamp();
        term.save()
    }

    // Add a new token
}

export function handleYieldCompound(call: CompoundCall): void {
    let id = call.transaction.hash.toHex();

    let entryTransaction = new EntryTransaction(id);

    entryTransaction.term = call.inputs._trancheAddress.toHex();
    entryTransaction.numberOfCompounds = call.inputs._n;
    entryTransaction.amountCollateralDeposited = call.inputs._amount;
    entryTransaction.yieldTokensReceived = call.outputs.value0;
    entryTransaction.baseTokensSpent = call.outputs.value1;
    entryTransaction.from = call.transaction.from;
    entryTransaction.gasPrice = call.transaction.gasPrice;
    entryTransaction.gasLimit = call.transaction.gasLimit;

    entryTransaction.save();
}