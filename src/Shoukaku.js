const EventEmitter = require('events');
const ShoukakuSocket = require('./node/ShoukakuSocket.js');

const { shoukakuOptions, nodeOptions, state } = require('./Constants.js');
const { mergeDefault, getVersion } = require('./Utils.js');

/**
 * Discord.JS Client
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
 */

/**
 * Discord.JS Guild
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/master/class/Guild}
 */

/**
 * Node.js Event Emitter
 * @external EventEmitter
 * @see {@link https://nodejs.org/api/events.html}
 */

/**
 * Shoukaku, governs the client's lavalink node connections.
 * @class Shoukaku
 * @extends {EventEmitter}
 */
class Shoukaku extends EventEmitter {
    /**
     * @param {Client} client Your Discord.JS initalized client
     * @param {Object[]} nodes Array of Lavalink nodes to initially connect to
     * @param {string} nodes.name Lavalink node name
     * @param {string} nodes.url Lavalink node url without prefix like, ex: http://
     * @param {string} nodes.auth Lavalink node password
     * @param {boolean} [nodes.secure=false] Whether this node should be in secure wss or https mode
     * @param {string} [nodes.group=undefined] Lavalink node group
     * @param {Object} [options={}] Options to initalize this instance
     * @param {boolean} [options.resumable=false] If you want your node to support resuming
     * @param {number} [options.resumableTimeout=30] Timeout when Lavalink will decide a player isn't resumed and will destroy the connection to it, measured in seconds
     * @param {number} [options.reconnectTries=2] Amount of tries to connect to the Lavalink node before it decides that the node is unreconnectable
     * @param {boolean} [options.moveOnDisconnect=false] Specifies if the library will attempt to reconnect players on a disconnected node to another node
     * @param {number} [options.restTimeout=15000] Timeout on rest requests to your lavalink node, measured in milliseconds
     * @param {number} [options.reconnectInterval=5000] Timeout between reconnect attempts, measured in milliseconds
     * @param {number} [options.closedWebsocketEventDelay=500] Timeout before shoukaku processes a websocket closed event, measured in milliseconds
     * @param {string} [options.userAgent="name/version(url)"] User-Agent to use on connecting to WS and REST requests
     */
    constructor(client, nodes, options) {
        super();
        const { variant, version } = getVersion();
        if (variant === 'light') {
            if (!version.startsWith('3'))
                throw new Error('Shoukaku will only work at Discord.JS-light v3. Versions below Discord.JS-light v3 is not supported');
        } else {
            if (!version.startsWith('12') && !version.startsWith('13'))
                throw new Error('Shoukaku will only work at Discord.JS v12 or higher. Versions below Discord.JS v12 is not supported');
        }
        if (!nodes?.length) 
            throw new Error('No nodes supplied');
        /**
        * The instance of Discord.JS client
        * @type {Client}
        */
        this.client = client;
        /**
        * The user id of the bot that is being governed
        * @type {?string}
        */
        this.id = null;
        /**
        * The current nodes that is being handled
        * @type {Map<string, ShoukakuSocket>}
        */
        this.nodes = new Map();

        Object.defineProperty(this, 'options', { value: mergeDefault(shoukakuOptions, options) });

        this.client.once('ready', () => this._clientReady(nodes));
        this.client.on('raw', event => this._clientRaw(event));
    } 

    /**
     * Gets all the Players that is currently active on all nodes in this instance.
     * @type {Map<string, ShoukakuPlayer>}
     * @memberof Shoukaku
     */
    get players() {
        const players = new Map();
        for (const node of this.nodes.values()) {
            for (const [id, player] of node.players) players.set(id, player);
        }
        return players;
    }

    /**
     * Debug related things
     * @event Shoukaku#debug
     * @param {string} name The name of the node that sent the debug info
     * @param {string} info The debug info
     * @memberof Shoukaku
     */
    /**
     * Emitted when a node ecountered an internal error
     * @event Shoukaku#error
     * @param {string} name The node name that errored
     * @param {Error} error The error object
     * @memberof Shoukaku
     * @example
     * Shoukaku.on('error', console.error);
     */
    /** 
     * Emitted when a node becomes ready
     * @event Shoukaku#ready
     * @param {string} name The node that sent the ready event
     * @param {boolean} reconnect If the node is a reconnected node
     * @memberof Shoukaku
     */
    /**
     * Emitted when a node emits a close event
     * @event Shoukaku#close
     * @param {string} name The node that sent the ready event
     * @param {number} code The websocket close code: https://github.com/Luka967/websocket-close-codes
     * @param {reason} reason The reason for this close event
     * @memberof Shoukaku
     */
    /**
     * Emitted when a node will not reconnect again
     * @event Shoukaku#disconnect
     * @param {string} name The node that sent the disconnect event
     * @param {ShoukakuPlayer[]} players The players that is in this disconnected node
     * @param {error} error The error for this disconnect
     * @memberof Shoukaku
     */

