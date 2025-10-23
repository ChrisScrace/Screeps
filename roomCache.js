// Optimized per-tick room cache
module.exports = {
    init(room) {
        if (!room._cache || room._cache.tick !== Game.time) {
            const allStructures = room.find(FIND_STRUCTURES);

            room._cache = {
                tick: Game.time,

                // Dynamic objects
                dropped: room.find(FIND_DROPPED_RESOURCES),
                tombstones: room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 }),
                hostiles: room.find(FIND_HOSTILE_CREEPS),
                myCreeps: room.find(FIND_MY_CREEPS),

                // Structures
                structures: allStructures,
                containers: allStructures.filter(s =>
                    (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                    s.store[RESOURCE_ENERGY] > 0
                ),
                energyStructures: allStructures.filter(s =>
                    [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].includes(s.structureType) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                ),
                repairTargets: allStructures.filter(s =>
                    (s.hits < s.hitsMax && s.hits < 50000) || s.hits < 2000
                ),

                // Other
                sources: room.find(FIND_SOURCES),
                buildTargets: room.find(FIND_CONSTRUCTION_SITES),
                upgradeTargets: room.controller && room.controller.my ? [room.controller] : []
            };
        }
    },

    getDropped(room) { this.init(room); return room._cache.dropped; },
    getTombstones(room) { this.init(room); return room._cache.tombstones; },
    getContainers(room) { this.init(room); return room._cache.containers; },
    getEnergyStructures(room) { this.init(room); return room._cache.energyStructures; },
    getRepairTargets(room) { this.init(room); return room._cache.repairTargets; },
    getSources(room) { this.init(room); return room._cache.sources; },
    getBuildTargets(room) { this.init(room); return room._cache.buildTargets; },
    getUpgradeTargets(room) { this.init(room); return room._cache.upgradeTargets; },
    getHostiles(room) { this.init(room); return room._cache.hostiles; },
    getMyCreeps(room) { this.init(room); return room._cache.myCreeps; },
    getStructures(room) { this.init(room); return room._cache.structures; },

};
