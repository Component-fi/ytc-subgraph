import { BigInt } from "@graphprotocol/graph-ts"
import { Timestamp } from "../../generated/schema"

export const ensureTimestamp = (timestamp: BigInt): Timestamp => {
    let timestampEntity = Timestamp.load(timestamp.toString())

    if(!timestampEntity){
        timestampEntity = new Timestamp(timestamp.toString());
        timestampEntity.save();
    }

    return timestampEntity
}