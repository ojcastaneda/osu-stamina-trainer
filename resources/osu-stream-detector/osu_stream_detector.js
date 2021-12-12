let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;
let wasm;
const { TextDecoder, TextEncoder } = require(`util`);

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}
/**
* @param {string} file
* @param {number | undefined} minimum_bpm
* @param {number | undefined} maximum_bpm
* @returns {Beatmap | undefined}
*/
module.exports.process_beatmap = function(file, minimum_bpm, maximum_bpm) {
    var ptr0 = passStringToWasm0(file, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.process_beatmap(ptr0, len0, !isLikeNone(minimum_bpm), isLikeNone(minimum_bpm) ? 0 : minimum_bpm, !isLikeNone(maximum_bpm), isLikeNone(maximum_bpm) ? 0 : maximum_bpm);
    return ret === 0 ? undefined : Beatmap.__wrap(ret);
};

/**
*/
class Beatmap {

    static __wrap(ptr) {
        const obj = Object.create(Beatmap.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_beatmap_free(ptr);
    }
    /**
    */
    get suggested_bpm() {
        var ret = wasm.__wbg_get_beatmap_suggested_bpm(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set suggested_bpm(arg0) {
        wasm.__wbg_set_beatmap_suggested_bpm(this.ptr, arg0);
    }
    /**
    */
    get average_stream_length() {
        var ret = wasm.__wbg_get_beatmap_average_stream_length(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set average_stream_length(arg0) {
        wasm.__wbg_set_beatmap_average_stream_length(this.ptr, arg0);
    }
    /**
    */
    get stream_density() {
        var ret = wasm.__wbg_get_beatmap_stream_density(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set stream_density(arg0) {
        wasm.__wbg_set_beatmap_stream_density(this.ptr, arg0);
    }
    /**
    */
    get difficulty_double_time() {
        var ret = wasm.__wbg_get_beatmap_difficulty_double_time(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set difficulty_double_time(arg0) {
        wasm.__wbg_set_beatmap_difficulty_double_time(this.ptr, arg0);
    }
    /**
    */
    get od_double_time() {
        var ret = wasm.__wbg_get_beatmap_od_double_time(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set od_double_time(arg0) {
        wasm.__wbg_set_beatmap_od_double_time(this.ptr, arg0);
    }
    /**
    */
    get ar_double_time() {
        var ret = wasm.__wbg_get_beatmap_ar_double_time(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set ar_double_time(arg0) {
        wasm.__wbg_set_beatmap_ar_double_time(this.ptr, arg0);
    }
}
module.exports.Beatmap = Beatmap;

module.exports.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

const path = require('path').join(__dirname, 'osu_stream_detector_bg.wasm');
const bytes = require('fs').readFileSync(path);

const wasmModule = new WebAssembly.Module(bytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
wasm = wasmInstance.exports;
module.exports.__wasm = wasm;

