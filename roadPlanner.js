// utils/roadPlanner.js

/**
 * Adaptive and safe road planner.
 * - Double roads for heavy traffic: spawn↔sources, spawn↔controller
 * - Single roads for light traffic: sources↔controller, minerals, spawn↔extensions
 * - Avoids walls, sources, minerals
 * - CPU- and construction-limit safe
 */
function planRoads(room) {
    if (!room.controller) return;

    const spawns = room.find(FIND_MY_SPAWNS);
    const sources = room.find(FIND_SOURCES);
    const minerals = room.find(FIND_MINERALS);
    const extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION });

    if (!spawns.length || sources.length === 0) return;

    const MAX_SITES = 50;
    if (room.find(FIND_CONSTRUCTION_SITES).length > MAX_SITES) return;

    /**
     * Build a path of roads between two points.
     * @param {RoomPosition} from
     * @param {RoomPosition} to
     * @param {boolean} doubleStack - whether to make it two tiles wide
     */
    function buildRoadPath(from, to, doubleStack = false) {
        const path = room.findPath(from, to, {
            ignoreCreeps: true,
            ignoreRoads: true,
            swampCost: 1,
            costCallback: (roomName, costMatrix) => {
                const r = Game.rooms[roomName];
                if (!r) return;
                // Block sources and minerals
                r.find(FIND_SOURCES).forEach(s => costMatrix.set(s.pos.x, s.pos.y, 255));
                r.find(FIND_MINERALS).forEach(m => costMatrix.set(m.pos.x, m.pos.y, 255));
                return costMatrix;
            }
        });

        for (const step of path) {
            const mainPos = new RoomPosition(step.x, step.y, room.name);
            tryBuildRoad(mainPos);

            if (doubleStack) {
                for (const offset of adjacentOffsets()) {
                    const adjX = step.x + offset.x;
                    const adjY = step.y + offset.y;
                    if (isInBounds(adjX, adjY)) {
                        tryBuildRoad(new RoomPosition(adjX, adjY, room.name));
                    }
                }
            }
        }
    }

    // Attempts to build a road if there’s no existing structure/site and tile is safe
    function tryBuildRoad(pos) {
        const room = Game.rooms[pos.roomName]; // <- get Room object
        if (!room) return; // room not visible, can't build

        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain === TERRAIN_MASK_WALL) return;

        // Prevent roads on sources/minerals
        if (pos.lookFor(LOOK_SOURCES).length || pos.lookFor(LOOK_MINERALS).length) return;

        const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
        const hasSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(s => s.structureType === STRUCTURE_ROAD);

        if (!hasRoad && !hasSite) room.createConstructionSite(pos, STRUCTURE_ROAD);
    }


    function adjacentOffsets() {
        return [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
        ];
    }

    function isInBounds(x, y) {
        return x > 0 && x < 49 && y > 0 && y < 49;
    }

    // ---- ROAD LOGIC ----
    for (const spawn of spawns) {
        // Heavy traffic: spawn ↔ sources
        for (const source of sources) buildRoadPath(spawn.pos, source.pos, true);

        // Heavy traffic: spawn ↔ controller
        buildRoadPath(spawn.pos, room.controller.pos, true);

        // Spawn ↔ extensions (medium traffic, single)
        for (const ext of extensions) buildRoadPath(spawn.pos, ext.pos, false);
    }

    // Light traffic: sources ↔ controller
    for (const source of sources) buildRoadPath(source.pos, room.controller.pos, false);

    // Optional: minerals ↔ closest spawn
    for (const mineral of minerals) {
        const closestSpawn = mineral.pos.findClosestByRange(spawns.map(s => s.pos));
        buildRoadPath(mineral.pos, closestSpawn, false);
    }
}

module.exports = { planRoads };
