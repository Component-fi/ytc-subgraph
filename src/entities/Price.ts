import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Price, PriceFeed } from "../../generated/schema";
import { FeedRegistry } from "../../generated/BalancerVault/FeedRegistry";
import { ensureTimestamp } from "./Timestamp";

// TODO replace with this https://docs.chain.link/docs/feed-registry/#:~:text=The%20Chainlink%20Feed%20Registry%20is,mapping%20of%20assets%20to%20feeds.&text=They%20enable%20smart%20contracts%20to,token%20address%20on%20a%20network.

const FEED_REGISTRY = "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf";
const USD_DENOMINATION = "0x0000000000000000000000000000000000000348";
const ETH_DENOMINATION = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const FEED_NAMES = [
    "ETHUSD",   
    "BTCUSD"
]

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
    for(let i = 0; i < FEED_NAMES.length; i++){
        let name = FEED_NAMES[i];

        addPrice(name, timestamp);
    }
}

function addPrice(feedId: string, timestamp: BigInt): Price {
    let feed = ensurePriceFeed(feedId);

    const feedContract = FeedRegistry.bind(Address.fromString(FEED_REGISTRY));

    let price = new Price(feedId + timestamp.toString())

    let baseAddress = Address.fromString(feed.tokenAddress.toHexString());
    let quoteAddress = Address.fromString(USD_DENOMINATION);
    
    let priceResult = feedContract.try_latestAnswer(
        baseAddress,
        quoteAddress
    )

    if (!priceResult.reverted){
        log.warning("price, {}", [priceResult.value.toString()])
        price.price = priceResult.value;
    }


    let decimalsResult = feedContract.try_decimals(
        baseAddress,
        quoteAddress
    )

    if (!decimalsResult.reverted){
        log.warning("decimals, {}", [decimalsResult.value.toString()])
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
    }
    feed.save();
    return feed;
}