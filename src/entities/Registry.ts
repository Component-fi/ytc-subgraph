import { BigInt } from '@graphprotocol/graph-ts';
import { Registry } from '../../generated/schema'
import { ensureTimestamp } from './Timestamp';

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
    }

    return registry;
}