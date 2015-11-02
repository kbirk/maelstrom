( function() {

    "use strict";

    var FIELD_OF_VIEW = 60;
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
    var BACKGROUND_START_SPECTRUM = [
        [0.486, 0.023, 0.239],
        [0.352, 0.023, 0.286],
        [0.2, 0.137, 0.262]
    ];

    var IMAGES_DIR = IS_MOBILE ? 'images-mobile' : 'images-desktop';

    var NEBULAS = [
        {
            url: './' + IMAGES_DIR + '/cold',
            velocity: 'fast'
        },
        {
            url: './' + IMAGES_DIR + '/hot',
            velocity: 'slow'
        }
    ];
    var STARS = [
        {
            url: './images/cold_stars',
            velocity: 'fast'
        }
    ];
    var STAR_TEXTURE = {
        url: './images/star.png'
    };
    var SHADERS = {
        cubeMap: {
            vert: "./shaders/cubemap.vert",
            frag: "./shaders/cubemap.frag"
        },
        stars: {
            vert: "./shaders/point.vert",
            frag: "./shaders/point.frag"
        },
        nebula: {
            vert: "./shaders/nebula.vert",
            frag: "./shaders/nebula.frag"
        }
    };
    var ROTATION_FRICTION = 0.03;

    var verticalRotation = 0;
    var horizontalRotation = 0;
    var startTime = new Date().getTime();
    var prevTime = 0;
    var time = 0;
    var delta = 0;
    var stars = [];
    var nebulas = [];
    var staticStars = [];
    var starTexture;
    var shaders = {};
    var transforms;
    var gl;
    var camera;
    var mouse;
    var touch;
    var viewport;

    function fill( count, filler ) {
        var arr = new Array( count );
        for ( var i=0; i<count; i++ ) {
            arr[i] = filler;
        }
        return arr;
    }

    function initVertexBuffer( count ) {
        // create filler array
        var filler = fill( count, [ 0, 0, 0, 0 ] );
        // create vertex buffer, this will be updated periodically
        return new esper.VertexBuffer(
            new esper.VertexPackage([
                /**
                 * x: x
                 * y: y
                 * y: z
                 * w: rotation
                 */
                filler,
                /**
                 * x: red
                 * y: green
                 * y: blue
                 * w: radius
                 */
                filler ])
        );
    }

    function createStarEntity( vertexBuffer, velocity, offset, count ) {
        return {
            draw: function() {
                vertexBuffer.bind();
                gl.drawArrays(
                    gl.POINTS, // primitive type
                    offset, // offset
                    count ); // count
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
            count: 10000 * countFactor,
            velocity: 'medium',
            minRadius: 5,
            maxRadius: 100,
            colorSpectrum: FOREGROUND_STAR_SPECTRUM
        };
        var backgroundStars = {
            count: 20000 * countFactor,
            velocity: 'slow',
            minRadius: 3,
            maxRadius: 7,
            colorSpectrum: BACKGROUND_START_SPECTRUM
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
        viewport.resize( window.innerWidth, window.innerHeight );
        camera.projectionMatrix({
            fov: FIELD_OF_VIEW,
            aspect: viewport.width / viewport.height,
            zMin: MIN_Z,
            zMax: MAX_Z
        });
    });

    function createFirstPersonMouse() {
        var mouse = new rolypoly.Mouse();
        mouse.on( 'move', function( event ) {
            var dx = event.clientX - event.previousClientX,
                dy = event.clientY - event.previousClientY;
            if ( mouse.poll('left') === 'down' ) {
                verticalRotation += dx / 1000;
                horizontalRotation += dy / 1000;
            }
        });
        return mouse;
    }

    function createFirstPersonTouch() {
        var touch = new rolypoly.Touch(),
            prevX,
            prevY;
        touch.on( 'move', function( event ) {
            event.preventDefault();
            var touch = event.touches[0];
            if ( prevX === undefined && prevY === undefined ) {
                prevX = touch.clientX;
                prevY = touch.clientY;
                return;
            }
            var dx = touch.clientX - prevX,
                dy = touch.clientY - prevY;
            verticalRotation += dx / -500;
            horizontalRotation += dy / -500;
            prevX = touch.clientX;
            prevY = touch.clientY;
        });
        touch.on( 'end', function() {
            prevX = undefined;
            prevY = undefined;
        });
        return touch;
    }

    function rotateTransform( transform, velocity ) {
        var DEGREES_PER_MILLI = velocity / 1000,
            axis = [ 0.1, 1, 0.3 ];
        transform.rotateWorldDegrees( delta * DEGREES_PER_MILLI, axis );
    }

    function processFrame() {

        time = new Date().getTime() - startTime;
        delta = time - prevTime;

        // update transforms
        rotateTransform( transforms.fast, VELOCITY.FAST );
        rotateTransform( transforms.medium, VELOCITY.MEDIUM );
        rotateTransform( transforms.slow, VELOCITY.SLOW );

        // fade everything in once it exists
        staticStars.forEach( function( entity ) {
            entity.opacity = Math.min( 1, entity.opacity + 0.01  );
        });
        nebulas.forEach( function( entity ) {
            entity.opacity = Math.min( 1, entity.opacity + 0.01  );
        });
        stars.forEach( function( entity ) {
            entity.opacity = Math.min( 1, entity.opacity + 0.01 );
        });

        // rotate camera based on current drag rotation
        camera.rotateLocalDegrees( delta/10 * -verticalRotation, [ 0, 1, 0 ] );
        camera.rotateLocalDegrees( delta/10 * horizontalRotation, [ 1, 0, 0 ] );

        // update rotation velocity
        verticalRotation = verticalRotation * ( 1 - ROTATION_FRICTION );
        horizontalRotation = horizontalRotation * ( 1 - ROTATION_FRICTION );
        if ( Math.abs( verticalRotation ) < 0.0001 ) {
            verticalRotation = 0;
        }
        if ( Math.abs( horizontalRotation ) < 0.0001 ) {
            horizontalRotation = 0;
        }

        // render frame
        renderFrame();

        // store last timestamp
        prevTime = time;

        // redraw when browser is ready
        requestAnimationFrame( processFrame );
    }

    function renderFrame() {
        // setup
        viewport.push();
        // render entities
        renderCubeMaps( staticStars );
        renderNebulas( nebulas );
        renderStars( stars );
        // teardown
        viewport.pop();
    }

    function renderCubeMaps( entities ) {
        // setup
        shaders.cubeMap.push();
        shaders.cubeMap.setUniform( 'uCubeMapSampler', 0 );
        // set camera uniforms
        shaders.cubeMap.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
        shaders.cubeMap.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
        // for each entity
        entities.forEach( function( entity ) {
            shaders.cubeMap.setUniform( 'uModelMatrix', entity.transform.matrix() );
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
        shaders.nebula.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
        shaders.nebula.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
        // for each entity
        entities.forEach( function( entity, index ) {
            shaders.nebula.setUniform( 'uModelMatrix', entity.transform.matrix() );
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
        shaders.stars.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
        shaders.stars.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
        shaders.stars.setUniform( 'uPointSampler', 0 );
        shaders.stars.setUniform( 'uDelta', time / 1000 );
        // set camera uniforms
        shaders.stars.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
        shaders.stars.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
        starTexture.push( 0 );
        // for each entity
        entities.forEach( function( entity ) {
            shaders.stars.setUniform( 'uModelMatrix', entity.transform.matrix() );
            shaders.stars.setUniform( 'uOpacity', entity.opacity );
            entity.draw();
        });
        // teardown
        starTexture.pop( 0 );
        shaders.stars.pop();
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

    function loadCubeMap( url ) {
        return function( done ) {
            new esper.TextureCubeMap({
                urls: {
                    '+x': url + '_right1.png',
                    '-x': url + '_left2.png',
                    '+y': url + '_top3.png',
                    '-y': url + '_bottom4.png',
                    '+z': url + '_front5.png',
                    '-z': url + '_back6.png'
                }
            }, function( texture ) {
                done( null, texture );
            });
        };
    }

    function loadShader( shader ) {
        return function( done ) {
            new esper.Shader( shader, function( shader ) {
                done( null, shader );
            });
        };
    }

    function loadTexture( url ) {
        return function( done ) {
            new esper.Texture2D({
                url: url
            }, function( texture ) {
                done( null, texture );
            });
        };
    }

    window.startApplication = function() {

        // get WebGL context and loads all available extensions
        gl = esper.WebGLContext.get( "glcanvas" );

        // only continue if WebGL is available
        if ( gl ) {
            // create camera
            camera = new esper.Camera({
                projection: {
                    fov: FIELD_OF_VIEW,
                    aspect: window.innerWidth / window.innerHeight,
                    zMin: MIN_Z,
                    zMax: MAX_Z
                }
            });
            // create viewport
            viewport = new esper.Viewport();
            viewport.resize( window.innerWidth, window.innerHeight );

            // create mouse and touch input handlers
            mouse = createFirstPersonMouse();
            touch = createFirstPersonTouch();

            // generate stars
            generateStars();

            // load essentials required for the frame loop to start
            async.parallel({
                'cubeMap': loadShader( SHADERS.cubeMap ),
                'nebula': loadShader( SHADERS.nebula ),
                'stars': loadShader( SHADERS.stars ),
                'starTexture': loadTexture( STAR_TEXTURE.url )
            }, function( err, results ) {
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
                // initiate draw loop
                processFrame();
            });

            // create the transforms
            transforms = {
                fast: new esper.Transform(),
                medium: new esper.Transform(),
                slow: new esper.Transform()
            };

            var cube = new esper.Renderable( esper.Cube.geometry() );

            // create stars
            STARS.forEach( function( star ) {
                loadCubeMap( star.url )( function( err, cubeMapTexture ) {
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
                loadCubeMap( nebula.url )( function( err, cubeMapTexture ) {
                    nebulas.push({
                        transform: transforms[ nebula.velocity ],
                        opacity: 0,
                        texture: cubeMapTexture,
                        renderable: cube
                    });
                });
            });

            // typing effect
            $('.blinking').text('_');
        }
    };

}());
