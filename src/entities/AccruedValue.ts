import { Address } from "@graphprotocol/graph-ts";
import { AccruedValue } from "../../generated/schema";
import { ITranche } from "../../generated/YieldTokenCompounding/ITranche";
import { IWrappedPosition } from "../../generated/YieldTokenCompounding/IWrappedPosition";

export const ensureAccruedValue = (
    id: string,
    termId: string,
    ): AccruedValue => {
        // add a new accrued value
        let accruedValue = AccruedValue.load(id);
        if (!accruedValue){
            accruedValue = new AccruedValue(id);

            let address: Address = Address.fromString(termId);
            const trancheContract = ITranche.bind(address);
            const wrappedPosition = trancheContract.position();
            const wrappedPositionContract = IWrappedPosition.bind(wrappedPosition);
            const trancheSupply = trancheContract.totalSupply();
            let interestSupply = trancheContract.interestSupply();
            let wrappedSupply = wrappedPositionContract.balanceOfUnderlying(address);

            accruedValue.trancheSupply = trancheSupply;
            accruedValue.wrappedSupply = wrappedSupply;
            accruedValue.ytSupply = interestSupply;
            accruedValue.save();
        }
        return accruedValue;
}