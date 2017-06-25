'use strict';

const $ = require('jquery');
const parallel = require('async/parallel');
const esper = require('esper');
const vec3 = require('./scripts/math/vec3');
const mat4 = require('./scripts/math/mat4');
const isMobile = require('./scripts/isMobile');
const LoadingBar = require('./scripts/LoadingBar');
const animatedTyping = require('./scripts/animatedTyping');
const Transform = require('./scripts/Transform');
const Camera = require('./scripts/Camera');

const DEGREES_TO_RADIANS = (Math.PI / 180.0);
const FIELD_OF_VIEW = 60.0 * DEGREES_TO_RADIANS;
const MIN_Z = 0.1;
const MAX_Z = 1000.0;
const VELOCITY = {
    SLOW: 1,
    MEDIUM: 1.1,
    FAST: 1.2
};
const ROTATION_AXIS = vec3.new(0.0953463, 0.953463, 0.286039);
const IS_MOBILE = isMobile();
const FOREGROUND_STAR_SPECTRUM = [
    [0.247, 0.698, 1],
    [0.247, 0.270, 1],
    [0.435, 0.247, 1],
    [0.647, 0.247, 1]
];
const FOREGROUND_STAR_COUNT = 20000;
const BACKGROUND_STAR_SPECTRUM = [
    [0.486, 0.023, 0.239],
    [0.352, 0.023, 0.286],
    [0.2, 0.137, 0.262]
];
const BACKGROUND_STAR_COUNT = 30000;
const IMAGES_DIR = IS_MOBILE ? 'images/mobile' : 'images/desktop';
const NEBULAS = [
    {
        url: `${IMAGES_DIR}/cold`,
        ext: 'jpg',
        velocity: 'fast'
    },
    {
        url: `${IMAGES_DIR}/hot`,
        ext: 'jpg',
        velocity: 'slow'
    }
];
const STARS = [
    {
        url: `${IMAGES_DIR}/cold_stars`,
        ext: 'png',
        velocity: 'fast'
    }
];
const STAR_TEXTURE = {
    url: 'images/star',
    ext: 'jpg'
};
const SHADERS = {
    cubeMap: {
        vert: 'shaders/cubemap.vert',
        frag: 'shaders/cubemap.frag'
    },
    stars: {
        vert: 'shaders/point.vert',
        frag: 'shaders/point.frag'
    },
    nebula: {
        vert: 'shaders/nebula.vert',
        frag: 'shaders/nebula.frag'
    }
};

const stars = [];
const nebulaMaps = [];
const starMaps = [];
const shaders = {};
const transforms = {};

let startTime = 0;
let prevTime = 0;
let time = 0;
let delta = 0;
let cubeBuffer = null;
let starBuffer = null;
let starTexture = null;

let canvas;
let gl;
let camera;
let view;
let projection;
let viewport;

function initVertexBuffer(count) {
    const bufferSize = count * 4 * 2;
    // create vertex buffer, this will never be updated
    return new esper.VertexBuffer(bufferSize, {
        /**
         * x: x
         * y: y
         * y: z
         * w: radius
         */
        0: {
            size: 4,
            type: 'FLOAT',
            byteOffset: 0
        },
        /**
         * x: red
         * y: green
         * y: blue
         * w: rotation
         */
        1: {
            size: 4,
            type: 'FLOAT',
            byteOffset: 16
        }
    });
}

function createStarEntity(velocity, indexOffset, count) {
    return {
        count: count,
        indexOffset: indexOffset,
        transform: transforms[velocity],
        opacity: 0
    };
}

