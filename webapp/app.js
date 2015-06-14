( function() {

    "use strict";

    var gl;
    var camera;
    var renderer;
    var mouse;
    var viewport;
    var FIELD_OF_VIEW = 60;
    var MIN_Z = 0.1;
    var MAX_Z = 1000;
    var startTime = new Date().getTime();
    var prevTime = 0;
    var time = 0;
    var delta = 0;
    var stars = [];
    var nebulas = [];
    var staticStars = [];
    var starTexture;
    var shaders = {};

    var FRUSTUM_MIN = 1;
    var FRUSTUM_MAX = 1000;

    function randomLog() {
        return 1 - Math.pow( Math.random(), 40 );
    }

    function hexToRgb( hex ) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function generateStars( n, velocity, minRadius, maxRadius, colorSpectrum ) {

        var rainbow = new Rainbow();
            rainbow.setSpectrum.apply( rainbow, colorSpectrum || [ 'FFFFFF', '3FB2FF', '3F7BFF', '3F45FF', '6F3FFF', 'A53FFF' ] );
            rainbow.setNumberRange( 0, 1 );

        var MIN_RADIUS = minRadius || 5,
            MAX_RADIUS = maxRadius || 100,
            positions = new Array( n ),
            colors = new Array( n ),
            indices = new Array( n ),
            min = FRUSTUM_MIN,
            range = ( FRUSTUM_MAX - FRUSTUM_MIN ),
            i;
        for ( i=0; i<n; i++ ) {
            var a = Math.random() > 0.5 ? 1 : -1,
                b = Math.random() > 0.5 ? 1 : -1,
                c = Math.random() > 0.5 ? 1 : -1,
                epsilon = range * 0.1,
                rand = randomLog(),
                distance = ( min + epsilon ) +  rand * ( range - epsilon ),
                radius = MIN_RADIUS + ( MAX_RADIUS - MIN_RADIUS ) * ( 1 - rand );
            positions[i] = new alfador.Vec3(
                a * Math.random(),
                b * Math.random(),
                c * Math.random() ).length( distance );
            var rgb = hexToRgb( rainbow.colorAt( Math.random() ) );
            colors[i] = [
                rgb.r / 255,
                rgb.g / 255,
                rgb.b / 255,
                Math.round( radius ) ];
            indices[i] = i;
        }
        var stars = new esper.Entity({
            meshes: [
                new esper.Mesh({
                    renderable: new esper.Renderable({
                        positions: positions,
                        colors: colors,
                        indices: indices,
                        options: {
                            mode: 'POINTS'
                        }
                    }),
                    geometry: new esper.Geometry({
                        positions: positions,
                        indices: indices
                    })
                })
            ]
        });
        stars.velocity = velocity;
        stars.opacity = 0;
        return stars;
    }

    window.addEventListener( 'resize', function() {
        viewport.height = window.innerHeight;
        viewport.width = window.innerWidth;
        camera.projectionMatrix({
            fov: FIELD_OF_VIEW,
            aspect: viewport.width / viewport.height,
            zMin: MIN_Z,
            zMax: MAX_Z
        });
    });

    var verticalRotation = 0;
    var horizontalRotation = 0;

    function createFirstPersonMouse() {
        var mouse = new rolypoly.Mouse();
        // rotate mouse on hold
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

    function rotateEntity( timestamp, entity ) {
        var DEGREES_PER_MILLI = entity.velocity / 1000,
            axis = [ 0, 1, 0 ],
            rotation = alfador.Mat33.rotationDegrees( DEGREES_PER_MILLI * timestamp, axis );
        entity.forward( rotation.mult( [ 0, 0, 1 ] ) );
    }

    function processFrame() {

        time = new Date().getTime() - startTime;
        delta = time - prevTime;

        staticStars.forEach( function( entity ) {
            rotateEntity( time, entity );
            entity.opacity = Math.min( 1, entity.opacity + 0.01  );
        });

        nebulas.forEach( function( entity ) {
            rotateEntity( time, entity );
            entity.opacity = Math.min( 1, entity.opacity + 0.01 );
        });

        stars.forEach( function( entity ) {
            rotateEntity( time, entity );
            entity.opacity = Math.min( 1, entity.opacity + 0.01 );
        });

        camera.rotateLocalDegrees( delta/10 * -verticalRotation , [ 0, 1, 0 ] );
        camera.rotateLocalDegrees( delta/10 * horizontalRotation , [ 1, 0, 0 ] );

        verticalRotation = verticalRotation * 0.97;
        horizontalRotation = horizontalRotation * 0.97;
        if ( Math.abs( verticalRotation ) < 0.0001 ) {
            verticalRotation = 0;
        }
        if ( Math.abs( horizontalRotation ) < 0.0001 ) {
            horizontalRotation = 0;
        }

        // render entities
        renderer.render(
            camera,
            {
                "cubeMap": staticStars,
                "nebula": nebulas,
                "stars": stars
            });

        prevTime = time;

        // redraw when browser is ready
        requestAnimationFrame( processFrame );
    }

    function createCubeMapTechnique() {
        return new esper.RenderTechnique({
            id: "cubeMap",
            passes: [
                new esper.RenderPass({
                    before: function( camera ) {
                        viewport.push();
                        shaders.cubeMap.push();
                        shaders.cubeMap.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                        shaders.cubeMap.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                        shaders.cubeMap.setUniform( 'uCubeMapSampler', 0 );
                    },
                    forEachEntity: function( entity ) {
                        shaders.cubeMap.setUniform( 'uModelMatrix', entity.globalMatrix() );
                        shaders.cubeMap.setUniform( 'uOpacity', entity.opacity );
                    },
                    forEachMesh: function( mesh ) {
                        mesh.material.diffuseTexture.push( 0 );
                        mesh.draw();
                        mesh.material.diffuseTexture.pop( 0 );
                    },
                    after: function() {
                        shaders.cubeMap.pop();
                        viewport.pop();
                    }
                })
            ]
        });
    }

    function createNebulaTechnique() {
        var index;
        return new esper.RenderTechnique({
            id: "nebula",
            passes: [
                new esper.RenderPass({
                    before: function( camera ) {
                        viewport.push();
                        shaders.nebula.push();
                        shaders.nebula.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                        shaders.nebula.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                        shaders.nebula.setUniform( 'uDelta', time / 1000 );
                        shaders.nebula.setUniform( 'uCubeMapSampler', 0 );
                        index = 0;
                    },
                    forEachEntity: function( entity ) {
                        shaders.nebula.setUniform( 'uModelMatrix', entity.globalMatrix() );
                        shaders.nebula.setUniform( 'uOpacity', entity.opacity );
                    },
                    forEachMesh: function( mesh ) {
                        mesh.material.diffuseTexture.push( 0 );
                        shaders.nebula.setUniform( 'uIndex', index++ );
                        mesh.draw();
                        mesh.material.diffuseTexture.pop( 0 );
                    },
                    after: function() {
                        shaders.nebula.pop();
                        viewport.pop();
                    }
                })
            ]
        });
    }

    function createStarsTechnique() {
        return new esper.RenderTechnique({
            id: "stars",
            passes: [
                new esper.RenderPass({
                    before: function( camera ) {
                        viewport.push();
                        shaders.stars.push();
                        shaders.stars.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                        shaders.stars.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                        shaders.stars.setUniform( 'uPointSampler', 0 );
                        shaders.stars.setUniform( 'uDelta', time / 1000 );
                        starTexture.push( 0 );
                    },
                    forEachEntity: function( entity ) {
                        shaders.stars.setUniform( 'uModelMatrix', entity.globalMatrix() );
                        shaders.stars.setUniform( 'uOpacity', entity.opacity );
                    },
                    forEachMesh: function( mesh ) {
                        mesh.draw();
                    },
                    after: function() {
                        starTexture.pop( 0 );
                        shaders.stars.pop();
                        viewport.pop();
                    }
                })
            ]
        });
    }

    function createRenderer() {
        // set intial state
        gl.disable( gl.CULL_FACE );
        gl.disable( gl.DEPTH_TEST );
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
        gl.clearColor( 0, 0, 0, 1 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        // create viewport
        viewport = new esper.Viewport();
        // create a renderer with a single phong technique
        renderer = new esper.Renderer([
            createCubeMapTechnique(),
            createStarsTechnique(),
            createNebulaTechnique()
        ]);
    }

    function loadCubeMap( url ) {
        var deferred = $.Deferred(),
            texture = new esper.TextureCubeMap({
                urls: {
                    '+x': url + '_right1.png',
                    '-x': url + '_left2.png',
                    '+y': url + '_top3.png',
                    '-y': url + '_bottom4.png',
                    '+z': url + '_front5.png',
                    '-z': url + '_back6.png'
                }
            }, function() {
                deferred.resolve( texture );
            });
        return deferred;
    }

    function typeText( $elem, text, callback ) {

        function getPause() {
            return Math.random() * 100 + 100;
        }

        function typeLetter() {
            if ( numLetters > text.length ) {
                callback();
                return;
            }
            elem.nodeValue = text.substring( 0, numLetters );
            numLetters++;
            setTimeout( typeLetter, getPause() );
        }
        var elem = $elem.contents()[0],
            numLetters = 0;
        typeLetter();
    }

    function deleteText( $elem, text, callback ) {

        function getPause() {
            return Math.random() * 50 + 20;
        }

        function deleteLetter() {
            if ( numLetters < 0 ) {
                callback();
                return;
            }
            elem.nodeValue = text.substring( 0, numLetters );
            numLetters--;
            setTimeout( deleteLetter, getPause() );
        }
        var elem = $elem.contents()[0],
            numLetters = text.length;
            deleteLetter();
    }

    function animatedTyping( $elem, text ) {

        function getLongPause() {
            return Math.random() * 2000 + 3000;
        }

        function getShortPause() {
            return Math.random() * 1000;
        }

        function type( index ) {
            typeText( $elem, text[ index ], function() {
                setTimeout( function() {
                    deleteText( $elem, text[ index ], function() {
                        setTimeout( function() {
                            type( (index+1) % text.length );
                        }, getShortPause() );
                    });
                }, getLongPause() );
            });
        }

        type( 0 );
    }

    window.startApplication = function() {
        var VELOCITY = {
                SLOW: 1,
                MEDIUM: 1.2,
                FAST: 1.4
            },
            NEBULAS = [
                {
                    url: './images/cold',
                    velocity: VELOCITY.FAST
                },
                {
                    url: './images/hot',
                    velocity: VELOCITY.SLOW
                }
            ],
            STARS = [
                {
                    url: './images/cold_stars',
                    velocity: VELOCITY.FAST
                }
            ],
            SHADERS = [
                {
                    id: "cubeMap",
                    vert: "./shaders/cubemap.vert",
                    frag: "./shaders/cubemap.frag"
                },
                {
                    id: "stars",
                    vert: "./shaders/point.vert",
                    frag: "./shaders/point.frag"
                },
                {
                    id: "nebula",
                    vert: "./shaders/nebula.vert",
                    frag: "./shaders/nebula.frag"
                }
            ];

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
            // create mouse input poller
            mouse = createFirstPersonMouse();

            var deferreds = [];
            SHADERS.forEach( function( shader ) {
                var d = $.Deferred();
                shaders[ shader.id ] = new esper.Shader( shader, function() {
                    d.resolve();
                });
                deferreds.push( d );
            });

            NEBULAS.forEach( function( nebula ) {
                var d = loadCubeMap( nebula.url );
                $.when( d ).then( function( texture ) {
                    var n = new esper.Entity({
                        scale: 10,
                        meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
                    });
                    n.meshes[0].material.diffuseTexture = texture;
                    n.velocity = nebula.velocity;
                    n.opacity = 0;
                    nebulas.push( n );
                });
            });

            STARS.forEach( function( stars ) {
                var d = loadCubeMap( stars.url );
                $.when( d ).then( function( texture ) {
                    var s = new esper.Entity({
                        scale: 10,
                        meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
                    });
                    s.meshes[0].material.diffuseTexture = texture;
                    s.velocity = stars.velocity;
                    s.opacity = 0;
                    staticStars.push( s );
                });
            });

            //
            setTimeout( function() {
                animatedTyping( $('h2'), [
                    'is a software developer',
                    'lives in toronto, ontario',
                    'works at uncharted software'
                ]);
            }, 2000 );

            // create renderer
            createRenderer();

            var d = $.Deferred();
            starTexture = new esper.Texture2D({
                url: "./images/star.png"
            }, function() {
                d.resolve();
                stars.push( generateStars( 10000, VELOCITY.MEDIUM ) );
                stars.push( generateStars( 20000, VELOCITY.SLOW, 3, 5, [ "7C063D", "5A0649", "332343" ] ) );
            });
            deferreds.push( d );

            // once everything is ready, begin rendering loop
            $.when.apply( $, deferreds ).then ( function() {
                // initiate draw loop
                processFrame();
            });

        }
    };

}());
