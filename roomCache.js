module.exports = {
    init(room) {
        if (!room._cache || room._cache.tick !== Game.time) {
            room._cache = { tick: Game.time };

            // 1️⃣ Get all structures once
            const allStructures = room.find(FIND_STRUCTURES);
            room._cache.structures = allStructures;

            // 2️⃣ Categorize by type
            room._cache.containers = allStructures.filter(s =>
                s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE
            ).filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

            room._cache.towers = allStructures.filter(s => s.structureType === STRUCTURE_TOWER);
            room._cache.spawns = allStructures.filter(s => s.structureType === STRUCTURE_SPAWN);
            room._cache.extensions = allStructures.filter(s => s.structureType === STRUCTURE_EXTENSION)
                .filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

            // 3️⃣ Other room objects
            room._cache.dropped = room.find(FIND_DROPPED_RESOURCES);
            room._cache.tombstones = room.find(FIND_TOMBSTONES, { filter: t => t.store[RESOURCE_ENERGY] > 0 });
            room._cache.sources = room.find(FIND_SOURCES);
            room._cache.myCreeps = room.find(FIND_MY_CREEPS);
            room._cache.hostiles = room.find(FIND_HOSTILE_CREEPS);
            room._cache.constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        }
    },

    getContainers(room) { this.init(room); return room._cache.containers; },
    getTowers(room) { this.init(room); return room._cache.towers; },
    getSpawns(room) { this.init(room); return room._cache.spawns; },
    getExtensions(room) { this.init(room); return room._cache.extensions; },
    getDropped(room) { this.init(room); return room._cache.dropped; },
    getTombstones(room) { this.init(room); return room._cache.tombstones; },
    getSources(room) { this.init(room); return room._cache.sources; },
    getMyCreeps(room) { this.init(room); return room._cache.myCreeps; },
    getHostiles(room) { this.init(room); return room._cache.hostiles; },
    getBuildTargets(room) { this.init(room); return room._cache.constructionSites; }
};
