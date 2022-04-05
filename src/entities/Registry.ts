import { BigInt } from '@graphprotocol/graph-ts';
import { Registry } from '../../generated/schema'

export function ensureRegistry(): Registry  {
    let registry = Registry.load("0");

    if (!registry){
        registry = new Registry("0");
        registry.baseTokens = [];
        registry.principalTokens = [];
        registry.yieldTokens = [];
        registry.terms = [];
        registry.priceFeeds = [];
        registry.principalPools = [];
        registry.yieldPools = [];
        registry.lastUpdateBaseTokens = BigInt.zero();
        registry.lastUpdatePriceFeeds = BigInt.zero();
        registry.lastUpdatePrincipalPools = BigInt.zero();
        registry.lastUpdatePrincipalTokens = BigInt.zero();
        registry.lastUpdateTerms = BigInt.zero();
        registry.lastUpdateYieldPools = BigInt.zero();
        registry.lastUpdateYieldTokens = BigInt.zero();
    }

    return registry;
}