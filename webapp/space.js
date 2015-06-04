
"use strict";

var gl;
var camera;
var renderer;
var cubeMapShader;
var mouse;
var background;
var middleground;
var foreground;
var viewport;
var prevFrame = new Date().getTime();

function createFirstPersonMouse( entity ) {
    var mouse = new rolypoly.Mouse();
    // rotate mouse on hold
    mouse.on( 'move', function( event ) {
        var dx = event.clientX - event.previousClientX,
            dy = event.clientY - event.previousClientY;
        if ( mouse.poll('left') === 'down' ) {
            entity.rotateWorldDegrees( dx * -0.1 , [ 0, 1, 0 ] );
            entity.rotateLocalDegrees( dy * 0.05, [ 1, 0, 0 ] );
        }
    });
    return mouse;
}

function processFrame() {

    var currentFrame = new Date().getTime(),
        delta = currentFrame - prevFrame,
        foreRot = alfador.Mat33.rotationDegrees( delta/2800, [ 0.1, 0.9, 0.2 ] ),
        middleRot = alfador.Mat33.rotationDegrees( delta/3500, [ 0.1, 0.8, 0.2 ] ),
        backRot = alfador.Mat33.rotationDegrees( delta/3700, [ 0.1, 0.7, 0.2 ] );

    foreground.forward( foreRot.mult( foreground.forward() ) );
    middleground.forward( middleRot.mult( middleground.forward() ) );
    background.forward( backRot.mult( background.forward() ) );

    // render entities
    renderer.render(
        camera,
        {
            "cubeMap": [
                background,
                middleground,
                foreground ]
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
        createCubeMapTechnique()
    ]);
}

function startApplication() {
    var middlegroundTexDeferred = $.Deferred(),
        backgroundTexDeferred = $.Deferred(),
        foregroundTexDeferred = $.Deferred(),
        cubeMapShaderDeferred = $.Deferred();

    // get WebGL context, this automatically binds it globally and loads all available extensions
    gl = esper.WebGLContext.get( "glcanvas" );

    // only continue if WebGL is available
    if ( gl ) {
        // create camera
        camera = new esper.Camera({
            origin: [ 0, 5, -20 ],
            projection: {
                fov: 45,
                aspect: 4/3,
                zMin: 0.1,
                zMax: 1000
            }
        });
        // create mouse input poller
        mouse = createFirstPersonMouse( camera );

        var foregroundTex = new esper.TextureCubeMap({
            urls: {
                '+x': './resources/images/cubemaps/0/0_right1.png',
                '-x': './resources/images/cubemaps/0/0_left2.png',
                '+y': './resources/images/cubemaps/0/0_top3.png',
                '-y': './resources/images/cubemaps/0/0_bottom4.png',
                '+z': './resources/images/cubemaps/0/0_front5.png',
                '-z': './resources/images/cubemaps/0/0_back6.png'
            }
        }, function() {
            foreground.meshes[0].material.diffuseTexture = foregroundTex;
            foregroundTexDeferred.resolve();
        });

        var middlegroundTex = new esper.TextureCubeMap({
            urls: {
                '+x': './resources/images/cubemaps/1/1_right1.png',
                '-x': './resources/images/cubemaps/1/1_left2.png',
                '+y': './resources/images/cubemaps/1/1_top3.png',
                '-y': './resources/images/cubemaps/1/1_bottom4.png',
                '+z': './resources/images/cubemaps/1/1_front5.png',
                '-z': './resources/images/cubemaps/1/1_back6.png'
            }
        }, function() {
            middleground.meshes[0].material.diffuseTexture = middlegroundTex;
            middlegroundTexDeferred.resolve();
        });

        var backgroundTex = new esper.TextureCubeMap({
            urls: {
                '+x': './resources/images/cubemaps/2/2_right1.png',
                '-x': './resources/images/cubemaps/2/2_left2.png',
                '+y': './resources/images/cubemaps/2/2_top3.png',
                '-y': './resources/images/cubemaps/2/2_bottom4.png',
                '+z': './resources/images/cubemaps/2/2_front5.png',
                '-z': './resources/images/cubemaps/2/2_back6.png'
            }
        }, function() {
            background.meshes[0].material.diffuseTexture = backgroundTex;
            backgroundTexDeferred.resolve();
        });

        background = new esper.Entity({
            scale: 500,
            meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
        });

        middleground = new esper.Entity({
            scale: 500,
            meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
        });

        foreground = new esper.Entity({
            scale: 500,
            meshes: [ new esper.Mesh( esper.Cube.geometry() ) ]
        });

        cubeMapShader = new esper.Shader({
            vert: "./resources/shaders/cubemap.vert",
            frag: "./resources/shaders/cubemap.frag"
        }, function() {
            cubeMapShaderDeferred.resolve();
        });

        // create renderer
        createRenderer();

        // once everything is ready, begin rendering loop
        $.when(
            cubeMapShaderDeferred,
            middlegroundTexDeferred,
            foregroundTexDeferred,
            backgroundTexDeferred).then ( function() {
                // initiate draw loop
                processFrame();
            });
    }
}
