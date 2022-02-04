import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { BaseToken, PrincipalToken, Term, TermList, YieldToken } from "../../generated/schema";
import { ERC20 } from "../../generated/YieldTokenCompounding/ERC20";
import { ITranche } from "../../generated/YieldTokenCompounding/ITranche";

const ensureBaseToken = (baseTokenAddress: string): BaseToken => {
    let baseToken = BaseToken.load(baseTokenAddress);

    if (!baseToken){
        const token = ERC20.bind(Address.fromString(baseTokenAddress));
        baseToken = new BaseToken(baseTokenAddress);
        baseToken.name = token.name();
        baseToken.symbol = token.symbol();
        baseToken.decimals = token.decimals();
        baseToken.save();
    }
    return baseToken;
}

const ensureYieldToken = (yieldTokenAddress: string): YieldToken => {
    let yieldToken = YieldToken.load(yieldTokenAddress);

    if (!yieldToken){
        const token = ERC20.bind(Address.fromString(yieldTokenAddress));
        yieldToken = new YieldToken(yieldTokenAddress);
        yieldToken.name = token.name();
        yieldToken.symbol = token.symbol();
        yieldToken.decimals = token.decimals();
        yieldToken.save();
    }

    return yieldToken;
}

const ensurePrincipalToken = (principalTokenAddress: string): PrincipalToken => {

    let principalToken = PrincipalToken.load(principalTokenAddress);

        if (!principalToken){
            const token = ERC20.bind(Address.fromString(principalTokenAddress));
            principalToken = new PrincipalToken(principalTokenAddress);
            principalToken.name = token.name();
            principalToken.symbol = token.symbol();
            principalToken.decimals = token.decimals();
            const principalTokenContract = ITranche.bind(Address.fromString(principalToken.id));
            principalToken.expiration = principalTokenContract.unlockTimestamp();
            principalToken.save();
        }
    return principalToken;
}

export const ensureTerm = (
    id: string
): Term => {
    let term = Term.load(id);
    
    if (!term){
        let address: Address = Address.fromString(id);

        term = new Term(id);
        term.address = address;
        const tranche = ITranche.bind(address);
        term.expiration = tranche.unlockTimestamp();

        let baseTokenAddress = tranche.underlying().toHexString();
        let bt = ensureBaseToken(baseTokenAddress);
        term.baseToken = bt.id;

        let yieldTokenAddress = tranche.interestToken().toHexString();
        let yt = ensureYieldToken(yieldTokenAddress);
        term.yToken = yt.id;

        let principaltokenAddress = address.toHexString();
        let pt = ensurePrincipalToken(principaltokenAddress);
        term.pToken = pt.id;

        const trancheContract = ITranche.bind(address);
        const trancheERC20 = ERC20.bind(address);
        const trancheDecimals = trancheERC20.decimals();

        const wrappedPosition = trancheContract.position();
        const wrappedPositionERC20 = ERC20.bind(wrappedPosition);
        const wrappedDecimals = wrappedPositionERC20.decimals();

        term.trancheDecimals = trancheDecimals;
        term.wrappedDecimals = wrappedDecimals;


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
    }

    return term;
}
