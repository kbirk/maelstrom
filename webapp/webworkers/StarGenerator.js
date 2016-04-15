var worker = this;

(function() {
    'use strict';

    function getColorInSpectrum(number, gradient) {
        var min = 0;
        var max = 1;
        var range = max - min;
        var segment = range / (gradient.length - 1);
        var before = Math.max( 0, Math.floor((( number - min ) / range ) / segment ));
        var after = Math.min( gradient.length-1, before + 1 );
        var sub = number - ( segment * (after-1) );
        var start = gradient[before];
        var end = gradient[after];
        return [
            start[0]*(1-sub) + end[0]*sub,
            start[1]*(1-sub) + end[1]*sub,
            start[2]*(1-sub) + end[2]*sub,
        ];
    }

    function randomLog() {
        return 1 - Math.pow( Math.random(), 40 );
    }

    function generateStars( buffer, bufferOffset, count, minRadius, maxRadius, colorSpectrum, progStart, progEnd, progIncrements ) {
        var STAR_MIN = 1;
        var STAR_MAX = 999;
        var STAR_RANGE = ( STAR_MAX - STAR_MIN );
        var progressMod = Math.round( count / progIncrements );
        var i;
        for ( i=0; i<count; i++ ) {
            var a = Math.random() > 0.5 ? 1 : -1,
                b = Math.random() > 0.5 ? 1 : -1,
                c = Math.random() > 0.5 ? 1 : -1,
                rand = randomLog(),
                distance = STAR_MIN + rand * STAR_RANGE,
                radius = minRadius + ( maxRadius - minRadius ) * ( 1 - rand );
            var x = a * Math.random();
            var y = b * Math.random();
            var z = c * Math.random();
            var length = Math.sqrt( x*x + y*y + z*z );
            buffer[bufferOffset+i*8] = ( x / length ) * distance; // x
            buffer[bufferOffset+i*8+1] = ( y / length ) * distance; // y
            buffer[bufferOffset+i*8+2] = ( z / length ) * distance; // z
            buffer[bufferOffset+i*8+3] = Math.random() * Math.PI * 2; // rotation
            var color = getColorInSpectrum( Math.random(), colorSpectrum );
            buffer[bufferOffset+i*8+4] = color[0]; // r
            buffer[bufferOffset+i*8+5] = color[1]; // g
            buffer[bufferOffset+i*8+6] = color[2]; // b
            buffer[bufferOffset+i*8+7] = Math.round( radius ); // radius
            // post progress to window
            if ( (i+1) % progressMod === 0 ) {
                var prog = (i+1) / count;
                worker.postMessage({
                    type: 'progress',
                    progress: progStart + ( prog * ( progEnd - progStart ) )
                });
            }
        }
    }

    function processBatches( batches ) {
        var PROGRESS_INCREMENTS = 20;
        // determine total count
        var totalCount = 0;
        batches.forEach( function( batch ) {
            totalCount += batch.count;
        });
        // allocate the buffer
        var buffer = new Float32Array( totalCount * 4 * 2 );
        // post start of progress to window
        worker.postMessage({
            type: 'progress',
            progress: 0
        });
        // for each batch, generate the needed data
        var currentCount = 0;
        batches.forEach( function( batch ) {
            generateStars(
                buffer,
                currentCount * 4 * 2,
                batch.count,
                batch.minRadius,
                batch.maxRadius,
                batch.colorSpectrum,
                currentCount / totalCount,
                ( currentCount + batch.count ) / totalCount,
                ( batch.count / totalCount ) * PROGRESS_INCREMENTS );
            // increment total count
            currentCount += batch.count;
        });
        // post result to window
        var result = {
            type: 'complete',
            buffer: buffer.buffer
        };
        worker.postMessage( result, [ result.buffer ] );
    }

    worker.addEventListener( 'message', function( e ) {
        if ( e.data.type === 'start' ) {
            processBatches( e.data.batches );
        }
    });

}());
