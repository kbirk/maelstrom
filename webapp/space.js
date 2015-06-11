
"use strict";

var gl;
var camera;
var renderer;
var cubeMapShader;
var starsShader;
var mouse;
var entities = [];
var viewport;
var FIELD_OF_VIEW = 60;
var MIN_Z = 0.1;
var MAX_Z = 1000;
var prevFrame = new Date().getTime();
var stars;

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

function generateStars( n ) {
    var MIN_RADIUS = 1,
        MAX_RADIUS = 10,
        positions = new Array( n ),
        colors = new Array( n ),
        indices = new Array( n ),
        range = FRUSTUM_MAX - FRUSTUM_MIN,
        radius = Math.floor( new alfador.Vec3( 1, 1, 1 ).normalize().x ),
        min = FRUSTUM_MIN + range * 1 - radius,
        max = FRUSTUM_MAX - range * 1 - radius,
        i;
    for ( i=0; i<n; i++ ) {
        var rot = alfador.Mat33.rotationDegrees( i/n * 360, [ 0, 1, 0 ] ),
            a = Math.random() > 0.5 ? 1 : -1,
            b = Math.random() > 0.5 ? 1 : -1,
            c = Math.random() > 0.5 ? 1 : -1,
            d = Math.random() > 0.5 ? 1 : -1,
            e = Math.random() > 0.5 ? 1 : -1,
            f = Math.random() > 0.5 ? 1 : -1;
        positions[i] = rot.mult([
                a * min + Math.random() * b * max-min,
                c * min + Math.random() * d * max-min,
                e * min + Math.random() * f * max-min ] ).toArray();
        colors[i] = [
            Math.random()* 0.5 + 0.5,
            Math.random()* 0.5 + 0.5,
            Math.random()* 0.5 + 0.5,
            MIN_RADIUS + ( MAX_RADIUS - MIN_RADIUS ) * Math.random() ];
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

function processFrame() {

    var currentFrame = new Date().getTime(),
        //delta = currentFrame - prevFrame,
        DEGREES_PER_SECOND = 1,
        DPS_DROP_IN_SECOND = 1,
        DPS_DROP_IN_MILLI = DPS_DROP_IN_SECOND / 1000,
        DEGREES_PER_MILLI = DEGREES_PER_SECOND / 1000;

    entities.forEach( function( entity, index ) {
        var axis = [ 0, 1, index / ( entity.length + stars.length ) ], //index / 10 ],
            rotation = alfador.Mat33.rotationDegrees( ( DEGREES_PER_MILLI * currentFrame ) - ( index * DPS_DROP_IN_MILLI ), axis );
        entity.forward( rotation.mult( [ 0, 0, 1 ] ) );
    });

    /*
    stars.forEach( function( entity, index ) {
        var axis = [ 0, 1, ( index + entities.length ) / ( entity.length + stars.length ) ],
            rotation = alfador.Mat33.rotationDegrees( ( DEGREES_PER_MILLI * currentFrame ) - ( ( index + entities.length ) * DPS_DROP_IN_MILLI ), axis );
        entity.forward( rotation.mult( [ 0, 0, 1 ] ) );
    });
    */

    // render entities
    renderer.render(
        camera,
        {
            "cubeMap": entities,
            "stars": [ stars ]
        });

    prevFrame = currentFrame;

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
                    cubeMapShader.push();
                    cubeMapShader.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                    cubeMapShader.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                    cubeMapShader.setUniform( 'uCubeMapSampler', 0 );
                },
                forEachEntity: function( entity ) {
                    cubeMapShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
                },
                forEachMesh: function( mesh ) {
                    mesh.material.diffuseTexture.push( 0 );
                    mesh.draw();
                    mesh.material.diffuseTexture.pop( 0 );
                },
                after: function() {
                    cubeMapShader.pop();
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
                    starsShader.push();
                    starsShader.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                    starsShader.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                    //starsShader.setUniform( 'uDelta', new Date().getTime() );
                },
                forEachEntity: function( entity ) {
                    starsShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
                },
                forEachMesh: function( mesh ) {
                    mesh.draw();
                },
                after: function() {
                    starsShader.pop();
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
        createStarsTechnique()
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
    var URLS = [
            './resources/images/space/stars',
            './resources/images/space/purple',
            './resources/images/space/green',
            './resources/images/space/blue',
            './resources/images/space/pink'
        ],
        deferreds = [];

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

        cubeMapShader = new esper.Shader({
            vert: "./resources/shaders/cubemap.vert",
            frag: "./resources/shaders/cubemap.frag"
        }, function() {

        });

        starsShader = new esper.Shader({
            vert: "./resources/shaders/point.vert",
            frag: "./resources/shaders/point.frag"
        }, function() {

        });

        URLS.forEach( function( url ) {
            entities.push(
                new esper.Entity({
                    meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
                }));
            deferreds.push( loadCubeMap( url ) );
        });

        stars = generateStars( 10000 );

        // create renderer
        createRenderer();

        // once everything is ready, begin rendering loop
        $.when.apply( $, deferreds ).then ( function() {
            var textures = arguments;
            entities.forEach( function( entity, index ) {
                entity.meshes[0].material.diffuseTexture = textures[ index ];
            });
            // initiate draw loop
            processFrame();
        });
    }
}
