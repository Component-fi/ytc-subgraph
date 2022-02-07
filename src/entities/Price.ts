import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Price, PriceFeed } from "../../generated/schema";
import { FeedRegistry } from "../../generated/BalancerVault/FeedRegistry";
import { ensureTimestamp } from "./Timestamp";
import { ensureRegistry } from "./Registry";
import { FEED_NAMES, FEED_REGISTRY, USD_DENOMINATION } from "../constants";

class FEED {
    constructor(
        public numeratorName: string,
        public denominatorName: string,
        public tokenAddress: string
    ){
        numeratorName = numeratorName;
        denominatorName = denominatorName;
        tokenAddress = tokenAddress;
    }
}

let FEEDS_INFO = new Map<string, FEED>();

let ethFeed = new FEED(
    "Ether",
    "United States Dollar",
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
)

let btcFeed = new FEED(
    "Bitcoin",
    "United States Dollar",
    "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
)

FEEDS_INFO.set("ETHUSD", ethFeed);
FEEDS_INFO.set("BTCUSD", btcFeed);


export function logPrices(timestamp: BigInt): void {
    let registry = ensureRegistry();

    let feeds = registry.priceFeeds;

    for(let i = 0; i < feeds.length; i++){
        let feedId = feeds[i];

        addPrice(feedId, timestamp);
    }

    registry.lastUpdatePriceFeeds = timestamp;
    registry.save();
}

function addPrice(feedId: string, timestamp: BigInt): Price {
    let feed = ensurePriceFeed(feedId);

    const feedRegistry = FeedRegistry.bind(Address.fromString(FEED_REGISTRY));

    let price = new Price(feedId + timestamp.toString())

    let baseAddress = Address.fromString(feed.tokenAddress.toHexString());
    let quoteAddress = Address.fromString(USD_DENOMINATION);
    
    let priceResult = feedRegistry.try_latestAnswer(
        baseAddress,
        quoteAddress
    )

    if (!priceResult.reverted){
        price.price = priceResult.value;
    }


    let decimalsResult = feedRegistry.try_decimals(
        baseAddress,
        quoteAddress
    )

    if (!decimalsResult.reverted){
        price.decimals = decimalsResult.value;
    }
    price.timestamp = ensureTimestamp(timestamp).id;
    price.timestampId = timestamp;
    price.priceFeed = feedId;

    price.save();
    return price;
}

const ensurePriceFeed = (id: string): PriceFeed => {
    let feed = PriceFeed.load(id);

    if (!feed){
        feed = new PriceFeed(id);

        let feedFields = FEEDS_INFO.get(id);

        feed.denominatorName = feedFields.denominatorName;
        feed.numeratorName = feedFields.numeratorName;
        
        feed.tokenAddress = Address.fromString(feedFields.tokenAddress);

        feed.save();

        let registry = ensureRegistry();
        let priceFeeds: string[] = registry.priceFeeds;
        priceFeeds.push(feed.id);
        registry.priceFeeds = priceFeeds;
        registry.save();
    }
    return feed;
}

export function addPriceFeeds(): void {
    for (let i = 0; i<FEED_NAMES.length; i++){
        ensurePriceFeed(FEED_NAMES[i]);
    }
}