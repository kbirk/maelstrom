
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
var time = null;
var stars = [];
var nebula = [];
var staticStars = [];
var starTexture;
var shaders = {};

var FRUSTUM_MIN = 1;
var FRUSTUM_MAX = 1000;
/*
    1) Split existing layer:
        pink_nebula:
        pink_stars:

        etc..

    2) Apply noise to nebula based on 'distance'

    3) Make stars 'twinkle'

    4) Programmatically add large 'billboard' stars

*/

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

function generateStars( n ) {

    var rainbow = new Rainbow();
        rainbow.setSpectrum( 'FFFFFF', '3FB2FF', '3F7BFF', '3F45FF', '6F3FFF', 'A53FFF' );
        rainbow.setNumberRange( 0, 1 );

    var MIN_RADIUS = 5,
        MAX_RADIUS = 100,
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
    return new esper.Entity({
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

function createFirstPersonMouse( entity ) {
    var mouse = new rolypoly.Mouse();
    // rotate mouse on hold
    mouse.on( 'move', function( event ) {
        var dx = event.clientX - event.previousClientX,
            dy = event.clientY - event.previousClientY;
        if ( mouse.poll('left') === 'down' ) {
            entity.rotateLocalDegrees( dx * -0.1 , [ 0, 1, 0 ] );
            entity.rotateLocalDegrees( dy * 0.05, [ 1, 0, 0 ] );
        }
    });
    return mouse;
}

function rotateEntity( timestamp, entity, index ) {
    var DEGREES_PER_SECOND = 1,
        DPS_DROP_IN_SECOND = 0.5,
        DPS_DROP_IN_MILLI = DPS_DROP_IN_SECOND / 1000,
        DEGREES_PER_MILLI = DEGREES_PER_SECOND / 1000,
        axis = [ 0, 1, index * 0.001 ],
        rotation = alfador.Mat33.rotationDegrees( ( DEGREES_PER_MILLI * timestamp ) + ( index * DPS_DROP_IN_MILLI ), axis );
    entity.forward( rotation.mult( [ 0, 0, 1 ] ) );
}

function processFrame() {

    time = new Date().getTime() - startTime;

    staticStars.forEach( function( entity, index ) {
        rotateEntity( time, entity, index );
    });

    stars.forEach( function( entity, index ) {
        rotateEntity( time, entity, index+staticStars.length );
    });

    nebula.forEach( function( entity, index ) {
        rotateEntity( time, entity, index+staticStars.length+stars.length );
    });

    // render entities
    renderer.render(
        camera,
        {
            "cubeMap": staticStars,
            "nebula": nebula,
            "stars": stars
        });

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
    // disable backface culling
    gl.disable( gl.CULL_FACE );
    // disable depth testing
    gl.disable( gl.DEPTH_TEST );
    // enable blending
    gl.enable( gl.BLEND );
    gl.blendFunc( gl.ONE, gl.ONE );
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

function startApplication() {
    var NEBULA_URLS = [
            './resources/images/space/purple',
            './resources/images/space/green',
            './resources/images/space/blue',
            './resources/images/space/pink'
        ],
        STAR_URLS = [
            './resources/images/space/purple_stars',
            './resources/images/space/green_stars',
            './resources/images/space/blue_stars',
            './resources/images/space/red_stars',
        ],
        SHADER_URLS = [
            {
                id: "cubeMap",
                vert: "./resources/shaders/cubemap.vert",
                frag: "./resources/shaders/cubemap.frag"
            },
            {
                id: "stars",
                vert: "./resources/shaders/point.vert",
                frag: "./resources/shaders/point.frag"
            },
            {
                id: "nebula",
                vert: "./resources/shaders/nebula.vert",
                frag: "./resources/shaders/nebula.frag"
            },
        ];

    // get WebGL context, this automatically binds it globally and loads all available extensions
    gl = esper.WebGLContext.get( "glcanvas" );

    // only continue if WebGL is available
    if ( gl ) {
        // create camera
        camera = new esper.Camera({
            projection: {
                fov: FIELD_OF_VIEW,
                aspect: window.innerWidth/window.innerHeight,
                zMin: MIN_Z,
                zMax: MAX_Z
            }
        });
        // create mouse input poller
        mouse = createFirstPersonMouse( camera );

        var deferreds = [];
        SHADER_URLS.forEach( function( url ) {
            var d = $.Deferred();
            shaders[ url.id ] = new esper.Shader( url, function() {
                d.resolve();
            });
            deferreds.push( d );
        });

        NEBULA_URLS.forEach( function( url ) {
            var d = loadCubeMap( url );
            $.when( d ).then( function( texture ) {
                var n = new esper.Entity({
                    scale: 10,
                    meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
                });
                n.meshes[0].material.diffuseTexture = texture;
                nebula.push( n );
            });
        });

        STAR_URLS.forEach( function( url, index ) {
            staticStars.push(
                new esper.Entity({
                    scale: 10,
                    meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
                }));
            var d = loadCubeMap( url );
            $.when( d ).then( function( texture ) {
                staticStars[ index ].meshes[0].material.diffuseTexture = texture;
            });
        });

        // create renderer
        createRenderer();

        var d = $.Deferred();
        starTexture = new esper.Texture2D({
            url: "./resources/images/star.png"
        }, function() {
            stars.push( generateStars( 10000 ) );
            d.resolve();
        });
        deferreds.push( d );

        // once everything is ready, begin rendering loop
        $.when.apply( $, deferreds ).then ( function() {
            // initiate draw loop
            processFrame();
        });

    }
}
