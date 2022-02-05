import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { Price, PriceFeed } from "../../generated/schema";
import { EACAggregatorProxy } from "../../generated/BalancerVault/EACAggregatorProxy";
import { ensureTimestamp } from "./Timestamp";

// TODO replace with this https://docs.chain.link/docs/feed-registry/#:~:text=The%20Chainlink%20Feed%20Registry%20is,mapping%20of%20assets%20to%20feeds.&text=They%20enable%20smart%20contracts%20to,token%20address%20on%20a%20network.

const FEED_REGISTRY = "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf"

const FEED_NAMES = [
    "ETHUSD",   
    "BTCUSD"
]

class FEED {
    constructor(
        public numeratorName: string,
        public denominatorName: string,
        public priceFeed: string
    ){
        numeratorName = numeratorName;
        denominatorName = denominatorName;
        priceFeed = priceFeed
    }
}
let FEEDS_INFO = new Map<string, FEED>();

let ethFeed = new FEED(
    "Ether",
    "United States Dollar",
    "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
)

let btcFeed = new FEED(
    "Bitcoin",
    "United States Dollar",
    "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
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

    const address: Address = Address.fromString(feed.priceFeed.toHexString());

    const feedContract = EACAggregatorProxy.bind(address);

    let price = new Price(feedId + timestamp.toString())

    price.price = feedContract.latestAnswer()
    price.decimals = feedContract.decimals()
    price.timestamp = ensureTimestamp(timestamp).id;
    price.timestampId = timestamp;

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
        log.warning("this is the address {}", [feedFields.priceFeed]);
        
        feed.priceFeed = Address.fromString(feedFields.priceFeed);
    }
    feed.save();
    return feed;
}