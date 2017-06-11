'use strict';

module.exports = {

    new: function(x = 0, y = 0, z = 0) {
        const vec = new Float32Array(3);
        vec[0] = x;
        vec[1] = y;
        vec[2] = z;
        return vec;
    },

    normalize: function(vec) {
        const x = vec[0];
        const y = vec[1];
        const z = vec[2];
        const inverseLen = 1 / ((x * x) + (y * y) + (z * z));
        vec[0] = x * inverseLen;
        vec[1] = y * inverseLen;
        vec[2] = z * inverseLen;
        return vec;
    }

};
