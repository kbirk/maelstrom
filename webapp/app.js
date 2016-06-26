( function() {

    'use strict';

    var $ = require('jquery');
    var async = require('async');
    var esper = require('esper');
    var vec = require('./scripts/vec');
    var mat = require('./scripts/mat');
    var isMobile = require('./scripts/isMobile');
    var LoadingBar = require('./scripts/LoadingBar');
    var animatedTyping = require('./scripts/animatedTyping');
    var Camera = require('./scripts/Camera');

    var FIELD_OF_VIEW = 60 * ( Math.PI / 180 );
    var MIN_Z = 0.1;
    var MAX_Z = 1000;
    var VELOCITY = {
        SLOW: 1,
        MEDIUM: 1.1,
        FAST: 1.2
    };
    var IS_MOBILE = isMobile();
    var FOREGROUND_STAR_SPECTRUM = [
        [0.247, 0.698, 1],
        [0.247, 0.270, 1],
        [0.435, 0.247, 1],
        [0.647, 0.247, 1]
    ];
    var FOREGROUND_STAR_COUNT = 15000;
    var BACKGROUND_STAR_SPECTRUM = [
        [0.486, 0.023, 0.239],
        [0.352, 0.023, 0.286],
        [0.2, 0.137, 0.262]
    ];
    var BACKGROUND_STAR_COUNT = 30000;
    var IMAGES_DIR = IS_MOBILE ? 'images/mobile' : 'images/desktop';
    var NEBULAS = [
        {
            url: IMAGES_DIR + '/cold',
            ext: 'jpg',
            velocity: 'fast'
        },
        {
            url: IMAGES_DIR + '/hot',
            ext: 'jpg',
            velocity: 'slow'
        }
    ];
    var STARS = [
        {
            url: IMAGES_DIR + '/cold_stars',
            ext: 'png',
            velocity: 'fast'
        }
    ];
    var STAR_TEXTURE = {
        url: 'images/star',
        ext: 'jpg'
    };
    var SHADERS = {
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

    var startTime = 0;
    var prevTime = 0;
    var time = 0;
    var delta = 0;
    var stars = [];
    var nebulas = [];
    var staticStars = [];
    var starTexture;
    var shaders = {};
    var transforms;

    var canvas;
    var gl;
    var camera;
    var view;
    var projection;
    var viewport;

    function initVertexBuffer( count ) {
        var bufferSize =  count * 4 * 2;
        // create vertex buffer, this will never be updated
        return new esper.VertexBuffer( bufferSize, {
            /**
             * x: x
             * y: y
             * y: z
             * w: rotation
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
             * w: radius
             */
            1: {
                size: 4,
                type: 'FLOAT',
                byteOffset: 16
            }
        });
    }

    function createStarEntity( vertexBuffer, velocity, indexOffset, count ) {
        return {
            draw: function() {
                vertexBuffer.bind();
                vertexBuffer.draw({
                    mode: 'POINTS',
                    count: count,
                    indexOffset: indexOffset
                });
                vertexBuffer.unbind();
            },
            transform: transforms[ velocity ],
            opacity: 0
        };
    }

    function generateStars() {
        var loadingBar = new LoadingBar();
        var countFactor = IS_MOBILE ? 0.5 : 1;
        var foregroundStars = {
            count: FOREGROUND_STAR_COUNT * countFactor,
            velocity: 'medium',
            minRadius: 5,
            maxRadius: 100,
            colorSpectrum: FOREGROUND_STAR_SPECTRUM
        };
        var backgroundStars = {
            count: BACKGROUND_STAR_COUNT * countFactor,
            velocity: 'slow',
            minRadius: 3,
            maxRadius: 7,
            colorSpectrum: BACKGROUND_STAR_SPECTRUM
        };
        var vertexBuffer = initVertexBuffer( backgroundStars.count + foregroundStars.count );
        // create web worker to generate particles
        var worker = new Worker('webworkers/StarGenerator.js');
        worker.addEventListener('message', function( e ) {
            switch ( e.data.type ) {
                case 'progress':
                    loadingBar.update( e.data.progress );
                    break;
                case 'complete':
                    loadingBar.finish();
                    vertexBuffer.bufferData( new Float32Array( e.data.buffer ) );
                    worker.terminate();
                    // add foreground stars
                    stars.push( createStarEntity(
                        vertexBuffer,
                        foregroundStars.velocity,
                        0,
                        foregroundStars.count ) );
                    // add background stars
                    stars.push( createStarEntity(
                        vertexBuffer,
                        backgroundStars.velocity,
                        foregroundStars.count,
                        backgroundStars.count ) );
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

    window.addEventListener( 'resize', function() {
        if ( viewport ) {
            // only resize if the viewport exists
            var pixelRatio = window.devicePixelRatio;
            var width = pixelRatio * window.innerWidth;
            var height = pixelRatio * window.innerHeight;
            viewport.resize( width, height );
            projection = mat.perspective(
                projection,
                FIELD_OF_VIEW,
                viewport.width / viewport.height,
                MIN_Z,
                MAX_Z );
        }
    });

    function rotateTransform( transform, velocity ) {
        var RADIANS_PER_MILLI = ( velocity / 1000 ) * ( Math.PI / 180 );
        var axis = vec.new( 0.1, 1, 0.3 );
        return mat.rotateWorld( transform, delta * RADIANS_PER_MILLI, axis );
    }

    function renderCubeMaps( entities ) {
        // setup
        shaders.cubeMap.push();
        shaders.cubeMap.setUniform( 'uCubeMapSampler', 0 );
        // set camera uniforms
        shaders.cubeMap.setUniform( 'uProjectionMatrix', projection );
        shaders.cubeMap.setUniform( 'uViewMatrix', view );
        // for each entity
        entities.forEach( function( entity ) {
            shaders.cubeMap.setUniform( 'uModelMatrix', entity.transform );
            shaders.cubeMap.setUniform( 'uOpacity', entity.opacity );
            entity.texture.push( 0 );
            entity.renderable.draw();
            entity.texture.pop( 0 );
        });
        // teardown
        shaders.cubeMap.pop();
    }

    function renderNebulas( entities ) {
        // before
        shaders.nebula.push();
        shaders.nebula.setUniform( 'uDelta', time / 1000 );
        shaders.nebula.setUniform( 'uCubeMapSampler', 0 );
        // set camera uniforms
        shaders.nebula.setUniform( 'uProjectionMatrix', projection );
        shaders.nebula.setUniform( 'uViewMatrix', view );
        // for each entity
        entities.forEach( function( entity, index ) {
            shaders.nebula.setUniform( 'uModelMatrix', entity.transform );
            shaders.nebula.setUniform( 'uOpacity', entity.opacity );
            shaders.nebula.setUniform( 'uIndex', index );
            entity.texture.push( 0 );
            entity.renderable.draw();
            entity.texture.pop( 0 );
        });
        // teardown
        shaders.nebula.pop();
    }

    function renderStars( entities ) {
        // setup
        shaders.stars.push();
        shaders.stars.setUniform( 'uPointSampler', 0 );
        shaders.stars.setUniform( 'uDelta', time / 1000 );
        // set camera uniforms
        shaders.stars.setUniform( 'uProjectionMatrix', projection );
        shaders.stars.setUniform( 'uViewMatrix', view );
        starTexture.push( 0 );
        // for each entity
        entities.forEach( function( entity ) {
            shaders.stars.setUniform( 'uModelMatrix', entity.transform );
            shaders.stars.setUniform( 'uOpacity', entity.opacity );
            entity.draw();
        });
        // teardown
        starTexture.pop( 0 );
        shaders.stars.pop();
    }

    function renderFrame() {
        // setup
        viewport.push();
        // get view matrix
        view = camera.getViewMatrix();
        // render entities
        renderCubeMaps( staticStars );
        renderNebulas( nebulas );
        renderStars( stars );
        // teardown
        viewport.pop();
    }

    function incrementOpacity( entity ) {
        entity.opacity = Math.min( 1, entity.opacity + 0.01  );
    }

    function processFrame() {
        // get time and delta
        time = new Date().getTime() - startTime;
        delta = time - prevTime;

        // update transforms
        rotateTransform( transforms.fast, VELOCITY.FAST );
        rotateTransform( transforms.medium, VELOCITY.MEDIUM );
        rotateTransform( transforms.slow, VELOCITY.SLOW );

        // fade everything in once it exists
        staticStars.forEach( incrementOpacity );
        nebulas.forEach( incrementOpacity );
        stars.forEach( incrementOpacity );

        // rotate camera based on current rotation velocity
        camera.applyRotation( delta );

        // apply friction to rotation velocity
        camera.applyFriction();

        // render frame
        renderFrame();

        // store last timestamp
        prevTime = time;

        // redraw when browser is ready
        requestAnimationFrame( processFrame );
    }

    function setInitialRenderingState() {
        // set intial state
        gl.disable( gl.CULL_FACE );
        gl.disable( gl.DEPTH_TEST );
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
        gl.clearColor( 0, 0, 0, 1 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    }

    function createCube() {
        return {
            vertices: {
                0: [
                    // front face
                    [ -0.5, -0.5, 0.5 ],
                    [ 0.5, -0.5, 0.5 ],
                    [ 0.5, 0.5, 0.5 ],
                    [ -0.5, 0.5, 0.5 ],
                    // back face
                    [ -1, -1, -1 ],
                    [ 1, -1, -1 ],
                    [ 1, 1, -1 ],
                    [ -1, 1, -1 ]
                ]
            },
            indices: [
                0, 1, 2, 0, 2, 3, // front face
                5, 4, 7, 5, 7, 6, // back face
                3, 2, 6, 3, 6, 7, // top face
                1, 0, 4, 1, 4, 5, // bottom face
                4, 0, 3, 4, 3, 7, // right face
                1, 5, 6, 1, 6, 2  // left face
            ]
        };
    }

    function loadShader( shader ) {
        return function( done ) {
            new esper.Shader( shader, function( err, shader ) {
                done( err, shader );
            });
        };
    }

    function loadCubeMap( url, ext ) {
        return function( done ) {
            new esper.TextureCubeMap({
                faces: {
                    '+x': url + '_right1.' + ext,
                    '-x': url + '_left2.' + ext,
                    '+y': url + '_top3.' + ext,
                    '-y': url + '_bottom4.' + ext,
                    '+z': url + '_front5.' + ext,
                    '-z': url + '_back6.' + ext
                },
                invertY: false
            }, function( err, texture ) {
                done( err, texture );
            });
        };
    }

    function loadTexture( url, ext ) {
        return function( done ) {
            new esper.ColorTexture2D({
                src: url + '.' + ext
            }, function( err, texture ) {
                done( err, texture );
            });
        };
    }

    window.start = function() {

        canvas = document.getElementById('glcanvas');

        // get WebGL context and loads all available extensions
        gl = esper.WebGLContext.get( canvas, {
            depth: false
        });

        // only continue if WebGL is available
        if ( gl ) {
            // get window dimensions
            var pixelRatio = window.devicePixelRatio;
            var width = pixelRatio * window.innerWidth;
            var height = pixelRatio * window.innerHeight;

            // create camera
            camera = new Camera();

            // create projection
            projection = mat.perspective(
                mat.new(),
                FIELD_OF_VIEW,
                width / height,
                MIN_Z,
                MAX_Z );

            // create viewport
            viewport = new esper.Viewport({
                width: width,
                height: height
            });

            // generate stars
            generateStars();

            // load essentials required for the frame loop to start
            async.parallel({
                'cubeMap': loadShader( SHADERS.cubeMap ),
                'nebula': loadShader( SHADERS.nebula ),
                'stars': loadShader( SHADERS.stars ),
                'starTexture': loadTexture( STAR_TEXTURE.url, STAR_TEXTURE.ext )
            }, function( err, results ) {
                if ( err ) {
                    console.error( err );
                    return;
                }
                // set results accordingly
                shaders.cubeMap = results.cubeMap;
                shaders.nebula = results.nebula;
                shaders.stars = results.stars;
                starTexture = results.starTexture;
                // start typing effect
                setTimeout( function() {
                    animatedTyping( $('.typing'), [
                        'is a software developer',
                        'lives in toronto, ontario',
                        'works at uncharted software'
                    ]);
                }, 2000 );
                // set initial state
                setInitialRenderingState();
                // get start time
                startTime = new Date().getTime();
                // initiate draw loop
                processFrame();
            });

            // create the transforms
            transforms = {
                fast: mat.new(),
                medium: mat.new(),
                slow: mat.new()
            };

            var cube = new esper.Renderable( createCube() );

            // create stars
            STARS.forEach( function( star ) {
                loadCubeMap( star.url, star.ext )( function( err, cubeMapTexture ) {
                    if ( err ) {
                        console.error( err );
                        return;
                    }
                    staticStars.push({
                        transform: transforms[ star.velocity ],
                        opacity: 0,
                        texture: cubeMapTexture,
                        renderable: cube
                    });
                });
            });

            // create nebulas
            NEBULAS.forEach( function( nebula ) {
                loadCubeMap( nebula.url, nebula.ext )( function( err, cubeMapTexture ) {
                    if ( err ) {
                        console.error( err );
                        return;
                    }
                    nebulas.push({
                        transform: transforms[ nebula.velocity ],
                        opacity: 0,
                        texture: cubeMapTexture,
                        renderable: cube
                    });
                });
            });

            // add cursor to blinking element
            $('.blinking').text('_');
        }
    };

}());
