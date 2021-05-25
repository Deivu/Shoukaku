/**
 * ShoukakuStats, the current status of a lavalink node
 * @class ShoukakuStats
 */
class ShoukakuStats {
    /**
     * @param {Object} status The raw op stats from lavalink
     */
    constructor(status = {}) {
        /**
         * Amount of players currently in this node
         * @type {number}
         */
        this.players = status.players || 0;
        /**
         * Amount of playing players currently in this node
         * @type {number}
         */
        this.playingPlayers = status.playingPlayers || 0;
        /**
         * The memory status of this node
         * @type {Object}
         * @property {number} reservable Reservable memory
         * @property {number} used Used memory
         * @property {number} free Free memory
         * @property {number} allocated Allocated memory
         */
        this.memory = status.memory || {
            reservable: 0,
            used: 0,
            free: 0,
            allocated: 0
        };
        /**
         * The frame stats that has been sent by this node to discord voice
         * @type {Object}
         * @property {number} sent Number of succesfully sent frames
         * @property {number} deficit Number of deficit frames
         * @property {number} nulled  Number of nulled freames
         */
        this.frameStats = status.frameStats || {
            sent: 0,
            deficit: 0,
            nulled: 0
        };
        /**
         * The cpu stats of the node where this node is
         * @type {Object} 
         * @property {number} cores Number of cores of the lavalink's server
         * @property {number} systemLoad The load on which the system takes
         * @property {number} lavalinkLoad The load on which the lavalink takes
         */
        this.cpu = status.cpu || {
            cores: 0,
            systemLoad: 0,
            lavalinkLoad: 0
        };
        /**
         * The current uptime of this node
         * @type {number}
         */
        this.uptime = status.uptime || 0;
    }
}

module.exports = ShoukakuStats;