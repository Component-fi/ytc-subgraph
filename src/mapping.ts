import { BigInt, Address, Bytes, log, ethereum, store } from "@graphprotocol/graph-ts"
import { ApproveTranchePTOnBalancerCall, CompoundCall } from "../generated/YieldTokenCompounding/YieldTokenCompounding"
import { AccruedValue, EntryTransaction, Term, TermList, Token, User } from "../generated/schema"
import { ITranche } from "../generated/YieldTokenCompounding/ITranche";
import { ERC20 } from "../generated/YieldTokenCompounding/ERC20";
import { IWrappedPosition } from "../generated/YieldTokenCompounding/IWrappedPosition";

export function handleNewTermApproval(call: ApproveTranchePTOnBalancerCall): void {
    let address: Address = call.inputs._trancheAddress;
    let id = address.toHex();

    if (!Term.load(id)){
        const term = new Term(id);
        term.address = address;
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

        let termList = TermList.load("0");

        if (!termList){
            termList = new TermList("0");
            termList.lastUpdate = new BigInt(0);
        } 

        let activeTerms: string[] = termList.activeTerms;
        activeTerms.push(term.id);
        termList.activeTerms = activeTerms;
        termList.save();

        log.debug("address: {}, expiration: {},  baseToken: {}", [
            term.address.toString(),
            term.expiration.toString(),
            term.baseToken.toString(),
        ])
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

export function handleUpdateAccrual(block: ethereum.Block): void {

    let timestamp = block.timestamp;

    let secondsInDay: BigInt = BigInt.fromI32(86400);
    const termList = TermList.load("0");

    if (!termList){
        return;
    }
    log.debug("termlist: {}", [termList.id.toString()]);

    // If it's been longer than a day since the last update
    if (timestamp.minus(termList.lastUpdate).gt(secondsInDay)){
        log.debug("timestamp: {}", [timestamp.toString()]);
        log.debug("termlist timestamp: {}", [termList.lastUpdate.toString()]);
        // for each term
        let terms = termList.activeTerms;
        log.debug("first term: {}", [termList.activeTerms[0]]);

        for(let i = 0; i < terms.length; i++){
            let term = terms[i];
            log.debug("Term loop: {}", [term])
            const termEntity = Term.load(term);

            if (!termEntity){
                continue;
            }

            // if the term is now expired, remove it from the active termList
            if (timestamp.gt(termEntity.expiration)){
                log.debug("Term expired: {}", [term])
                // remove it from the active term list
            } else { 
                // add a new accrued value
                let address: Address = Address.fromString(termEntity.id);
                const trancheContract = ITranche.bind(address);
                const trancheERC20 = ERC20.bind(address);
                const wrappedPosition = trancheContract.position();
                const wrappedPositionContract = IWrappedPosition.bind(wrappedPosition);
                const wrappedPositionERC20 = ERC20.bind(wrappedPosition);
                const trancheSupply = trancheContract.totalSupply();
                const trancheDecimals = trancheERC20.decimals();
                let interestSupply = trancheContract.interestSupply();
                let wrappedSupply = wrappedPositionContract.balanceOfUnderlying(address);
                const wrappedDecimals = wrappedPositionERC20.decimals();


                log.debug(
                    "term: {}, trancheSupply: {}, trancheDecimals: {}, wrappedSupply: {}, wrappedDecimals: {}, interestSupply: {}",
                    [
                        term,
                        trancheSupply.toString(),
                        trancheDecimals.toString(),
                        wrappedSupply.toString(),
                        wrappedDecimals.toString(),
                        interestSupply.toString()
                    ]
                )


                const accruedValueEntity = new AccruedValue(timestamp.toString() + term);
                accruedValueEntity.timestamp = timestamp;
                accruedValueEntity.trancheSupply = trancheSupply;
                accruedValueEntity.wrappedSupply = wrappedSupply;
                accruedValueEntity.ytSupply = interestSupply;
                // TODO these decikmal values can probably be moved to the tranche entity
                accruedValueEntity.trancheDecimals = trancheDecimals;
                accruedValueEntity.wrappedDecimals = wrappedDecimals;
                accruedValueEntity.term = term;
                accruedValueEntity.save();
            }
        }

        termList.lastUpdate = timestamp;
        termList.save();
    }
}