function generateStars() {
    const loadingBar = new LoadingBar();
    const countFactor = IS_MOBILE ? 0.5 : 1;
    const foregroundStars = {
        count: FOREGROUND_STAR_COUNT * countFactor,
        velocity: 'medium',
        minRadius: 5,
        maxRadius: 100,
        colorSpectrum: FOREGROUND_STAR_SPECTRUM
    };
    const backgroundStars = {
        count: BACKGROUND_STAR_COUNT * countFactor,
        velocity: 'slow',
        minRadius: 3,
        maxRadius: 7,
        colorSpectrum: BACKGROUND_STAR_SPECTRUM
    };
    starBuffer = initVertexBuffer(backgroundStars.count + foregroundStars.count);
    // create web worker to generate particles
    const worker = new Worker('webworkers/StarGenerator.js');
    worker.addEventListener('message', event => {
        switch (event.data.type) {
            case 'progress':
                loadingBar.update(event.data.progress);
                break;
            case 'complete':
                loadingBar.finish();
                starBuffer.bufferData(new Float32Array(event.data.buffer));
                worker.terminate();
                // add foreground stars
                stars.push(createStarEntity(
                    foregroundStars.velocity,
                    0,
                    foregroundStars.count));
                // add background stars
                stars.push(createStarEntity(
                    backgroundStars.velocity,
                    foregroundStars.count,
                    backgroundStars.count));
                break;
        }
    });
    // start the webworker
    worker.postMessage({
        type: 'start',
        batches: [
            foregroundStars,
            backgroundStars
        ]
    });
}

window.addEventListener('resize', function() {
    if (viewport) {
        // only resize if the viewport exists
        const pixelRatio = window.devicePixelRatio;
        const width = pixelRatio * window.innerWidth;
        const height = pixelRatio * window.innerHeight;
        viewport.resize(width, height);
        projection = mat4.perspective(
            projection,
            FIELD_OF_VIEW,
            viewport.width / viewport.height,
            MIN_Z,
            MAX_Z);
    }
});

function rotateTransform(transform, velocity) {
    const RADIANS_PER_MILLI = (velocity / 1000) * DEGREES_TO_RADIANS;
    transform.rotate(ROTATION_AXIS, delta * RADIANS_PER_MILLI);
    transform.calcMatrix();
}

function renderStarCubeMaps(entities) {
    // setup
    shaders.cubeMap.use();
    shaders.cubeMap.setUniform('uCubeMapSampler', 0);
    // set camera uniforms
    shaders.cubeMap.setUniform('uProjectionMatrix', projection);
    shaders.cubeMap.setUniform('uViewMatrix', view);
    // for each entity
    entities.forEach(entity => {
        shaders.cubeMap.setUniform('uModelMatrix', entity.transform.matrix);
        shaders.cubeMap.setUniform('uOpacity', entity.opacity);
        entity.texture.bind(0);
        cubeBuffer.draw();
    });
}

function renderNebulaCubeMaps(entities) {
    // before
    shaders.nebula.use();
    shaders.nebula.setUniform('uDelta', time / 1000);
    shaders.nebula.setUniform('uCubeMapSampler', 0);
    // set camera uniforms
    shaders.nebula.setUniform('uProjectionMatrix', projection);
    shaders.nebula.setUniform('uViewMatrix', view);
    // for each entity
    entities.forEach((entity, index) => {
        shaders.nebula.setUniform('uModelMatrix', entity.transform.matrix);
        shaders.nebula.setUniform('uOpacity', entity.opacity);
        shaders.nebula.setUniform('uIndex', index);
        entity.texture.bind(0);
        cubeBuffer.draw();
    });
}

function renderStars(entities) {
    // setup
    shaders.stars.use();
    shaders.stars.setUniform('uDelta', time / 1000);
    shaders.stars.setUniform('uPointSampler', 0);
    // set camera uniforms
    shaders.stars.setUniform('uProjectionMatrix', projection);
    shaders.stars.setUniform('uViewMatrix', view);
    starTexture.bind(0);
    // for each entity
    entities.forEach(entity => {
        shaders.stars.setUniform('uModelMatrix', entity.transform.matrix);
        shaders.stars.setUniform('uOpacity', entity.opacity);
        starBuffer.draw({
            mode: 'POINTS',
            count: entity.count,
            indexOffset: entity.indexOffset
        });
    });
}

function renderFrame() {
    // setup
    viewport.push();
    // get view matrix
    view = camera.getViewMatrix();

    // render cubemap entities
    cubeBuffer.bind();
    renderStarCubeMaps(starMaps);
    renderNebulaCubeMaps(nebulaMaps);
    cubeBuffer.unbind();

    // render vertex entities
    starBuffer.bind();
    renderStars(stars);
    starBuffer.unbind();

    // teardown
    viewport.pop();
}

