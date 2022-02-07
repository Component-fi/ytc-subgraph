import { BigInt } from "@graphprotocol/graph-ts";
import { Day } from "../../generated/schema";

export function ensureDay(timestamp: BigInt): Day {

    let date = new Date(
        timestamp.toI64() * 1000
    );

    let dateString = date.toDateString();

    let dayEntity = Day.load(dateString);

    if (!dayEntity){
        dayEntity = new Day(dateString);

        dayEntity.firstTimestamp = timestamp;
        dayEntity.day = date.getUTCDate();
        dayEntity.month = date.getUTCMonth();
        dayEntity.year = date.getUTCFullYear();
        dayEntity.save();
    }

    return dayEntity;

}