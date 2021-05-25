const EventEmitter = require('events');
const Websocket = require('ws');
const ShoukakuQueue = require('./ShoukakuQueue.js');
const ShoukakuRest = require('./ShoukakuRest.js');
const ShoukakuPlayer = require('../guild/ShoukakuPlayer.js');
const ShoukakuStats = require('../struct/ShoukakuStats.js');

const { state } = require('../Constants.js');

/**
 * ShoukakuSocket, manages a single lavalink node connection
 * @class ShoukakuSocket
 * @extends {EventEmitter}
 */
class ShoukakuSocket extends EventEmitter {
    /**
     * @param {Shoukaku} shoukaku The manager that initialized this instance
     * @param {Object} options The node options to connect
     * @param {string} options.name Lavalink node name
     * @param {string} options.url Lavalink node url without prefix like, ex: http://
     * @param {string} options.auth Lavalink node password
     * @param {boolean} [options.secure=false] Whether this node should be in secure wss or https mode
     * @param {string} [options.group=undefined] Lavalink node group
     */
    constructor(shoukaku, options) {
        super();
        /**
        * The manager instance of this socket
        * @type {Shoukaku}
        */
        this.shoukaku = shoukaku;
        /**
        * The players being governed by this node
        * @type {Map<string, ShoukakuPlayer>}
        */
        this.players = new Map();
        /**
        * The rest api for this socket
        * @type {ShoukakuRest}
        */
        this.rest = new ShoukakuRest(options, shoukaku.options);
        /**
        * List of queued websocket reqeusts
        * @type {ShoukakuQueue}
        */
        this.queue = new ShoukakuQueue(this);
        /**
        * The state of this socket
        * @type {Constants.state}
        */
        this.state = state.DISCONNECTED;
        /**
        * The stats of this socket
        * @type {ShoukakuStats}
        */
        this.stats = new ShoukakuStats();
        /**
        * Attempted reconnects of this socket. Resets to 0 when the socket opens properly
        * @type {number}
        */
        this.reconnects = 0;
        /**
        * Name of this socket
        * @type {string}
        */
        this.name = options.name;
        /**
        * Group of this socket
        * @type {?string}
        */
        this.group = options.group;
        /**
        * Websocket URL of this socket
        * @type {string}
        */
        this.url = `${options.secure ? 'wss' : 'ws'}://${options.url}`;
        /**
        * If this socket was resumed
        * @type {boolean}
        */
        this.resumed = false;
        /**
        * If this node is destroyed and must not reconnect
        * @type {boolean}
        */
        this.destroyed = false;

        Object.defineProperty(this, 'auth', { value: options.auth });
    }
    /**
     * @type {string}
     * @memberof ShoukakuSocket
     * @private
     */
    get userAgent() {
        return this.shoukaku.options.userAgent;
    }
    /**
     * @type {boolean}
     * @memberof ShoukakuSocket
     * @private
     */
    get resumable() {
        return this.shoukaku.options.resumable;
    }
    /**
     * @type {number}
     * @memberof ShoukakuSocket
     * @private
     */
    get resumableTimeout() {
        return this.shoukaku.options.resumableTimeout;
    }
    /**
     * @type {boolean}
     * @memberof ShoukakuSocket
     * @private
     */
    get moveOnDisconnect() {
        return this.shoukaku.options.moveOnDisconnect;
    }
    /**
     * @type {number}
     * @memberof ShoukakuSocket
     * @private
     */
    get reconnectTries() {
        return this.shoukaku.options.reconnectTries;
    }
    /**
     * @type {number}
     * @memberof ShoukakuSocket
     * @private
     */
    get reconnectInterval() {
        return this.shoukaku.options.reconnectInterval;
    }
    /**
    * Penalties of this socket. The higher the return number, the more loaded the server is
    * @type {number}
    * @memberof ShoukakuSocket
    */
    get penalties() {
        let penalties = 0;
        penalties += this.stats.players;
        penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
        if (this.stats.frameStats) {
            penalties += this.stats.frameStats.deficit;
            penalties += this.stats.frameStats.nulled * 2;
        }
        return penalties;
    }
    
