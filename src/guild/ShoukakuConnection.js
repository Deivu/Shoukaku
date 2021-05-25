const AbortController = require('abort-controller');
const { EventEmitter, once } = require('events');
const { state } = require('../Constants.js');
const { wait } = require('../Utils.js');

/**
 * ShoukakuConnection, manages a voice connection between Discord and Lavalink
 * @class ShoukakuConnection
 * @extends {EventEmitter}
 */
class ShoukakuConnection extends EventEmitter {
    /**
     * @param {ShoukakuPlayer} player The player that initialized this manager
     * @param {ShoukakuSocket} node The node where this manager is connected to
     * @param {Guild} guild A Discord.JS guild structure
     */
    constructor(player, node, guild) {
        super();
        /**
         * The player that initialized this manager
         * @type {ShoukakuPlayer}
         */
        this.player = player;
        /**
         * The node where this manager is connected to
         * @type {ShoukakuSocket}
         */
        this.node = node;
        /**
         * The ID of the guild where this connection is
         * @type {string}
         */
        this.guildID = guild.id;
        /**
         * The ID of the channel where this connection is
         * @type {?string}
         */
        this.channelID = null;
        /**
         * The ID of the shard where this connection is
         * @type {number}
         */
        this.shardID = guild.shardID;
        /**
         * The ID of the current connection session
         * @type {?string}
         */
        this.sessionID = null;
        /**
         * The region where this connection is
         * @type {?string}
         */
        this.region = null;
        /**
         * If the client user is self muted
         * @type {boolean}
         */
        this.muted = false;
        /**
         * If the client user is self deafened
         * @type {boolean}
         */
        this.deafened = false;
        /**
         * The state of this connection
         * @type {Constants.state}
         */
        this.state = state.DISCONNECTED;
        /**
         * If this connection detected a voice channel or voice server change
         * @type {boolean}
         */
        this.moved = false;
        /**
         * If this connection is trying to force reconnect
         * @type {boolean}
         */
        this.reconnecting = false;

        Object.defineProperty(this, 'serverUpdate', { value: null, writable: true });
        Object.defineProperty(this, 'connectTimeout', { value: null, writable: true });
    }

