'use strict';

const worker = this;

const TAU = Math.PI * 2.0;

function getColorInSpectrum(color, nval, gradient) {
    const segment = 1 / (gradient.length - 1);
    const from = Math.floor(nval / segment);
    const t = nval - (segment * from);
    const start = gradient[from];
    const end = gradient[from + 1];
    // interpolate colors
    color[0] = start[0] * (1 - t) + end[0] * t;
    color[1] = start[1] * (1 - t) + end[1] * t;
    color[2] = start[2] * (1 - t) + end[2] * t;
}

function randomLog() {
    return 1 - Math.pow(Math.random(), 40);
}

function generateStars(buffer, bufferOffset, count, minRadius, maxRadius, colorSpectrum, progStart, progEnd, progIncrements) {
    const STAR_MIN = 1;
    const STAR_MAX = 999;
    const STAR_RANGE = (STAR_MAX - STAR_MIN);
    const progressMod = Math.round(count / progIncrements);
    let color = [0, 0, 0];
    for (let i=0; i<count; i++) {
        const offset = bufferOffset + (i * 8);
        // generate a random number with a logarithmic distribution
        const rand = randomLog();
        // calculate star distance from center
        const distance = STAR_MIN + rand * STAR_RANGE;
        // generate radius which is inversely proportional to distance
        const radius = minRadius + (maxRadius - minRadius) * (1 - rand);
        // generate position
        const x = (Math.random() * 2) - 1;
        const y = (Math.random() * 2) - 1;
        const z = (Math.random() * 2) - 1;
        // calculate length and the inverse of length times distance
        const inverseLength = 1 / Math.sqrt(x*x + y*y + z*z);
        const inverseDistance = inverseLength * distance;
        // scale position
        buffer[offset] = x * inverseDistance; // x
        buffer[offset+1] = y * inverseDistance; // y
        buffer[offset+2] = z * inverseDistance; // z
        buffer[offset+3] = Math.round(radius); // radius
        // get a random color from the spectrum
        getColorInSpectrum(color, Math.random(), colorSpectrum);
        // copy color values
        buffer[offset+4] = color[0]; // r
        buffer[offset+5] = color[1]; // g
        buffer[offset+6] = color[2]; // b
        // generate a random rotation
        buffer[offset+7] = Math.random() * TAU; // rotation
        // post progress to window
        if ((i + 1) % progressMod === 0) {
            const prog = (i + 1) / count;
            worker.postMessage({
                type: 'progress',
                progress: progStart + (prog * (progEnd - progStart))
            });
        }
    }
}

function processBatches(batches) {
    const PROGRESS_INCREMENTS = 20;
    // determine total count
    let totalCount = 0;
    batches.forEach(batch => {
        totalCount += batch.count;
    });
    // allocate the buffer
    const buffer = new Float32Array(totalCount * 4 * 2);
    // post start of progress to window
    worker.postMessage({
        type: 'progress',
        progress: 0
    });
    // for each batch, generate the needed data
    let currentCount = 0;
    batches.forEach(batch => {
        generateStars(
            buffer,
            currentCount * 4 * 2,
            batch.count,
            batch.minRadius,
            batch.maxRadius,
            batch.colorSpectrum,
            currentCount / totalCount,
            (currentCount + batch.count) / totalCount,
            (batch.count / totalCount) * PROGRESS_INCREMENTS);
        // increment total count
        currentCount += batch.count;
    });
    // post result to window
    const result = {
        type: 'complete',
        buffer: buffer.buffer
    };
    worker.postMessage(result, [ result.buffer ]);
}

worker.addEventListener('message', event => {
    if (event.data.type === 'start') {
        processBatches(event.data.batches);
    }
});
