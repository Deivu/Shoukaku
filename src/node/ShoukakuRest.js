const Petitio = require('petitio');
const ShoukakuRouter = require('./ShoukakuRouter.js');
const ShoukakuTrackList = require('../struct/ShoukakuTrackList.js');
const { searchType } = require('../Utils.js');

const Success = ['TRACK_LOADED', 'PLAYLIST_LOADED', 'SEARCH_RESULT'];
/**
 * ShoukakuRest, provides access to Lavalink REST API
 * @class ShoukakuRest
 */
class ShoukakuRest {
    /** 
     * @param {Object} node Options that you passed to initialize a lavalink node
     * @param {Object} options Options of the manager who initialized the node
     */
    constructor({ url, auth, secure }, { userAgent, timeout }) {
        /**
        * The url for this rest api
        * @type {string}
        */
        this.url = `${secure ? 'https' : 'http'}://${url}`;
        /**
         * The timeout before a request will be cancelled
         * @type {number}
         */
        this.timeout = timeout || 15000;

        Object.defineProperty(this, 'auth', { value: auth });
        Object.defineProperty(this, 'userAgent', { value: userAgent });
    }
    /**
     * The api router for this rest api
     * @type {number}
     * @memberof ShoukakuRest
     * @private
     */
    get router() {
        return new ShoukakuRouter(this);
    }
    /**
    * Resolves a identifier into a lavalink track
    * @param {string} identifier Anything you want for lavalink to search for
    * @param {string} [search=null] Either `youtube` or `soundcloud` or `youtubemusic`. If specified, resolve will return search results
    * @memberof ShoukakuRest
    * @returns {Promise<void|ShoukakuTrackList>}
    */
    async resolve(identifier, search = null) {
        if (!identifier) throw new Error('Identifier cannot be null');
        if (search) identifier = `${searchType(search)}:${identifier}`;
        const data = await this.router.loadtracks({ identifier }).get();
        if (!Success.includes(data.loadType)) return;
        return new ShoukakuTrackList(data);
    }
    /**
     * Decodes the given base64 encoded track from lavalink
     * @param {string} track Base64 Encoded Track you got from the lavalink api
     * @memberof ShoukakuRest
     * @returns {Promise<Object>}
     */
    decode(track) {
        if (!track) throw new Error('Track cannot be null');
        return this.router.decodetrack({ track }).get();
    }
    /**
     * Gets the status of the "RoutePlanner API" for this lavalink node
     * @memberof ShoukakuRest
     * @returns {Promise<Object>} Refer to `https://github.com/freyacodes/Lavalink/blob/master/IMPLEMENTATION.md#routeplanner-api`
     */
    getRoutePlannerStatus() {
        return this.router.routeplanner.status.get();
    }
    /**
     * Unmarks a failed ip in the "RoutePlanner API" on this lavalink node
     * @param {string} address The IP you want to unmark as failed
     * @memberof ShoukakuRest
     * @returns {Promise<void>}
     */
    unmarkFailedAddress(address) {
        if (!address) throw new Error('Address cannot be null');
        return this.router.routeplanner.free.address.post({ body: { address } });
    }
    /**
     * Unmarks all the failed ip(s) in the "RoutePlanner API" on this lavalink node
     * @memberof ShoukakuRest
     * @returns {Promise<void>}
     */
    unmarkAllFailedAddress() {
        return this.router.routeplanner.free.all.post();
    }
    /**
     * Queries the rest api
     * @param {string} url The request url
     * @param {Object} options The request options
     * @memberof ShoukakuRest
     * @protected
     */
    async fetch(url, { method, options }) {
        const headers = {
            'Authorization': this.auth,
            'User-Agent': this.userAgent
        };
        if (method === 'post') headers['Content-Type'] = 'application/json';
        const request = await Petitio(url)
            .method(method.toUpperCase())
            .header(headers)
            .body(options?.body ?? null)
            .timeout(this.timeout)
            .send();
        if (request.status >= 200 && request.statusCode < 300) throw new Error(`Rest request failed with response code: ${request.statusCode}`);
        const body = request.body.toString('utf8');
        if (!body?.length) return;
        return JSON.parse(body);
    }
}
module.exports = ShoukakuRest; 
