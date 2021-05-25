const { name, version, repository } = require('../package.json');

/**
 * Statics for some constants
 * @class Constants
 */
module.exports = {
    /**
    * State of nodes or links
    * @enum {number}
    * @memberof Constants
    */
    state: {
        CONNECTING: 0,
        CONNECTED: 1,
        DISCONNECTING: 2,
        DISCONNECTED: 3
    },
    /**
    * Options that Shoukaku accepts upon initialization
    * @property {boolean} [resumable=false] If you want your node to support resuming
    * @property {number} [resumableTimeout=30] Timeout when Lavalink will decide a player isn't resumed and will destroy the connection to it, measured in seconds
    * @property {number} [reconnectTries=2] Amount of tries to connect to the lavalink Node before it decides that the node is unreconnectable
    * @property {boolean} [moveOnDisconnect=false] Specifies if the library will attempt to reconnect players on a disconnected node to another node
    * @property {number} [restTimeout=15000] Timeout on rest requests to your lavalink node, measured in milliseconds
    * @property {number} [reconnectInterval=5000] Timeout between reconnect attempts, measured in milliseconds
    * @property {number} [closedEventDelay=600] Delay before a player of shoukaku emits a "closed" event
    * @property {string} [userAgent="name/ver(url)"] User-Agent to use on connecting to WS and REST request
    * @memberof Constants
    */
    shoukakuOptions: {
        resumable: false,
        resumableTimeout: 30,
        reconnectTries: 2,
        moveOnDisconnect: false,
        restTimeout: 15000,
        reconnectInterval: 5000,
        closedEventDelay: 600,
        userAgent: `${name}/${version}(${repository.url})`
    },
    /**
    * Options that Shoukaku needs to initialize a lavalink node
    * @property {string} name Your Node Name, anything you want to name your node
    * @property {string} url Your node host:port combined, do not put any prefix in this property, ex: 'localhost:2048'
    * @property {string} auth The authentication key you set on your lavalink config
    * @property {?boolean} [secure=false] If you want to use https and wss instead of http and ws
    * @property {?string} [group=undefined] Group of this node, used for grouping specific nodes
    * @memberof Constants
    */
    nodeOptions: {
        name: null,
        url: null,
        auth: null,
        secure: false,
        group: undefined
    }
};