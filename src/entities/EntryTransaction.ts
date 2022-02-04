import { BigInt } from "@graphprotocol/graph-ts";
import { EntryTransaction } from "../../generated/schema";
import { ensureTerm } from "./Term";
import { ensureTimestamp } from "./Timestamp";

export const ensureEntryTransaction = (
        id: string,
        term: string,
        numberOfCompounds: i32,
        amountCollateralDeposited: BigInt,
        yieldTokensReceived: BigInt,
        baseTokensSpent: BigInt,
        gasPrice: BigInt,
        gasLimit: BigInt,
        timestamp: BigInt,
    ): EntryTransaction => {
        let entryTransaction = EntryTransaction.load(id);
        
        if (!entryTransaction){
            entryTransaction = new EntryTransaction(id);

            ensureTerm(term);

            entryTransaction.term = term;
            entryTransaction.numberOfCompounds = numberOfCompounds;
            entryTransaction.amountCollateralDeposited = amountCollateralDeposited;
            entryTransaction.yieldTokensReceived = yieldTokensReceived;
            entryTransaction.baseTokensSpent = baseTokensSpent;
            entryTransaction.gasPrice = gasPrice;
            entryTransaction.gasLimit = gasLimit;
            entryTransaction.timestamp = ensureTimestamp(timestamp).id;
        }

        return entryTransaction;
    }
