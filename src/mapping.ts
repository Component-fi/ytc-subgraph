import { BigInt, Address, Bytes, log } from "@graphprotocol/graph-ts"
import { ApproveTranchePTOnBalancerCall, CompoundCall } from "../generated/YieldTokenCompounding/YieldTokenCompounding"
import { EntryTransaction, Term, Token, User } from "../generated/schema"
import { ITranche } from "../generated/YieldTokenCompounding/ITranche";
import { ERC20 } from "../generated/YieldTokenCompounding/ERC20";

export function handleNewTermApproval(call: ApproveTranchePTOnBalancerCall): void {
    let address: Address = call.inputs._trancheAddress;
    let id = address.toHex();

    if (!Term.load(id)){
        const term = new Term(id);
        const tranche = ITranche.bind(address);
        term.expiration = tranche.unlockTimestamp();

        let baseTokenAddress = tranche.underlying()

        // generate the token associated with the term if it doesn't yet exist
        if (!Token.load(baseTokenAddress.toHex())){
            const token = ERC20.bind(baseTokenAddress);
            let baseToken = new Token(baseTokenAddress.toHex());
            baseToken.name = token.name();
            baseToken.symbol = token.symbol();
            baseToken.decimals = token.decimals();
            baseToken.save();
        }

        term.baseToken = baseTokenAddress.toHex();

        term.save()
    }
}

export function handleYieldCompound(call: CompoundCall): void {
    let id = call.transaction.hash.toHex();

    let entryTransaction = new EntryTransaction(id);

    entryTransaction.term = call.inputs._trancheAddress.toHex();
    entryTransaction.numberOfCompounds = call.inputs._n;
    entryTransaction.amountCollateralDeposited = call.inputs._amount;
    entryTransaction.yieldTokensReceived = call.outputs.value0;
    entryTransaction.baseTokensSpent = call.outputs.value1;
    entryTransaction.gasPrice = call.transaction.gasPrice;
    entryTransaction.gasLimit = call.transaction.gasLimit;

    let userId = call.transaction.from.toHex();

    // generate a new user if they do not yet exist
    if (!User.load(userId)){
        let user = new User(userId);
        user.save();
    }

    entryTransaction.from = userId;
    entryTransaction.save();
}