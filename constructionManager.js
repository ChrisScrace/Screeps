const { planRoads } = require('roadPlanner');

module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // === BUILD SOURCE CONTAINERS FIRST ===
        this.buildSourceContainers(room);

        // Limit construction sites to prevent spam
        const maxSites = room.controller.level <= 2 ? 10 :
                         room.controller.level <= 5 ? 25 : 50;
        if (room.find(FIND_CONSTRUCTION_SITES).length > maxSites) return;

        const spawns = room.find(FIND_MY_SPAWNS);
        if (!spawns.length) return;
        const spawn = spawns[0];

        // === AUTO-BUILD EXTENSIONS ===
        const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });
        const extensionLimits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = extensionLimits[room.controller.level] || 0;

        if (extensions.length < maxExtensions) {
            this.buildExtensionGrid(spawn.pos, room, maxExtensions - extensions.length);
        }

        // === AUTO-BUILD TOWERS ===
        if (room.controller.level >= 3) {
            const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
            const maxTowers = 1; // expand logic if you want more towers later
            if (towers.length < maxTowers) {
                this.buildTowerGrid(spawn.pos, room, maxTowers - towers.length);
            }
        }

        // === ROADS ===
        if (Game.time % 100 === 0) {
            planRoads(room);
        }
    },

    /**
     * Build extensions in a compact grid around a spawn
     */
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

    /**
     * Build towers in fixed pattern around spawn
     */
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

    /**
     * Check if a position is valid for construction
     */
    isValidConstructionSite(x, y, room) {
        if (x < 1 || x > 48 || y < 1 || y > 48) return false;
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) return false;
        const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
        const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
        return !hasStructure && !hasSite;
    },

    /**
     * Build containers next to sources, prioritizing walkable tiles
     */
    buildSourceContainers(room) {
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            // Skip if container already exists
            const existing = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER });
            if (existing.length > 0) continue;

            // Pick first walkable tile around source
            const terrain = room.getTerrain();
            const offsets = [
                { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
                { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
            ];
            for (const o of offsets) {
                const x = source.pos.x + o.x;
                const y = source.pos.y + o.y;
                if (!this.isValidConstructionSite(x, y, room)) continue;
                room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                break;
            }
        }
    }
};
