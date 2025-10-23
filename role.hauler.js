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
        // Deliver energy if hauling
        if (creep.memory.hauling) {
            const deliverPriority = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION];
            let deliverTarget = null;

            // Always check memory first
            if (creep.memory.deliverId) {
                const t = Game.getObjectById(creep.memory.deliverId);
                if (t && t.store.getFreeCapacity(RESOURCE_ENERGY) > 0) deliverTarget = t;
                else delete creep.memory.deliverId; // clear invalid target
            }

            // Find new target if none or memory target invalid
            if (!deliverTarget) {
                for (const type of deliverPriority) {
                    const structures = roomCache.getStructures(room, [type])[type];
                    if (!structures || !structures.length) continue;

                    const closest = creep.pos.findClosestByPath(structures, {
                        filter: s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    });

                    if (closest) {
                        deliverTarget = closest;
                        creep.memory.deliverId = closest.id;
                        break;
                    }
                }
            }

            if (deliverTarget) {
                pathCache.moveTo(creep, deliverTarget, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.transfer(deliverTarget, RESOURCE_ENERGY);
                return;
            }

            // Fallback: drop on ground if nowhere to deliver
            creep.drop(RESOURCE_ENERGY);
        }


        // -------------------------
        // 4. Fallback: drop energy on ground
        // -------------------------
        creep.drop(RESOURCE_ENERGY);
    }
};
