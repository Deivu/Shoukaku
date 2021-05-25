const EventEmitter = require('events');
const { state } = require('../Constants.js');
const { mergeDefault } = require('../Utils.js');

const ShoukakuConnection = require('./ShoukakuConnection.js');
const ShoukakuTrack = require('../struct/ShoukakuTrack.js');
const ShoukakuFilter = require('../struct/ShoukakuFilter.js');

/**
 * ShoukakuPlayer, used to control the player on a guild
 * @class ShoukakuPlayer
 */
class ShoukakuPlayer extends EventEmitter {
    /**
     * @extends {EventEmitter}
     * @param {ShoukakuSocket} node The node where this class is initialized
     * @param {Guild} guild A Discord.JS guild structure
     */
    constructor(node, guild) {
        super();
        /**
         * The voice connection manager of this player
         * @type {ShoukakuConnection}
         */
        this.connection = new ShoukakuConnection(this, node, guild);
        /**
         * The track that is currently being played by this player
         * @type {?string}
         */
        this.track = null;
        /**
         * If this player is currently paused
         * @type {boolean}
         */
        this.paused = false;
        /**
         * The current postion in of this player, in milliseconds
         * @type {number}
         */
        this.position = 0;
        /**
         * The current filter settings for this player
         * @type {ShoukakuFilter}
         */
        this.filters = new ShoukakuFilter();
    }

    /**
     * Emitted when the lavalink player emits a 'TrackEndEvent' or 'TrackStuckEvent'
     * @event ShoukakuPlayer#end
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a WebsocketClosedEvent
     * @event ShoukakuPlayer#closed
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     * @example
     * Player.on('closed', reason => console.log(reason) && Player.disconnect());
     */
    /**
     * Emitted when this library encounters an internal error
     * @event ShoukakuPlayer#error
     * @param {Error} error The error encountered.
     * @memberOf ShoukakuPlayer
     * @example
     * Player.on('error', error => console.error(error) && Player.disconnect());
     */
    /**
     * Emitted when the lavalink player emits a TrackStartEvent
     * @event ShoukakuPlayer#start
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a TrackExceptionEvent, automatically fires TrackEndEvent so handling this is optional
     * @event ShoukakuPlayer#exception
     * @param {Object} reason
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when this library managed to resumed this player
     * @event ShoukakuPlayer#resumed
     * @memberOf ShoukakuPlayer
     */
    /**
     * Emitted when the lavalink player emits a PlayerUpdate event
     * @event ShoukakuPlayer#update
     * @param {Object} data
     * @memberOf ShoukakuPlayer
     */

