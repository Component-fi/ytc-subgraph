import { BigInt } from "@graphprotocol/graph-ts";
import { Hour } from "../../generated/schema";
import { ensureDay } from "./Day";

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
        hourEntity.day = ensureDay(timestamp).id;
        hourEntity.hourInt = hour;
        hourEntity.dayInt = date.getUTCDate();
        hourEntity.monthInt = date.getUTCMonth();
        hourEntity.yearInt = date.getUTCFullYear();
        hourEntity.save();
    }

    return hourEntity;

}