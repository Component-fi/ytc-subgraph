import { Address, log } from "@graphprotocol/graph-ts";
import { AccruedValue } from "../../generated/schema";
import { ITranche } from "../../generated/YieldTokenCompounding/ITranche";
import { IWrappedPosition } from "../../generated/YieldTokenCompounding/IWrappedPosition";

// TODO clean up this failure of dependency injection
export const ensureAccruedValue = (
    id: string,
    termId: string,
    ): AccruedValue => {
        // add a new accrued value
        let accruedValue = AccruedValue.load(id);
        if (!accruedValue){
            log.warning('No loading accrued value', [])
            accruedValue = new AccruedValue(id);

            let address: Address = Address.fromString(termId);
            const trancheContract = ITranche.bind(address);
            log.warning('getting position', [])
            const wrappedPosition = trancheContract.position();
            const wrappedPositionContract = IWrappedPosition.bind(wrappedPosition);
            log.warning('getting total supply', [])
            const trancheSupply = trancheContract.totalSupply();
            let interestSupply = trancheContract.interestSupply();
            log.warning('getting balance of the underlying', [])
            let wrappedSupply = wrappedPositionContract.balanceOfUnderlying(address);

            accruedValue.trancheSupply = trancheSupply;
            accruedValue.wrappedSupply = wrappedSupply;
            accruedValue.ytSupply = interestSupply;
            accruedValue.save();
        }
        return accruedValue;
}
