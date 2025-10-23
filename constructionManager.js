const sourceManager = require('sourceManager');
const roadPlanner = require('roadPlanner');

const PRIORITY = {
    CONTAINER: 1,
    EXTENSION: 2,
    TOWER: 3,
    ROAD: 4
};

const STRUCTURE_PRIORITY = {
    [STRUCTURE_CONTAINER]: PRIORITY.CONTAINER,
    [STRUCTURE_EXTENSION]: PRIORITY.EXTENSION,
    [STRUCTURE_TOWER]: PRIORITY.TOWER,
    [STRUCTURE_ROAD]: PRIORITY.ROAD
};

module.exports = {
    run(room) {
        if (!room.controller || !room.controller.my) return;

        // Limit total sites per tick to avoid spam
        const maxSites = 20;
        const currentSites = room.find(FIND_CONSTRUCTION_SITES);
        if (currentSites.length >= maxSites) return;

        // -------------------
        // Cache structures and sites
        // -------------------
        const structuresMap = {};
        const sitesMap = {};
        room.find(FIND_STRUCTURES).forEach(s => structuresMap[`${s.pos.x},${s.pos.y}`] = s);
        room.find(FIND_CONSTRUCTION_SITES).forEach(s => sitesMap[`${s.pos.x},${s.pos.y}`] = s);

        // -------------------
        // Precompute buildable tiles
        // -------------------
        const buildableTiles = new Set();
        const terrain = room.getTerrain();
        for (let x = 1; x < 49; x++) {
            for (let y = 1; y < 49; y++) {
                const key = `${x},${y}`;
                if (
                    terrain.get(x, y) !== TERRAIN_MASK_WALL &&
                    !structuresMap[key] &&
                    !sitesMap[key]
                ) {
                    buildableTiles.add(key);
                }
            }
        }

        // -------------------
        // Build priorities
        // -------------------
        if (this.buildSourceContainers(room, buildableTiles, sitesMap)) return;
        if (this.buildExtensions(room, buildableTiles, sitesMap)) return;
        if (this.buildTowers(room, buildableTiles, sitesMap)) return;
        if (!this.hasPendingHigherPrioritySites(room, PRIORITY.ROAD)) {
            this.buildRoads(room);
        }
    },

    // -----------------------------
    // PRIORITY 1: SOURCE CONTAINERS
    // -----------------------------
    buildSourceContainers(room, buildableTiles, sitesMap) {
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            const tiles = sourceManager.getTilesForSource(source.id, room.name);
            if (!tiles || tiles.length === 0) continue;

            for (const tile of tiles) {
                const key = `${tile.x},${tile.y}`;
                if (!buildableTiles.has(key)) continue;

                if (room.createConstructionSite(tile.x, tile.y, STRUCTURE_CONTAINER) === OK) {
                    this.cancelLowerPrioritySites(room, PRIORITY.CONTAINER);
                    return true;
                }
            }
        }
        return false;
    },

    // -----------------------------
    // PRIORITY 2: EXTENSIONS
    // -----------------------------
    buildExtensions(room, buildableTiles, sitesMap) {
        const spawns = room.find(FIND_MY_SPAWNS);
        if (!spawns.length) return false;

        const spawn = spawns[0];
        const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });
        const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_EXTENSION });

        const limits = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 };
        const maxExtensions = limits[room.controller.level] || 0;
        if (extensions.length + sites.length >= maxExtensions) return false;

        // Precompute candidate positions around spawn
        const spacing = 2;
        const positions = [];
        for (let dx = -6; dx <= 6; dx += spacing) {
            for (let dy = -6; dy <= 6; dy += spacing) {
                const x = spawn.pos.x + dx;
                const y = spawn.pos.y + dy;
                const key = `${x},${y}`;
                if (buildableTiles.has(key)) positions.push({ x, y });
            }
        }

        for (const pos of positions) {
            if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION) === OK) {
                this.cancelLowerPrioritySites(room, PRIORITY.EXTENSION);
                return true;
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 3: TOWERS
    // -----------------------------
    buildTowers(room, buildableTiles, sitesMap) {
        if (room.controller.level < 3) return false;

        const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
        const sites = room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_TOWER });
        const maxTowers = Math.min(1 + Math.floor(room.controller.level / 2), 6);
        if (towers.length + sites.length >= maxTowers) return false;

        const center = room.controller.pos;
        const offsets = [
            { x: -2, y: -2 }, { x: 2, y: -2 },
            { x: -2, y: 2 }, { x: 2, y: 2 }
        ];

        for (const o of offsets) {
            const x = center.x + o.x;
            const y = center.y + o.y;
            if (!buildableTiles.has(`${x},${y}`)) continue;

            if (room.createConstructionSite(x, y, STRUCTURE_TOWER) === OK) {
                this.cancelLowerPrioritySites(room, PRIORITY.TOWER);
                return true;
            }
        }

        return false;
    },

    // -----------------------------
    // PRIORITY 4: ROADS
    // -----------------------------
    buildRoads(room) {
        roadPlanner.planRoads(room, { double: true });
    },

    // -----------------------------
    // HELPER FUNCTIONS
    // -----------------------------
    isBuildableTile(room, x, y) {
        if (x < 1 || x > 48 || y < 1 || y > 48) return false;
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) return false;

        const hasStructure = room.lookForAt(LOOK_STRUCTURES, x, y).length > 0;
        const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0;
        return !hasStructure && !hasSite;
    },

    cancelLowerPrioritySites(room, priorityLevel) {
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        for (const site of sites) {
            const sitePriority = STRUCTURE_PRIORITY[site.structureType] || PRIORITY.ROAD;
            if (sitePriority > priorityLevel && site.progress === 0) {
                site.remove();
            }
        }
    },

    hasPendingHigherPrioritySites(room, priorityLevel) {
        const sites = room.find(FIND_CONSTRUCTION_SITES);
        return sites.some(site => (STRUCTURE_PRIORITY[site.structureType] || PRIORITY.ROAD) < priorityLevel);
    }
};
