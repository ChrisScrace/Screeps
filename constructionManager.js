const sourceManager = require('sourceManager');

module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // === BUILD SOURCE CONTAINERS AT ALL SOURCE TILES ===
        this.buildSourceContainers(room);

        // === CONSTRUCTION SITE LIMIT CHECK ===
        const currentSites = room.find(FIND_CONSTRUCTION_SITES).length;
        const maxSites = room.controller.level <= 2 ? 10 :
                         room.controller.level <= 5 ? 25 : 50;
        if (currentSites >= maxSites) return;

        const spawns = room.find(FIND_MY_SPAWNS);
        if (!spawns.length) return;
        const spawn = spawns[0];

        // === AUTO-BUILD EXTENSIONS & TOWERS ===
        this.buildExtensions(spawn, room);
        this.buildTowers(spawn, room);

        // === ROADS ===
        if (currentSites === 0 && Game.time % 100 === 0) {
            const { planRoads } = require('roadPlanner');
            planRoads(room);
        }
    },

    buildSourceContainers(room) {
        const sources = room.find(FIND_SOURCES);

        for (const source of sources) {
            // Get all tiles registered for this source from sourceManager
            const tiles = sourceManager.getTilesForSource(source.id, room.name);
            if (!tiles || tiles.length === 0) continue;

            for (const tile of tiles) {
                const x = tile.x;
                const y = tile.y;

                // Skip invalid terrain or blocked spots
                if (!this.isValidConstructionSite(x, y, room)) continue;

                // Skip if a container already exists nearby
                const hasContainer = room.lookForAt(LOOK_STRUCTURES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                if (hasContainer || hasSite) continue;

                // Try to place a container construction site
                const result = room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                if (result === OK) {
                    console.log(`[ConstructionManager] Container construction started at ${x},${y} near ${source.id}`);
                }
            }
        }
    },

    buildExtensions(spawn, room) {
        const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });
        const extensionLimits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = extensionLimits[room.controller.level] || 0;
        const toBuild = maxExtensions - extensions.length;
        if (toBuild <= 0) return;
        this.buildExtensionGrid(spawn.pos, room, toBuild);
    },

    buildTowers(spawn, room) {
        if (room.controller.level < 3) return;
        const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
        const maxTowers = 1;
        const toBuild = maxTowers - towers.length;
        if (toBuild <= 0) return;
        this.buildTowerGrid(spawn.pos, room, toBuild);
    },

    buildExtensionGrid(center, room, count) {
        let placed = 0;
        for (let radius = 2; radius <= 5 && placed < count; radius++) {
            for (let dx = -radius; dx <= radius && placed < count; dx++) {
                for (let dy = -radius; dy <= radius && placed < count; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                    const x = center.x + dx;
                    const y = center.y + dy;
                    if (!this.isValidConstructionSite(x, y, room)) continue;
                    if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) placed++;
                }
            }
        }
    },

    buildTowerGrid(center, room, count) {
        const offsets = [
            { x: -2, y: -2 },
            { x: 2, y: -2 },
            { x: -2, y: 2 },
            { x: 2, y: 2 }
        ];
        let placed = 0;
        for (const offset of offsets) {
            if (placed >= count) break;
            const x = center.x + offset.x;
            const y = center.y + offset.y;
            if (!this.isValidConstructionSite(x, y, room)) continue;
            if (room.createConstructionSite(x, y, STRUCTURE_TOWER) === OK) placed++;
        }
    },

    isValidConstructionSite(x, y, room) {
        if (x < 1 || x > 48 || y < 1 || y > 48) return false;
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) return false;
        const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
        const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
        return !hasStructure && !hasSite;
    }
};
