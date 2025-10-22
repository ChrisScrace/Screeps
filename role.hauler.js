const spawnManager = require('spawnManager');

module.exports = {
    run(creep) {
        const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        // ==============================
        // 1️⃣ Pick up dropped energy first
        // ==============================
        if (creep.store.getFreeCapacity() > 0) {
            const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (dropped) {
                if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // Withdraw from containers near sources
            const sourceContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s =>
                    s.structureType === STRUCTURE_CONTAINER &&
                    s.store[RESOURCE_ENERGY] > 100 &&
                    s.pos.findInRange(FIND_SOURCES, 2).length > 0
            });
            if (sourceContainer) {
                if (creep.withdraw(sourceContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sourceContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        }

        // ==============================
        // 2️⃣ Deliver energy if carrying any
        // ==============================
        if (creep.store[RESOURCE_ENERGY] > 0) {
            // Deliver to spawn or extensions first
            let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s =>
                    (s.structureType === STRUCTURE_SPAWN ||
                        s.structureType === STRUCTURE_EXTENSION) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            // Then containers near base
            if (!target) {
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s =>
                        s.structureType === STRUCTURE_CONTAINER &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                        s.pos.findInRange(FIND_SOURCES, 2).length === 0 // not source container
                });
            }

            // Then storage (if exists)
            if (!target) {
                target = creep.room.storage;
            }

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
        }

        // ==============================
        // 3️⃣ Avoid blocking the spawn
        // ==============================
        if (creep.pos.inRangeTo(spawn, 1)) {
            const away = spawn.pos.findClosestByPath(FIND_EXIT);
            if (away) {
                creep.moveTo(away, { visualizePathStyle: { stroke: '#ff0000' } });
            } else {
                creep.moveTo(spawn.pos.x + 3, spawn.pos.y, spawn.room.name);
            }
            return;
        }

        // ==============================
        // 4️⃣ Idle position (safe parking)
        // ==============================
        const idlePos = spawnManager.findIdlePosition(creep.room);
        if (idlePos && !creep.pos.isEqualTo(idlePos)) {
            creep.moveTo(idlePos, { visualizePathStyle: { stroke: '#5555ff' } });
        }
    }
};