    /**
    * Adds a new node to this manager
    * @param {Object} options The node options to connect
    * @param {string} options.name Lavalink node name
    * @param {string} options.url Lavalink node url without prefix like, ex: http://
    * @param {string} options.auth Lavalink node password
    * @param {boolean} [options.secure=false] Whether this node should be in secure wss or https mode
    * @param {string} [options.group=undefined] Lavalink node group
    * @memberof Shoukaku
    * @returns {void}
    */
    addNode(options) {
        const node = new ShoukakuSocket(this, options);
        node.on('debug', (...args) => this.emit('debug', ...args));
        node.on('error', (...args) => this.emit('error', ...args));
        node.on('disconnect', (...args) => this.emit('disconnect', ...args));
        node.on('close', (...args) => this.emit('close', ...args));
        node.on('ready', (...args) => this.emit('ready', ...args));
        node.connect();
        this.nodes.set(node.name, node);
    }
    /**
     * Removes a node from this manager
     * @param {string} name The node to remove
     * @param {string} [reason='Remove node executed'] The reason for disconnect
     * @memberof Shoukaku
     * @returns {void}
     */
    removeNode(name, reason = 'Remove node executed') {
        const node = this.nodes.get(name);
        if (!node) throw new Error('The node name you specified doesn\'t exist');
        this.nodes.delete(node.name);
        node.disconnect(1000, reason);
        node.removeAllListeners();
    }
    /**
     * Shortcut to get the Ideal Node or a manually specified Node from the current nodes that Shoukaku governs.
     * @param {string|Array<string>} [query] If unspecified, this will return any ideal node, if specified with a string, it will return the node that matches the string, if an array, this will return an ideal node from a group
     * @memberof Shoukaku
     * @returns {ShoukakuSocket}
     * @example
     * async function BurningLove() {
     *   const node = Shoukaku.getNode();
     *   const list = await node.rest.resolve('Kongou Burning Love', 'youtube');
     *   const player = await node.joinChannel({ guildID: 'guild_id', voiceChannelID: 'voice_channel_id' });
     *   player.playTrack(list.tracks.shift());
     * }
     * BurningLove();
     */
    getNode(query) {
        if (!this.nodes.size) throw new Error('No nodes available, please add a node first');
        if (!query || Array.isArray(query)) return this._getIdeal(query);
        const node = this.nodes.get(query);
        if (!node) throw new Error('The node name you specified is not one of my nodes');
        if (node.state !== state.CONNECTED) throw new Error('This node is not yet ready');
        return node;
    }
    /**
     * @memberOf Shoukaku
     * @param {string} group
     * @returns {ShoukakuSocket}
     * @private
     */
    _getIdeal(group) {
        const nodes = [...this.nodes.values()]
            .filter(node => node.state === state.CONNECTED);
        if (!group) {
            return nodes
                .sort((a, b) => a.penalties - b.penalties)
                .shift();
        }
        return nodes
            .filter(node => group.includes(node.group))
            .sort((a, b) => a.penalties - b.penalties)
            .shift();
    }
    /**
     * @memberOf Shoukaku
     * @param {Array<Object>} nodes
     * @returns {void}
     * @private
     */
    _clientReady(nodes) {
        this.id = this.client.user.id;
        this.emit('debug', 'Manager',`[Manager] : Connecting ${nodes.length} nodes`);
        for (const node of nodes) this.addNode(mergeDefault(nodeOptions, node));
    }
    /**
     * @memberOf Shoukaku
     * @param {Object} packet
     * @returns {void}
     * @private
     */
    _clientRaw(packet) {
        if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
        for (const node of this.nodes.values()) node._clientRaw(packet);
    }
}
module.exports = Shoukaku;
