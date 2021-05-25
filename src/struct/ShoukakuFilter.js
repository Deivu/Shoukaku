/**
 * Filters available for customization. See https://github.com/freyacodes/Lavalink/blob/dev/IMPLEMENTATION.md#using-filters
 * @class ShoukakuFilter
 */
class ShoukakuFilter {
    /** 
     * @param {Object} [settings={}] Settings to initialize this filter with
     * @param {Number} [settings.volume=1.0] Volume of this filter 
     * @param {Object[]} [settings.equalizer=[]] Equalizer of this filter
     * @param {number} settings.equalizer.band Band of the equalizer, can be 0 - 13
     * @param {number} settings.equalizer.gain Gain for this band of the equalizer
     * @param {Object} [settings.karaoke=null] Karaoke configuration of this filter
     * @param {number} [settings.karaoke.level] Level of the karaoke effect
     * @param {number} [settings.karaoke.monoLevel] Monolevel of the karaoke effect
     * @param {number} [settings.karaoke.filterBand] Filterband of the karaoke effect
     * @param {number} [settings.karaoke.filterWidth] Filterwidth of the karaoke effect
     * @param {Object} [settings.timescale=null] Timescale configuration of this filter
     * @param {number} [settings.timescale.speed] Speed of the timescale effect
     * @param {number} [settings.timescale.pitch] Pitch of the timescale effect
     * @param {number} [settings.timescale.rate] Rate of the timescale effect
     * @param {Object} [settings.tremolo=null] Tremolo configuration of this filter
     * @param {number} [settings.tremolo.frequency] Frequency of the tremolo effect
     * @param {number} [settings.tremolo.depth] Depth of the tremolo effect
     * @param {Object} [settings.vibrato=null] Vibrato configuration of this filter
     * @param {number} [settings.vibrato.frequency] Frequency of the vibrato effect
     * @param {number} [settings.vibrato.depth] Depth of the vibrato effect
     * @param {Object} [settings.rotation=null] Rotation configuration of this filter
     * @param {number} [settings.rotation.rotationHz] Frequency of the rotation effect
     * @param {Object} [settings.distortion=null] Distortion configuration of this filter
     * @param {number} [settings.distortion.sinOffset] Sin offset of the distortion effect
     * @param {number} [settings.distortion.sinScale] Sin scale of the distortion effect
     * @param {number} [settings.distortion.cosOffset] Cos offset of the distortion effect
     * @param {number} [settings.distortion.cosScale] Cos scale of the distortion effect
     * @param {number} [settings.distortion.tanOffset] Tan offset of the distortion effect
     * @param {number} [settings.distortion.tanScale] Tan scale of the distortion effect
     * @param {number} [settings.distortion.offset] Offset of the distortion effect
     * @param {number} [settings.distortion.scale] Scale of the distortion effect
     */
    constructor(settings = {}) {
        /**
         * The volume of this filter
         * @type {Number}
         */
        this.volume = settings.volume || 1.0;
        /**
         * The equalizer bands set for this filter
         * @type {Object[]}
         * @property {number} band Band of the equalizer, can be 0 - 13
         * @property {number} gain Gain for this band of the equalizer
         */
        this.equalizer = settings.equalizer || [];
        /**
         * The karaoke settings set for this filter
         * @type {Object|null}
         * @property {number} [level] Karaoke effect level
         * @property {number} [monoLevel] Karaoke effect monoLevel
         * @property {number} [filterBand] Karaoke effect filterband
         * @property {number} [filterWidth] Karaoke effect filterwidth
         */
        this.karaoke = settings.karaoke || null;
        /**
         * The timescale settings set for this filter
         * @type {Object|null}
         * @property {number} [speed] Timescale effect speed
         * @property {number} [pitch] Timescale effect pitch
         * @property {number} [rate] Timescale effect rate
         */
        this.timescale = settings.timescale || null;
        /**
         * The tremolo settings set for this filter
         * @type {Object|null}
         * @property {number} [frequency] Tremolo effect frequency
         * @property {number} [depth] Tremolo effect depth
         */
        this.tremolo = settings.tremolo || null;
        /**
         * The vibrato settings set for this filter
         * @type {Object|null}
         * @property {number} [frequency] Vibrato effect frequency
         * @property {number} [depth] Vibrato effect depth
         */
        this.vibrato = settings.vibrato || null;
        /**
         * The rotation settings set for this filter
         * @type {Object|null}
         * @property {number} [rotationHz] Rotation effect rotation
         */
        this.rotation = settings.rotation || null;
        /**
         * The distortion settings set for this filter
         * @type {Object|null}
         * @property {number} [sinOffset] Sin offset of the distortion effect
         * @property {number} [sinScale] Sin scale of the distortion effect
         * @property {number} [cosOffset] Cos offset of the distortion effect
         * @property {number} [cosScale] Cos scale of the distortion effect
         * @property {number} [tanOffset] Tan offset of the distortion effect
         * @property {number} [tanScale] Tan scale of the distortion effect
         * @property {number} [offset] Offset of the distortion effect
         * @property {number} [scale] Scale of the distortion effect
         */
        this.distortion = settings.distortion || null;
    }
}

module.exports = ShoukakuFilter;