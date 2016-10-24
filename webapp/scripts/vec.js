'use strict';

module.exports = {

    new: function(x, y, z) {
        const vec = new Float32Array(3);
        vec[0] = x !== undefined ? x : 0;
        vec[1] = y !== undefined ? y : 0;
        vec[2] = z !== undefined ? z : 0;
        return vec;
    },

    normalize: function(vec) {
        const x = vec[0];
        const y = vec[1];
        const z = vec[2];
        const len = (x * x) + (y * y) + (z * z);
        vec[0] = x / len;
        vec[1] = y / len;
        vec[2] = z / len;
        return vec;
    }

};
