const sourceManager = require('sourceManager');
const roadPlanner = require('roadPlanner');

module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // === LIMIT ACTIVE SITES ===
        const maxSites = 20;
        const currentSites = room.find(FIND_CONSTRUCTION_SITES);
        if (currentSites.length >= maxSites) return;

        // === PRIORITY 1: CONTAINERS ON SOURCE TILES ===
        if (this.buildSourceContainers(room)) return;

        // === PRIORITY 2: EXTENSIONS IN GRID PATTERN ===
        if (this.buildExtensions(room)) return;

        // === PRIORITY 3: TOWERS ===
        if (this.buildTowers(room)) return;

        // === PRIORITY 4: ROADS (only if no other sites exist) ===
        if (currentSites.length === 0) {
            this.buildRoads(room);
        }
    },

    // -----------------------------
    // PRIORITY 1: SOURCE CONTAINERS
    // -----------------------------
    buildSourceContainers(room) {
        let built = false;
        const sources = room.find(FIND_SOURCES);

        for (const source of sources) {
            const tiles = sourceManager.getTilesForSource(source.id, room.name);
            if (!tiles || tiles.length === 0) continue;

            for (const tile of tiles) {
                const x = tile.x, y = tile.y;

                const terrain = room.getTerrain().get(x, y);
                if (terrain === TERRAIN_MASK_WALL) continue;

                // Remove any non-container construction sites blocking the tile
                const blockingSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                for (const site of blockingSites) {
                    if (site.structureType !== STRUCTURE_CONTAINER) site.remove();
                }

                // Skip if there’s already a container or site
                const hasContainer = room.lookForAt(LOOK_STRUCTURES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y)
                    .some(s => s.structureType === STRUCTURE_CONTAINER);
                if (hasContainer || hasSite) continue;

                const result = room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                if (result === OK) {
                    built = true;
                    break;
                }
            }
            if (built) break; // Only build one per tick
        }

        return built;
    },

    // -----------------------------
    // PRIORITY 2: EXTENSIONS
    // -----------------------------
    buildExtensions(room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) return false;

        const spawn = spawns[0];
        const extensions = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });
        const sites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION
        });

        const limits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = limits[room.controller.level] || 0;
        if (extensions.length + sites.length >= maxExtensions) return false;

        // Build extensions in spaced grid pattern
        const spacing = 2; // 1 tile of walking space between extensions
        for (let dx = -6; dx <= 6; dx++) {
            for (let dy = -6; dy <= 6; dy++) {
                if ((Math.abs(dx) % spacing !== 0) || (Math.abs(dy) % spacing !== 0)) continue;
                const x = spawn.pos.x + dx;
                const y = spawn.pos.y + dy;

                if (!this.isBuildableTile(room, x, y)) continue;
                if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
                    return true;
                }
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 3: TOWERS
    // -----------------------------
    buildTowers(room) {
        if (room.controller.level < 3) return false;

        const towers = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });
        const sites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: s => s.structureType === STRUCTURE_TOWER
        });

        const maxTowers = Math.min(1 + Math.floor(room.controller.level / 2), 6);
        if (towers.length + sites.length >= maxTowers) return false;

        // Prefer central defensive positions around spawn or controller
        const center = room.controller.pos;
        const offsets = [
            { x: -2, y: -2 }, { x: 2, y: -2 },
            { x: -2, y: 2 }, { x: 2, y: 2 }
        ];

        for (const o of offsets) {
            const x = center.x + o.x;
            const y = center.y + o.y;
            if (!this.isBuildableTile(room, x, y)) continue;

            if (room.createConstructionSite(x, y, STRUCTURE_TOWER) === OK) {
                return true;
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 4: ROADS
    // -----------------------------
    buildRoads(room) {
        // If any higher priority structures exist, cancel old road sites
        const hasImportantSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: s => s.structureType !== STRUCTURE_ROAD
        }).length > 0;

        if (hasImportantSites) {
            const roadSites = room.find(FIND_CONSTRUCTION_SITES, {
                filter: s => s.structureType === STRUCTURE_ROAD
            });
            for (const site of roadSites) site.remove();
            return;
        }

        // Plan or repair roads every 100 ticks
        if (Game.time % 100 === 0) {
            roadPlanner.planRoads(room, { double: true });
        }
    },

    // -----------------------------
    // UTILITY
    // -----------------------------
    isBuildableTile(room, x, y) {
        if (x < 1 || x > 48 || y < 1 || y > 48) return false;
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) return false;

        const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
        const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
        return !hasStructure && !hasSite;
    }
};
