import { BigInt } from "@graphprotocol/graph-ts";
import { Hour } from "../../generated/schema";

export function ensureHour(timestamp: BigInt): Hour {

    let date = new Date(
        timestamp.toI64() * 1000
    );

    let dateString = date.toDateString();
    let hour = date.getUTCHours();

    let hourEntity = Hour.load(dateString+hour.toString());

    if (!hourEntity){
        hourEntity = new Hour(dateString);

        hourEntity.firstTimestamp = timestamp;
        hourEntity.hour = hour;
        hourEntity.day = date.getUTCDate();
        hourEntity.month = date.getUTCMonth();
        hourEntity.year = date.getUTCFullYear();
        hourEntity.save();
    }

    return hourEntity;

}