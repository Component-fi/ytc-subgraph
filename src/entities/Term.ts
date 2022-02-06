import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BaseToken, PrincipalToken, Term, YieldToken } from "../../generated/schema";
import { ERC20 } from "../../generated/YieldTokenCompounding/ERC20";
import { ITranche } from "../../generated/YieldTokenCompounding/ITranche";
import { ensureRegistry } from "./Registry";

const ensureBaseToken = (baseTokenAddress: string): BaseToken => {
    let baseToken = BaseToken.load(baseTokenAddress);

    if (!baseToken){
        const token = ERC20.bind(Address.fromString(baseTokenAddress));
        baseToken = new BaseToken(baseTokenAddress);
        baseToken.name = token.name();
        baseToken.symbol = token.symbol();
        baseToken.decimals = token.decimals();

        baseToken.save();

        let registry = ensureRegistry();
        let baseTokens: string[] = registry.baseTokens;
        baseTokens.push(baseToken.id);
        registry.baseTokens = baseTokens;
        registry.save();
    }
    return baseToken;
}

const ensureYieldToken = (yieldTokenAddress: string, termId: string | null = null): YieldToken => {
    let yieldToken = YieldToken.load(yieldTokenAddress);

    if (!yieldToken){
        const token = ERC20.bind(Address.fromString(yieldTokenAddress));
        yieldToken = new YieldToken(yieldTokenAddress);
        yieldToken.name = token.name();
        yieldToken.symbol = token.symbol();
        yieldToken.decimals = token.decimals();
        if (termId){
            yieldToken.term = termId;
        }
        yieldToken.save();

        let registry = ensureRegistry();
        let yieldTokens: string[] = registry.yieldTokens;
        yieldTokens.push(yieldToken.id);
        registry.yieldTokens = yieldTokens;
        registry.save()
    }

    return yieldToken;
}

const ensurePrincipalToken = (principalTokenAddress: string, termId: string | null = null): PrincipalToken => {

    let principalToken = PrincipalToken.load(principalTokenAddress);

        if (!principalToken){
            const token = ERC20.bind(Address.fromString(principalTokenAddress));
            principalToken = new PrincipalToken(principalTokenAddress);
            principalToken.name = token.name();
            principalToken.symbol = token.symbol();
            principalToken.decimals = token.decimals();
            const principalTokenContract = ITranche.bind(Address.fromString(principalToken.id));
            principalToken.expiration = principalTokenContract.unlockTimestamp();

            if (termId){
                principalToken.term = termId;
            }

            principalToken.save();

            let registry = ensureRegistry();
            let principalTokens: string[] = registry.principalTokens;
            principalTokens.push(principalToken.id);
            registry.principalTokens = principalTokens;
            registry.save();
        }
    return principalToken;
}

export const ensureTerm = (
    id: string,
    timeStarted: BigInt | null = null,
): Term => {
    let term = Term.load(id);
    
    if (!term){
        let address: Address = Address.fromString(id);

        term = new Term(id);
        term.address = address;
        if (timeStarted){
            term.timeStarted = timeStarted;
        }
        const tranche = ITranche.bind(address);
        term.expiration = tranche.unlockTimestamp();

        let baseTokenAddress = tranche.underlying().toHexString();
        let bt = ensureBaseToken(baseTokenAddress);
        term.baseToken = bt.id;

        let yieldTokenAddress = tranche.interestToken().toHexString();
        let yt = ensureYieldToken(yieldTokenAddress, id);

        let principaltokenAddress = address.toHexString();
        let pt = ensurePrincipalToken(principaltokenAddress, id);

        const trancheContract = ITranche.bind(address);
        const trancheERC20 = ERC20.bind(address);
        const trancheDecimals = trancheERC20.decimals();

        const wrappedPosition = trancheContract.position();
        const wrappedPositionERC20 = ERC20.bind(wrappedPosition);
        const wrappedDecimals = wrappedPositionERC20.decimals();

        term.trancheDecimals = trancheDecimals;
        term.wrappedDecimals = wrappedDecimals;


        term.save()

        let registry = ensureRegistry()
        let terms: string[] = registry.terms;
        terms.push(term.id);
        registry.terms = terms;
        registry.save();
    }

    return term;
}
