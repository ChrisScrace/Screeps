const roomCache = require('roomCache');
const pathCache = require('pathCache');

module.exports = {
    run(creep) {
        // -------------------------
        // 1. Toggle hauling state
        // -------------------------
        if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) creep.memory.hauling = false;
        if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) creep.memory.hauling = true;

        const room = creep.room;

        // -------------------------
        // 2. Collect energy if not hauling
        // -------------------------
        if (!creep.memory.hauling) {
            // Get or pick target
            let target = Game.getObjectById(creep.memory.targetId);
            if (!target || 
                (target.energy !== undefined && target.energy === 0) || 
                (target.store && target.store[RESOURCE_ENERGY] === 0)) {

                const targets = roomCache.getDropped(room)
                    .concat(roomCache.getTombstones(room))
                    .concat(roomCache.getContainers(room));

                target = creep.pos.findClosestByRange(targets);
                if (target) creep.memory.targetId = target.id;
            }

            if (!target) return;

            // Move to target using path cache
            pathCache.moveTo(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });

            // Pickup or withdraw
            if (target.resourceType) creep.pickup(target);
            else creep.withdraw(target, RESOURCE_ENERGY);

            // Clear memory if target emptied
            if ((target.resourceType && target.amount === 0) ||
                (target.store && target.store[RESOURCE_ENERGY] === 0)) {
                delete creep.memory.targetId;
            }
            return;
        }

        // -------------------------
        // 3. Deliver energy if hauling
        // -------------------------
        let deliverTarget = Game.getObjectById(creep.memory.deliverId);

        // Pick new delivery target if needed
        if (!deliverTarget || deliverTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            const deliverPriority = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION];
            deliverTarget = null;

            for (const type of deliverPriority) {
                const structures = roomCache.getStructures(room, [type])[type];
                if (!structures || !structures.length) continue;

                deliverTarget = creep.pos.findClosestByRange(structures);
                if (deliverTarget) break;
            }

            if (deliverTarget) creep.memory.deliverId = deliverTarget.id;
        }

        // Move to delivery target
        if (deliverTarget) {
            pathCache.moveTo(creep, deliverTarget, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.transfer(deliverTarget, RESOURCE_ENERGY);

            // Clear memory if full
            if (deliverTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                delete creep.memory.deliverId;
            }
            return;
        }

        // -------------------------
        // 4. Fallback: drop energy on ground
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
