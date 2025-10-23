const PATH_TTL = 50; // ticks before recalculating path

const pathCache = {};

module.exports = {
    getPath(creep, target) {
        const key = `${creep.pos.roomName}_${creep.pos.x}_${creep.pos.y}_${target.pos.roomName}_${target.pos.x}_${target.pos.y}`;
        const entry = pathCache[key];

        // Use cached path if it's still valid
        if (entry && entry.expire > Game.time) return entry.path;

        // Compute new path
        const path = creep.room.findPath(creep.pos, target.pos, { ignoreCreeps: true });
        pathCache[key] = { path, expire: Game.time + PATH_TTL };
        return path;
    },

    moveTo(creep, target, opts = {}) {
        const path = this.getPath(creep, target);
        if (!path || !path.length) return;

        // Apply options for visualization, reusePath disabled because we're caching
        const nextStep = path[0];
        creep.move(creep.pos.getDirectionTo(nextStep), opts);
    },

    clear() {
        // optional: clear old paths every 100 ticks
        for (const key in pathCache) {
            if (pathCache[key].expire < Game.time) delete pathCache[key];
        }
    }
};