function incrementOpacity(entity) {
    entity.opacity = Math.min(1, entity.opacity + 0.01);
}

function processFrame() {
    // get time and delta
    time = Date.now() - startTime;
    delta = time - prevTime;

    // update transforms
    rotateTransform(transforms.fast, VELOCITY.FAST);
    rotateTransform(transforms.medium, VELOCITY.MEDIUM);
    rotateTransform(transforms.slow, VELOCITY.SLOW);

    // fade everything in once it exists
    starMaps.forEach(incrementOpacity);
    nebulaMaps.forEach(incrementOpacity);
    stars.forEach(incrementOpacity);

    // rotate camera based on current rotation velocity
    camera.applyRotation(delta);

    // apply friction to rotation velocity
    camera.applyFriction();

    // render frame
    renderFrame();

    // store last timestamp
    prevTime = time;

    // redraw when browser is ready
    requestAnimationFrame(processFrame);
}

function setInitialRenderingState() {
    // set intial state
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function createCube() {
    const vertices = new Float32Array(108);
    vertices[0] = -0.5;
    vertices[1] = -0.5;
    vertices[2] = 0.5;
    vertices[3] = 0.5;
    vertices[4] = -0.5;
    vertices[5] = 0.5;
    vertices[6] = 0.5;
    vertices[7] = 0.5;
    vertices[8] = 0.5;
    vertices[9] = -0.5;
    vertices[10] = -0.5;
    vertices[11] = 0.5;
    vertices[12] = 0.5;
    vertices[13] = 0.5;
    vertices[14] = 0.5;
    vertices[15] = -0.5;
    vertices[16] = 0.5;
    vertices[17] = 0.5;
    vertices[18] = 0.5;
    vertices[19] = -0.5;
    vertices[20] = -0.5;
    vertices[21] = -0.5;
    vertices[22] = -0.5;
    vertices[23] = -0.5;
    vertices[24] = -0.5;
    vertices[25] = 0.5;
    vertices[26] = -0.5;
    vertices[27] = 0.5;
    vertices[28] = -0.5;
    vertices[29] = -0.5;
    vertices[30] = -0.5;
    vertices[31] = 0.5;
    vertices[32] = -0.5;
    vertices[33] = 0.5;
    vertices[34] = 0.5;
    vertices[35] = -0.5;
    vertices[36] = -0.5;
    vertices[37] = 0.5;
    vertices[38] = 0.5;
    vertices[39] = 0.5;
    vertices[40] = 0.5;
    vertices[41] = 0.5;
    vertices[42] = 0.5;
    vertices[43] = 0.5;
    vertices[44] = -0.5;
    vertices[45] = -0.5;
    vertices[46] = 0.5;
    vertices[47] = 0.5;
    vertices[48] = 0.5;
    vertices[49] = 0.5;
    vertices[50] = -0.5;
    vertices[51] = -0.5;
    vertices[52] = 0.5;
    vertices[53] = -0.5;
    vertices[54] = 0.5;
    vertices[55] = -0.5;
    vertices[56] = 0.5;
    vertices[57] = -0.5;
    vertices[58] = -0.5;
    vertices[59] = 0.5;
    vertices[60] = -0.5;
    vertices[61] = -0.5;
    vertices[62] = -0.5;
    vertices[63] = 0.5;
    vertices[64] = -0.5;
    vertices[65] = 0.5;
    vertices[66] = -0.5;
    vertices[67] = -0.5;
    vertices[68] = -0.5;
    vertices[69] = 0.5;
    vertices[70] = -0.5;
    vertices[71] = -0.5;
    vertices[72] = -0.5;
    vertices[73] = -0.5;
    vertices[74] = -0.5;
    vertices[75] = -0.5;
    vertices[76] = -0.5;
    vertices[77] = 0.5;
    vertices[78] = -0.5;
    vertices[79] = 0.5;
    vertices[80] = 0.5;
    vertices[81] = -0.5;
    vertices[82] = -0.5;
    vertices[83] = -0.5;
    vertices[84] = -0.5;
    vertices[85] = 0.5;
    vertices[86] = 0.5;
    vertices[87] = -0.5;
    vertices[88] = 0.5;
    vertices[89] = -0.5;
    vertices[90] = 0.5;
    vertices[91] = -0.5;
    vertices[92] = 0.5;
    vertices[93] = 0.5;
    vertices[94] = -0.5;
    vertices[95] = -0.5;
    vertices[96] = 0.5;
    vertices[97] = 0.5;
    vertices[98] = -0.5;
    vertices[99] = 0.5;
    vertices[100] = -0.5;
    vertices[101] = 0.5;
    vertices[102] = 0.5;
    vertices[103] = 0.5;
    vertices[104] = -0.5;
    vertices[105] = 0.5;
    vertices[106] = 0.5;
    vertices[107] = 0.5;
    return new esper.VertexBuffer(vertices, {
        0: {
            size: 3,
            type: 'FLOAT'
        }
    }, {
        count: 36
    });
}

function loadShader(src) {
    return done => {
        return new esper.Shader(src, done);
    };
}

function loadCubeMap(url, ext) {
    return done => {
        return new esper.TextureCubeMap({
            faces: {
                '+x': `${url}_right1.${ext}`,
                '-x': `${url}_left2.${ext}`,
                '+y': `${url}_top3.${ext}`,
                '-y': `${url}_bottom4.${ext}`,
                '+z': `${url}_front5.${ext}`,
                '-z': `${url}_back6.${ext}`
            },
            invertY: false
        }, done);
    };
}

function loadTexture(url, ext) {
    return done => {
        return new esper.ColorTexture2D({
            src: `${url}.${ext}`
        }, done);
    };
}

window.start = function() {

    canvas = document.getElementById('glcanvas');

    // get WebGL context and loads all available extensions
    gl = esper.WebGLContext.get(canvas, {
        depth: false
    });

    // only continue if WebGL is available
    if (gl) {
        // get window dimensions
        const pixelRatio = window.devicePixelRatio;
        const width = pixelRatio * window.innerWidth;
        const height = pixelRatio * window.innerHeight;

        // create camera
        camera = new Camera();

        // create projection
        projection = mat4.perspective(
            mat4.new(),
            FIELD_OF_VIEW,
            width / height,
            MIN_Z,
            MAX_Z);

        // create viewport
        viewport = new esper.Viewport({
            width: width,
            height: height
        });

        // create the cube
        cubeBuffer = createCube();

        // create the transforms
        transforms.fast = new Transform();
        transforms.medium = new Transform();
        transforms.slow = new Transform();

        // generate stars
        generateStars();

        // load essentials required for the frame loop to start
        parallel({
            'cubeMap': loadShader(SHADERS.cubeMap),
            'nebula': loadShader(SHADERS.nebula),
            'stars': loadShader(SHADERS.stars),
            'starTexture': loadTexture(STAR_TEXTURE.url, STAR_TEXTURE.ext)
        }, (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
            // set results accordingly
            shaders.cubeMap = results.cubeMap;
            shaders.nebula = results.nebula;
            shaders.stars = results.stars;
            starTexture = results.starTexture;
            // start typing effect
            setTimeout(() => {
                animatedTyping($('.typing'), [
                    'is a software engineer',
                    'lives in toronto, ontario',
                    'works at uncharted software'
                ]);
            }, 2000);
            // set initial state
            setInitialRenderingState();
            // get start time
            startTime = Date.now();
            // initiate draw loop
            processFrame();
        });

        // create stars
        STARS.forEach(star => {
            loadCubeMap(star.url, star.ext)((err, cubeMapTexture) => {
                if (err) {
                    console.error(err);
                    return;
                }
                starMaps.push({
                    transform: transforms[ star.velocity ],
                    texture: cubeMapTexture,
                    opacity: 0
                });
            });
        });

        // create nebulaMaps
        NEBULAS.forEach(nebula => {
            loadCubeMap(nebula.url, nebula.ext)((err, cubeMapTexture) => {
                if (err) {
                    console.error(err);
                    return;
                }
                nebulaMaps.push({
                    transform: transforms[ nebula.velocity ],
                    texture: cubeMapTexture,
                    opacity: 0
                });
            });
        });

        // add cursor to blinking element
        $('.blinking').text('_');
    }
};