    /**
    * Connects this socket
    * @memberof ShoukakuSocket
    * @param {boolean} [reconnect=false]
    * @returns {void}
    * @protected
    */
    connect(reconnect = false) {
        this.destroyed = false;
        this.state = state.CONNECTING;
        const headers = {
            'Client-Name': this.userAgent,
            'User-Agent': this.userAgent,
            'Authorization': this.auth,
            'User-Id': this.shoukaku.id
        };
        if (reconnect) headers['Resume-Key'] = (!!this.resumable).toString(); 
        this.emit('debug', this.name, `[Socket] -> [${this.name}] : Connecting ${this.url}`);
        this.ws = new Websocket(this.url, { headers });
        this.ws.once('upgrade', response => this.resumed = response.headers['session-resumed'] === 'true');
        this.ws.once('open', () => this._open());
        this.ws.once('close', (...args) => this._close(...args));
        this.ws.on('error', error => this.emit('error', this.name, error));
        this.ws.on('message', (...args) => this._message(...args));
    }
    /**
    * Disconnects this socket
    * @memberof ShoukakuSocket
    * @param {number} [code=1000]
    * @param {string} [reason]
    * @returns {void}
    * @protected
    */
    disconnect(code = 1000, reason) {
        this.destroyed = true;
        this._clean();
        this._disconnect(code, reason);
    }
    /**
     * Creates a player and connects your bot to the specified guild's voice channel
     * @param {Object} options Join channel options
     * @param {string} options.guildID GuildID where the voice channel you want to join is in
     * @param {string} options.channelID ChannelID of the voice channel where you want to join in
     * @param {boolean} [options.mute=false] If you want to join this channel muted already
     * @param {boolean} [options.deaf=false] If you want to join this channel deafened already
     * @memberof ShoukakuSocket
     * @returns {Promise<ShoukakuPlayer>}
     * @example
     * async function BurningLove() {
     *   const node = Shoukaku.getNode();
     *   const list = await node.rest.resolve('Kongou Burning Love', 'youtube');
     *   const player = await node.joinChannel({ guildID: 'guild_id', voiceChannelID: 'voice_channel_id' });
     *   player.playTrack(list.tracks.shift());
     * }
     * BurningLove();
     */
    async joinChannel(options = {}) {
        if (!options.guildID || !options.channelID)
            throw new Error('Supplied options needs to have "guildID" and "channelID" ids');
        if (this.state !== state.CONNECTED)
            throw new Error('This node is not yet ready');

        const guild = this.shoukaku.client.guilds.cache.get(options.guildID);
        if (!guild)
            throw new Error('Guild not found, cannot continue creating this connection');

        const player = this.players.get(guild.id) || new ShoukakuPlayer(this, guild);

        try {
            if (!this.players.has(guild.id)) this.players.set(guild.id, player);
            await player.connection.connect(options);
            return player;
        } catch (error) {
            this.players.delete(guild.id);
            throw error;
        }
    }
    /**
     * Disconnects and cleans a player in this socket
     * @param {string} guildID The guild id of the player you want to remove.
     * @memberOf ShoukakuSocket
     * @returns {void}
     */
    leaveChannel(guildID) {
        return this.players.get(guildID)?.connection.disconnect();
    }
    /**
     * Shortcut to send a message to this websocket
     * @param {Object} data Message to be sent
     * @param {imporant} [data=false] If the message should be on top of queue
     * @memberOf ShoukakuSocket
     * @returns {void}
     */
    send(data, important = false) {
        return this.queue.send(data, important);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @private
     */
    _open() {
        if (this.resumable) {
            this.send({
                op: 'configureResuming',
                key: (!!this.resumable).toString(),
                timeout: this.resumableTimeout
            });
        }
        this.reconnects = 0;
        this.state = state.CONNECTED;
        this.emit('debug', this.name, `[Socket] <-> [${this.name}] : Connection Open ${this.url} | Resumed: ${this.resumed}`);
        this.emit('ready', this.name, this.resumed);
    }
    /**
     * @memberOf ShoukakuSocket
     * @param {string} message
     * @returns {void}
     * @private
     */
    _message(message) {
        const json = JSON.parse(message);
        this.emit('debug', this.name, `[Socket] <- [${this.name}] : Websocket Message, OP: ${json?.op || 'Unknown'}`);
        if (!json) return;
        if (json.op === 'stats') {
            this.stats = new ShoukakuStats(json);
            return;
        }
        this.players.get(json.guildId)?._onLavalinkMessage(json);
    }
    /** 
     * @memberOf ShoukakuSocket
     * @param {number} code
     * @param {string} reason
     * @returns {void}
     * @private
     */
    _close(code, reason) {
        this.emit('debug', this.name, `[Socket] <-/-> [${this.name}] : Connection Closed, Code: ${code || 'Unknown Code'}`);
        this.ws?.removeAllListeners();
        this.ws = null;
        this.state = state.DISCONNECTED;
        this.emit('close', this.name, code, reason);
        if (this.destroyed || this.reconnects > this.reconnectTries) return this._clean();
        this._reconnect();
    }
    /**
     * @memberOf ShoukakuSocket
     * @param {Object} packet
     * @returns {void}
     * @protected
     */
    _clientRaw(packet) {
        const player = this.players.get(packet.d.guild_id);
        if (!player) return;
        if (packet.t === 'VOICE_SERVER_UPDATE') {
            player.connection.setServerUpdate(packet.d);
            return;
        }
        if (packet.d.user_id !== this.shoukaku.id) return;
        player.connection.setStateUpdate(packet.d);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @protected
     */ 
    _clean() {
        const players = [...this.players.values()];
        if (this.moveOnDisconnect && this.shoukaku.nodes.size > 0) {
            for (const player of players) player.moveNode(this.shoukaku._getIdeal(this.group));
            return;
        }
        const error = new Error(
            this.moveOnDisconnect ? `Node '${this.name}' disconnected; moveOnReconnect is disabled` : `Node '${this.name}' disconnected; No nodes to reconnect to`
        );
        for (const player of players) player.connection.disconnect();
        this.emit('disconnect', this.name, players, error);
    }
    /**
     * @memberOf ShoukakuSocket
     * @returns {void}
     * @private
     */ 
    _reconnect() {
        if (this.state !== state.DISCONNECTED) return;
        this.reconnects++;
        this.emit('debug', this.name, `[Socket] -> [${this.name}] : Reconnecting. ${this.reconnectTries - this.reconnects} tries left`);
        setTimeout(() => this.connect(), this.reconnectInterval);
    }
    /**
     * @memberOf ShoukakuSocket
     * @param {number} code 
     * @param {string} reason
     * @returns {void}
     * @private
     */
    _disconnect(code, reason) {
        if (this.queue.pending.length) {
            setImmediate(() => this._disconnect());
            return;
        }
        this.ws?.close(code, reason);
    }
}
module.exports = ShoukakuSocket;
