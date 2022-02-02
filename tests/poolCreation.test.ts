import { Address, ethereum, log } from '@graphprotocol/graph-ts';
import { test, assert, newMockEvent } from 'matchstick-as/assembly/index';
import { PoolCreated } from '../generated/WeightedPoolFactory/WeightedPoolFactory';
import { handleWeightedPoolCreated } from '../src/mapping';

test ('Can add pool created by element Multisig', () => {
    let newPoolEvent = createNewWeightedPoolCreatedEvent("0x422494292e7a9dda8778bb4ea05c2779a3d60f5d", "0x0000000000000000000000000000000000000000")

    handleWeightedPoolCreated(newPoolEvent);

    assert.fieldEquals('YieldPool', '0x0000000000000000000000000000000000000000', 'id', '0x0000000000000000000000000000000000000000');

    assert.fieldEquals('YieldPool', '0x0000000000000000000000000000000000000000', 'yToken', '0x0000000000000000000000000000000000000001');
    assert.fieldEquals('YieldPool', '0x0000000000000000000000000000000000000000', 'baseToken', '0x0000000000000000000000000000000000000002');

});

export function createNewWeightedPoolCreatedEvent(
    fromAddress: string,
    poolAddress: string,
): PoolCreated {
    let mockEvent = newMockEvent();

    mockEvent.transaction.from = Address.fromString(fromAddress);

    let newWeightedPoolCreatedEvent = new PoolCreated(
        mockEvent.address,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters
    )

    newWeightedPoolCreatedEvent.parameters = new Array()

    let poolAddressBytes: Address = Address.fromString(poolAddress);
    let addressParam = new ethereum.EventParam('address', ethereum.Value.fromAddress(poolAddressBytes))

    newWeightedPoolCreatedEvent.parameters.push(addressParam);

    return newWeightedPoolCreatedEvent;
}