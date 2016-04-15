(function() {

    'use strict';

    module.exports = {

        new: function( x, y, z ) {
            var vec = new Float32Array( new ArrayBuffer( 3 * 4 ) );
            vec[0] = x !== undefined ? x : 0;
            vec[1] = y !== undefined ? y : 0;
            vec[2] = z !== undefined ? z : 0;
            return vec;
        },

        normalize: function( vec ) {
            var x = vec[0];
            var y = vec[1];
            var z = vec[2];
            var len = ( x * x ) + ( y * y ) + ( z * z );
            vec[0] = x / len;
            vec[1] = y / len;
            vec[2] = z / len;
            return vec;
        }

    };

}());
