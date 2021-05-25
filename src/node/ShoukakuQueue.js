/**
 * ShoukakuRouter, a queue for websocket messages
 * @class ShoukakuQueue
 */
class ShoukakuQueue {
    /**
     * @param {ShoukakuSocket} socket The node socket where this queue is attached to
     */
    constructor(socket) {
        /**
        * The socket where this queue is attached to
        * @type {ShoukakuSocket}
        */
        this.socket = socket;
        /**
        * The pending messages to be sent by this queue
        * @type {string[]}
        */
        this.pending = [];
    }
    /**
     * Enqueues a message to be sent on websocket
     * @param {Object} data Data to be sent to the websocket
     * @param {boolean} [important=false] If the the message is on top of this queue
     * @return {void}
     */
    send(data, important = false) {
        this.pending[important ? 'unshift' : 'push'](JSON.stringify(data));
        this.process();
    }
    /**
     * Process the websocket queue
     * @return {void}
     */
    process() {
        if (!this.pending.length || this.socket.ws?.readyState !== 1) return;
        const message = this.pending.shift();
        this.socket.ws.send(message, error => {
            if (error) this.socket.emit('error', this.socket.name, error);
        });
        setImmediate(() => this.process());
    }
    /**
     * Clears the pending messages to be sent
     * @return {void}
     */
    clear() {
        this.pending.length = 0;
    }
}

module.exports = ShoukakuQueue;