    /**
     * Attempts to reconnect this connection
     * @memberOf ShoukakuConnection
     * @param {Object} [options] 
     * @param {String} [options.channelID] Will throw an error if not specified, when the state of this link is disconnected, no cached serverUpdate or when forceReconnect is true
     * @param {Boolean} [options.forceReconnect] Forces a reconnection by re-requesting a connection to Discord, also resets your player
     * @returns {Promise<void>}
     */
    async attemptReconnect({ channelID, forceReconnect } = {}) {
        if (!forceReconnect && this.state === state.CONNECTED) {
            this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.serverUpdate });
            return;
        }
        else if (this.state === state.DISCONNECTED || !this.serverUpdate || forceReconnect) {
            try {
                this.reconnecting = true;
                if (!channelID) throw new Error('Please specify the channel you want this node to connect on');
                this.node.send({ op: 'destroy', guildId: this.guildID });
                await wait(4000);
                if (this.state !== state.DISCONNECTED) {
                    this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false }, true);
                    await wait(4000);
                }
                this.serverUpdate = null;
                await this.connect({ guildID: this.guildID, channelID, mute: this.selfMute, deaf: this.selfDeaf });
            } finally {
                this.reconnecting = false;
            }
        }
    }
    /**
     * Deafens the client
     * @memberOf ShoukakuConnection
     * @param {boolean} [deaf=false]
     * @returns {void}
     */
    setDeaf(deaf = false) {
        this.deafened = deaf;
        return this.send({ guild_id: this.guildID, channel_id: this.channelID, self_deaf: this.deafened, self_mute: this.muted }, true);
    }
    /**
     * Mutes the client
     * @memberOf ShoukakuConnection
     * @param {boolean} [mute=false]
     * @returns {void}
     */
    setMute(mute = false) {
        this.muted = mute;
        return this.send({ guild_id: this.guildID, channel_id: this.channelID, self_deaf: this.deafened, self_mute: this.muted }, true);
    }
    /**
     * Deafens the client
     * @memberOf ShoukakuConnection
     * @param {string} [channel=null] channel id of the channel to move to, null if you want to disconnect the client
     * @param {string} [reason] The reason for this action
     * @returns {Promise<void>}
     */
    moveChannel(channel = null, reason) {
        return this
            .node
            .shoukaku
            .client
            .api
            .guilds(this.guildID)
            .members(this.node.shoukaku.id)
            .patch({ data: { channel }, reason });
    }
    /**
     * Disconnects this connection
     * @memberOf ShoukakuConnection
     * @returns {void}
     */
    disconnect() {
        if (this.state !== state.DISCONNECTED) {
            this.state = state.DISCONNECTING;
            this.send({ guild_id: this.guildID, channel_id: null, self_mute: false, self_deaf: false }, true);
        }
        this.node.players.delete(this.guildID);
        this.node.send({ op: 'destroy', guildId: this.guildID });
        this.player.removeAllListeners();
        this.player.reset();
        this.state = state.DISCONNECTED;
        this.node.emit('debug', this.node.name, '[Voice] -> [Node] [Discord] : Link & Player Destroyed');
    }
    /**
     * Connects this connection
     * @memberOf ShoukakuConnection
     * @param {Object} options options to connect
     * @returns {Promise<void>}
     * @protected
     */
    async connect(options) {
        if (!options) 
            throw new Error('No options supplied');
        if (this.state === state.CONNECTING)
            throw Error('Can\'t connect while a connection is connecting. Wait for it to resolve first');
        this.state = state.CONNECTING;
        const { guildID, channelID, deaf, mute } = options;
        this.send({ guild_id: guildID, channel_id: channelID, self_deaf: deaf, self_mute: mute }, true);
        this.node.emit('debug', this.node.name, '[Voice] -> [Discord] : Requesting Connection');
        const signal = new AbortController();
        const timeout = setTimeout(() => signal.abort(), 15000);
        try {
            await once(this, 'serverUpdate', { signal });
        } catch (error) {
            this.node.emit('debug', this.node.name, '[Voice] </- [Discord] : Request Connection Failed');
            if (error.name === 'AbortError') 
                throw new Error('The voice connection is not established in 15 seconds');
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
    /**
     * @memberOf ShoukakuConnection
     * @param {Object}
     * @protected
     */
    setStateUpdate({ session_id, channel_id, self_deaf, self_mute }) {
        this.moved = this.channelID && this.channelID !== channel_id;
        this.deafened = self_deaf;
        this.muted = self_mute;
        this.sessionID = session_id;
        this.channelID = channel_id || this.channelID;
        if (!channel_id) this.state = state.DISCONNECTED;
        this.node.emit('debug', this.node.name, '[Voice] <- [Discord] : State Update');
        this.emit('stateUpdate');
    }
    /**
     * @memberOf ShoukakuConnection
     * @param {Object}
     * @protected
     */
    setServerUpdate(data) {
        if (!data.endpoint) return;
        clearTimeout(this.connectTimeout);
        this.moved = this.serverUpdate && !data.endpoint.startsWith(this.region);
        this.region = data.endpoint.split('.').shift().replace(/[0-9]/g, '');
        this.serverUpdate = data;
        this.node.send({ op: 'voiceUpdate', guildId: this.guildID, sessionId: this.sessionID, event: this.serverUpdate });
        this.node.emit('debug', this.node.name, '[Voice] <- [Discord] : Server Update');
        this.emit('serverUpdate');
    }
    /**
     * @memberOf ShoukakuConnection
     * @param {Object} d
     * @param {boolean} [important=false]
     * @protected
     */
    send(d, important = false) {
        if (!this.node.shoukaku.client.guilds.cache.has(this.guildID)) return;
        this.node.shoukaku.client.ws.shards.get(this.shardID)?.send({ op: 4, d }, important);
    }
}

module.exports = ShoukakuConnection;
