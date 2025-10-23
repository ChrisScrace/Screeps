// Centralized per-tick cache for room objects
module.exports = {
    init(room) {
        if (!room._cache || room._cache.tick !== Game.time) {
            room._cache = {
                tick: Game.time,
                dropped: null,
                tombstones: null,
                containers: null,
                structures: {},
                sources: null
            };
        }
    },

    getDropped(room) {
        this.init(room);
        if (!room._cache.dropped) room._cache.dropped = room.find(FIND_DROPPED_RESOURCES);
        return room._cache.dropped;
    },

    getTombstones(room) {
        this.init(room);
        if (!room._cache.tombstones) room._cache.tombstones = room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 });
        return room._cache.tombstones;
    },

    getContainers(room) {
        this.init(room);
        if (!room._cache.containers) room._cache.containers = room.find(FIND_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
                s.store[RESOURCE_ENERGY] > 0
        });
        return room._cache.containers;
    },

    getStructures(room, types) {
        this.init(room);
        types.forEach(type => {
            if (!room._cache.structures[type]) {
                room._cache.structures[type] = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === type && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
            }
        });
        return room._cache.structures;
    },

    getSources(room) {
        this.init(room);
        if (!room._cache.sources) room._cache.sources = room.find(FIND_SOURCES);
        return room._cache.sources;
    },

    getBuildTargets(room) {
        this.init(room);
        if (!room._cache.buildTargets) {
            room._cache.buildTargets = room.find(FIND_CONSTRUCTION_SITES);
        }
        return room._cache.buildTargets;
    },

    getUpgradeTargets(room) {
        this.init(room);
        if (!room._cache.upgradeTargets) {
            room._cache.upgradeTargets = room.controller && room.controller.my ? [room.controller] : [];
        }
        return room._cache.upgradeTargets;
    },

    getRepairTargets(room, minHits = 2000) {
        this.init(room);
        if (!room._cache.repairTargets) {
            room._cache.repairTargets = room.find(FIND_STRUCTURES, {
                filter: s => (s.hits < s.hitsMax && s.hits < 50000) || s.hits < minHits
            });
        }
        return room._cache.repairTargets;
    }

};
