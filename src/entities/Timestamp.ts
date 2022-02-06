import { BigInt } from "@graphprotocol/graph-ts"
import { Timestamp } from "../../generated/schema"
import { ensureDay } from "./Day";

export const ensureTimestamp = (timestamp: BigInt): Timestamp => {
    let timestampEntity = Timestamp.load(timestamp.toString())

    if(!timestampEntity){
        timestampEntity = new Timestamp(timestamp.toString());

        timestampEntity.day = ensureDay(timestamp).id;

        timestampEntity.save();
    }

    return timestampEntity
}