    /**
     * Moves this player and connection to another node
     * @param {string} name Name of the Node you want to move to
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    moveNode(name) {
        const node = this.connection.node.shoukaku.nodes.get(name);
        if (!node || node.name === this.connection.node.name) return this;
        if (node.state !== state.CONNECTED) throw new Error('The node you specified is not ready');
        this.connection.node.send({ 
            op: 'destroy', 
            guildId: this.connection.guildID 
        });
        this.connection.node.players.delete(this.guildID);
        this.connection.node = node;
        this.connection.node.players.set(this.guildID, this.player);
        this.connection.node.send({ 
            op: 'voiceUpdate', 
            guildId: this.connection.guildID, 
            sessionId: this.connection.sessionID, 
            event: this.connection.serverUpdate 
        });
        this.resume();
        return this;
    }
    /**
     * Plays a track
     * @param {string|ShoukakuTrack} track The Base64 track from the Lavalink Rest API or a ShoukakuTrack
     * @param {Object} [options={}] Used if you want to put a custom track start or end time
     * @param {boolean} [options.noReplace=true] Specifies if the player will not replace the current track when executing this action
     * @param {boolean} [options.pause=false] If `true`, the player will pause when the track starts playing
     * @param {?number} [options.startTime=undefined] In milliseconds on when to start
     * @param {?number} [options.endTime=undefined] In milliseconds on when to end
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */ 
    playTrack(input, options = {}) {
        if (!input) throw new Error('No track given to play');
        if (input instanceof ShoukakuTrack) input = input.track;
        options = mergeDefault({ noReplace: true, pause: false }, options);
        const payload = {
            op: 'play',
            guildId: this.connection.guildID,
            track: input,
            noReplace: options.noReplace,
            pause: options.pause
        };
        if (options.startTime) payload.startTime = options.startTime;
        if (options.endTime) payload.endTime = options.endTime;
        this.connection.node.send(payload);
        this.track = input;
        this.paused = options.pause;
        this.position = 0;
        return this;
    }
    /**
     * Stops the player from playing
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    stopTrack() {
        this.position = 0;
        this.connection.node.send({
            op: 'stop',
            guildId: this.connection.guildID
        });
        return this;
    }
    /**
     * Pauses or unpauses the player from playing
     * @param {boolean} [pause=true] true to pause, false to unpause
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setPaused(pause = true) {
        this.connection.node.send({
            op: 'pause',
            guildId: this.connection.guildID,
            pause
        });
        this.paused = pause;
        return this;
    }
    /**
     * Seeks your player to the time you want
     * @param {number} position Time in milliseconds where you want to seek to
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    seekTo(position) {
        if (!Number.isInteger(position)) throw new Error('Please input a valid number for position');
        this.connection.node.send({
            op: 'seek',
            guildId: this.connection.guildID,
            position
        });
        return this;
    }
    /**
     * Sets the playback volume of your lavalink player
     * @param {number} volume The new volume you want to set on the player
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setVolume(volume) {
        if (Number.isNaN(volume)) throw new Error('Please input a valid number for volume');
        volume = Math.min(5, Math.max(0, volume));
        this.filters.volume = volume;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the equalizer of your lavalink player
     * @param {Object[]} bands
     * @param {number} bands.band Band of the equalizer, can be 0 - 13
     * @param {number} bands.gain Gain for this band of the equalizer
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setEqualizer(bands) {
        if (!bands || !Array.isArray(bands)) throw new Error('No bands, or the band you gave isn\'t an array');
        this.filters.equalizer = bands;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the karaoke effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.level] Karaoke effect level
     * @param {number} [values.monoLevel] Karaoke effect monoLevel
     * @param {number} [values.filterBand] Karaoke effect filterband
     * @param {number} [values.filterWidth] Karaoke effect filterwidth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setKaraoke(values) {
        this.filters.karaoke = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the timescale effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.speed] Timescale effect speed
     * @param {number} [values.pitch] Timescale effect pitch
     * @param {number} [values.rate] Timescale effect rate
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTimescale(values) {
        this.filters.timescale = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the tremolo effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.frequency] Tremolo effect frequency
     * @param {number} [values.depth] Tremolo effect depth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setTremolo(values) {
        this.filters.tremolo = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the vibrato effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.frequency] Vibrato effect frequency
     * @param {number} [values.depth] Vibrato effect depth
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setVibrato(values) {
        this.filters.vibrato = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the rotation effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.rotationHz] Rotation effect rotation
     * @param ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setRotation(values) {
        this.filters.rotation = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Sets the distortion effect of your lavalink player
     * @param {Object|null} values
     * @param {number} [values.sinOffset] Sin offset of the distortion effect
     * @param {number} [values.sinScale] Sin scale of the distortion effect
     * @param {number} [values.cosOffset] Cos offset of the distortion effect
     * @param {number} [values.cosScale] Cos scale of the distortion effect
     * @param {number} [values.tanOffset] Tan offset of the distortion effect
     * @param {number} [values.tanScale] Tan scale of the distortion effect
     * @param {number} [values.offset] Offset of the distortion effect
     * @param {number} [values.scale] Scale of the distortion effect
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setDistortion(values) {
        this.filters.distortion = values || null;
        this.updateFilters();
        return this;
    }
    /**
     * Ability to set filters by group instead of 1 by 1
     * @param {ShoukakuFilter} [settings] object containing filter settings
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    setFilters(settings) {
        this.filters = new ShoukakuFilter(settings);
        this.updateFilters();
        return this;
    }
    /** 
     * Clears all the filter applied on this player
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     */
    clearFilters() {
        this.filters = new ShoukakuFilter();
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildID
        });
        return this;
    }
    /**
     * Tries to resume your player, a use case for this is when you do ShoukakuPlayer.connection.attemptReconnect()
     * @memberOf ShoukakuPlayer
     * @returns {ShoukakuPlayer}
     * @example
     * ShoukakuPlayer
     *   .connection
     *   .attemptReconnect()
     *   .then(() => ShoukakuPlayer.resume());
     */
    resume() {
        this.updateFilters();
        if (this.track) this.playTrack(this.track, { startTime: this.position, pause: this.paused });
        this.emit('resumed');
        return this;
    }
    /**
     * @memberOf ShoukakuPlayer
     * @private
     */
    updateFilters() {
        const { volume, equalizer, karaoke, timescale, tremolo, vibrato, rotation, distortion } = this.filters;
        this.connection.node.send({
            op: 'filters',
            guildId: this.connection.guildID,
            volume,
            equalizer,
            karaoke,
            timescale,
            tremolo,
            vibrato,
            rotation,
            distortion
        });
    }
    /**
     * @memberOf ShoukakuPlayer
     * @protected
     */
    reset() {
        this.track = null;
        this.position = 0;
        this.filters = new ShoukakuFilter();
    }
    /**
     * @memberOf ShoukakuPlayer
     * @param {Object} json
     * @protected
     */
    _onLavalinkMessage(json) {
        if (json.op === 'playerUpdate') {
            this.position = json.state.position;
            this.emit('update', json.state);
        }
        else if (json.op === 'event') {
            this._onPlayerEvent(json);
        } 
        else {
            this.connection.node.emit('debug', this.connection.node.name, `[Node] -> [${this.connection.node.name}] : Unknown Message OP ${json.op}`);
        }
    }
    /**
     * @memberOf ShoukakuPlayer
     * @param {Object} json
     * @private
     */
    _onPlayerEvent(json) {
        this.position = 0;
        switch (json.type) {
            case 'TrackStartEvent':
                this.emit('start', json);
                break;
            case 'TrackEndEvent':
            case 'TrackStuckEvent':
                this.emit('end', json);
                break;
            case 'TrackExceptionEvent':
                this.emit('exception', json);
                break;
            case 'WebSocketClosedEvent': {
                this._onWebsocketClosedEvent(json);
                break;
            }
            default:
                this.connection.node.emit(
                    'debug', 
                    this.connection.node.name, 
                    `[Node] -> [${this.connection.node.name}] : Unknown Player Event Type ${json.type}`
                );
        }
        return;
    }
    /**
     * @memberOf ShoukakuPlayer
     * @param {Object} json
     * @private
     */
    _onWebsocketClosedEvent(json) {
        if (this.connection.reconnecting) return;
        const delay = this.connection.node.shoukaku.options.closedEventDelay;
        setTimeout(() => {
            if (!this.connection.moved) {
                this.emit('closed', json);
                return;
            }
            this.connection.node.emit(
                'debug', 
                this.connection.node.name, 
                `[Node] -> [${this.connection.node.name}] : Voice channel or server move detected`
            );
            this.connection.moved = false;  
        }, delay);
    }
}
module.exports = ShoukakuPlayer;
