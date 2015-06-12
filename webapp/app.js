
"use strict";

var gl;
var camera;
var renderer;
var shadowShader;
var shadowPhongShader;
var cubeMapShader;
var flatShader;
var mouse;
var keyboard;
var light;
var sponza;
var teapot;
var arrow;
var rambler;
var cube;
var cubeMapTexture;
var sphere;
var dynamicCubeMap;

/*
    Depth pre-pass
*/

function createFirstPersonMouse( entity ) {
    var mouse = new rolypoly.Mouse();
    // rotate mouse on hold
    mouse.on( 'move', function( event ) {
        var dx = event.clientX - event.previousClientX,
            dy = event.clientY - event.previousClientY;
        if ( mouse.poll('left') === 'down' ) {
            entity.rotateWorldDegrees( dx * -0.1, [ 0, 1, 0 ] );
            entity.rotateLocalDegrees( dy * 0.05, [ 1, 0, 0 ] );
        }
    });
    return mouse;
}

function pollKeyboard( keyboard, entity ) {
    // on poll, clear the translation vector
    var translation = new alfador.Vec3( 0, 0, 0 ),
        keys = keyboard.poll( ['w','a','s','d'] );
    if ( keys.w === 'down' ) {
        translation = translation.add( [ 0, 0, 1 ] );
    }
    if ( keys.a === 'down' ) {
        translation = translation.add( [ 1, 0, 0 ] );
    }
    if ( keys.s === 'down' ) {
        translation = translation.add( [ 0, 0, -1 ] );
    }
    if ( keys.d === 'down' ) {
        translation = translation.add( [ -1, 0, 0 ] );
    }
    entity.translateLocal( translation.normalize() );
}

function processFrame() {

    var timeStamp = new Date().getTime();

    light.origin([ -100, 100, 20 * Math.sin( timeStamp/5000 ) ]);
    light.forward([ 0, -1, 0 ]);
    light.forward([ 0.8, -1, 0 ]);

    // poll keyboard input
    pollKeyboard( keyboard, camera );

    // dynamic cube map generation
    dynamicCubeMap.render(
        sphere.origin(),
        renderer,
        {
            "shadowPhong": [ teapot, sponza, sphere, rambler ],
            "flat": [ arrow ],
            "cubeMap": [ cube ]
        });

    // render entities
    renderer.render(
        camera,
        {
            "shadowPhong": [ teapot, sponza, sphere, rambler ],
            "flat": [ arrow ],
            "cubeMap": [ cube ]
        });

    esper.Debug.setCamera( camera );

    //esper.Debug.drawWireFrame( teapot );

    //esper.Debug.drawNormalsAsColor( teapot );
    //esper.Debug.drawUVsAsVectors( sphere, [0, 1, 0] );

    //esper.Debug.drawNormalsAsVectors( teapot, [1, 0, 0] );
    //esper.Debug.drawTangentsAsVectors( sphere, [0, 1, 0] );
    //esper.Debug.drawBiTangentsAsVectors( sphere, [0, 0, 1] );

    //esper.Debug.drawTexture( texture );

    // redraw when browser is ready
    requestAnimationFrame( processFrame );
}

function createCubeMapTechnique() {
    return new esper.RenderTechnique({
        id: "cubeMap",
        passes: [
            new esper.RenderPass({
                before: function( camera ) {
                    gl.disable( gl.CULL_FACE );
                    cubeMapShader.push();
                    cubeMapShader.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                    cubeMapShader.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                    cubeMapShader.setUniform( 'uCubeMapSampler', 0 );
                    cubeMapTexture.push( 0 );
                },
                forEachEntity: function( entity ) {
                    cubeMapShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
                },
                forEachMesh: function( mesh ) {
                    mesh.draw();
                },
                after: function() {
                    cubeMapTexture.pop( 0 );
                    cubeMapShader.pop();
                    gl.enable( gl.CULL_FACE );
                }
            })
        ]
    });
}

function createShadowPhongTechnique() {
    var SHADOW_MAP_SIZE = 1024*2;
    // create viewport
    var viewport = new esper.Viewport({
        aspectRatio: 1.5
    });
    // create bias matrix
    var biasMatrix = new alfador.Mat44([
        0.5, 0.0, 0.0, 0.0,
        0.0, 0.5, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.0,
        0.5, 0.5, 0.5, 1.0 ]);
    // shadow map tex
    var shadowMapTexture = new esper.Texture2D({
        width: SHADOW_MAP_SIZE,
        height: SHADOW_MAP_SIZE,
        format: "RGBA",
        type: "UNSIGNED_BYTE"
    });
    // depth tex
    var depthTexture = new esper.Texture2D({
        width: SHADOW_MAP_SIZE,
        height: SHADOW_MAP_SIZE,
        format: "DEPTH_COMPONENT",
        type: "UNSIGNED_INT"
    });
    // create fbo and attach textures
    var renderTarget = new esper.RenderTarget();
    renderTarget.setColorTarget( shadowMapTexture );
    renderTarget.setDepthTarget( depthTexture );
    // shadow map pass
    var shadowMapPass = new esper.RenderPass({
        before: function() {
            renderTarget.push();
            renderTarget.clear();
            viewport.push( SHADOW_MAP_SIZE, SHADOW_MAP_SIZE );
            shadowShader.push();
            shadowShader.setUniform( 'uLightViewMatrix', light.globalViewMatrix() );
            shadowShader.setUniform( 'uLightProjectionMatrix', light.projectionMatrix() );
        },
        forEachEntity: function( entity ) {
            shadowShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
        },
        forEachMesh: function( mesh ) {
            mesh.draw();
        },
        after: function() {
            shadowShader.pop();
            renderTarget.pop();
            viewport.pop();
        }
    });
    // phong pass
    var shadowPhongPass = new esper.RenderPass({
        before: function( camera ) {
            gl.clearColor( 0.2, 0.2, 0.2, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            shadowPhongShader.push();
            shadowPhongShader.setUniform( 'uLightViewMatrix', light.globalViewMatrix() );
            shadowPhongShader.setUniform( 'uLightProjectionMatrix', light.projectionMatrix() );
            shadowPhongShader.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
            shadowPhongShader.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
            shadowPhongShader.setUniform( 'uInverseViewMatrix', camera.globalViewMatrix().inverse() );
            shadowPhongShader.setUniform( 'uLightPosition', light.origin() );
            shadowPhongShader.setUniform( 'uBiasMatrix', biasMatrix );
            shadowPhongShader.setUniform( 'uShadowSampler', 0 );
            shadowPhongShader.setUniform( 'uDiffuseTextureSampler', 1 );
            shadowPhongShader.setUniform( 'uCubeMapSampler', 2 );
            shadowMapTexture.push( 0 );
            dynamicCubeMap.push( 2 );
        },
        forEachEntity: function( entity ) {
            shadowPhongShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
        },
        forEachMesh: function( mesh ) {
            var material = mesh.material;
            shadowPhongShader.setUniform( 'uReflection', material.reflection );
            shadowPhongShader.setUniform( 'uRefraction', material.refraction );
            shadowPhongShader.setUniform( 'uSpecularColor', material.specularColor );
            shadowPhongShader.setUniform( 'uSpecularComponent', material.specularComponent );
            if ( material.diffuseTexture ) {
                material.diffuseTexture.push( 1 );
                shadowPhongShader.setUniform( 'uUseTexture', true );
            } else {
                shadowPhongShader.setUniform( 'uDiffuseColor', material.diffuseColor );
                shadowPhongShader.setUniform( 'uUseTexture', false );
            }
            mesh.draw();
            if ( material.diffuseTexture ) {
                material.diffuseTexture.pop( 1 );
            }
        },
        after: function() {
            shadowMapTexture.pop( 0 );
            dynamicCubeMap.pop( 2 );
            shadowPhongShader.pop();
        }
    });
    return new esper.RenderTechnique({
        id: "shadowPhong",
        passes: [
            shadowMapPass,
            shadowPhongPass
        ]
    });
}

function createFlatTechnique() {
    return new esper.RenderTechnique({
        id: "flat",
        passes: [
            new esper.RenderPass({
                before: function( camera ) {
                    flatShader.push();
                    flatShader.setUniform( 'uProjectionMatrix', camera.projectionMatrix() );
                    flatShader.setUniform( 'uViewMatrix', camera.globalViewMatrix() );
                },
                forEachEntity: function( entity ) {
                    flatShader.setUniform( 'uModelMatrix', entity.globalMatrix() );
                },
                forEachMesh: function( mesh ) {
                    flatShader.setUniform( 'uFlatColor', mesh.material.diffuseColor );
                    mesh.draw();
                },
                after: function() {
                    flatShader.pop();
                }
            })
        ]
    });
}

function createRenderer() {
    // enable backface culling
    gl.enable( gl.CULL_FACE );
    gl.cullFace( gl.BACK );
    // enable depth testing
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
    // create a renderer with a single phong technique
    renderer = new esper.Renderer([
        createShadowPhongTechnique(),
        createFlatTechnique(),
        createCubeMapTechnique()
    ]);
}

function startApplication() {
    var sponzaDeferred = $.Deferred(),
        ramblerDeferred = $.Deferred(),
        teapotDeferred = $.Deferred(),
        shadowShaderDeferred = $.Deferred(),
        shadowPhongShaderDeferred = $.Deferred(),
        flatShaderDeferred = $.Deferred(),
        cubeTextureDeferred = $.Deferred(),
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
                zMin: FRUSTUM_MIN,
                zMax: FRUSTUM_MAX
            }
        });
        // create mouse input poller
        mouse = createFirstPersonMouse( camera );
        // create keyboard input poller
        keyboard = new rolypoly.Keyboard();
        // create light
        light = new esper.Camera({
            origin: [ 0, 10, -10 ],
            projection: {
                fov: 90,
                aspect: 1,
                zMin: 1,
                zMax: 1000
            }
        });

        // load sponza model
        esper.OBJMTLLoader.load( 'resources/models/obj/sponza/sponza.obj', function( model ) {
            sponza = new esper.Entity( model );
            sponza.scale( 10 );
            sponzaDeferred.resolve();
        });
        // load teapot
        esper.OBJMTLLoader.load( 'resources/models/obj/tree/tree.obj', function( model ) {
            teapot = new esper.Entity( model );
            //var octree = new esper.Octree( model.meshes[0].triangles.concat( model.meshes[1].triangles ) );
            teapot.scale( 3.0 );
            teapot.origin( [ -40, 0, 0 ] );
            //teapot.addChild( octree.getEntity() );
            teapotDeferred.resolve();
        });
        esper.OBJMTLLoader.load( 'resources/models/obj/arrow/arrow.obj', function( model ) {
            arrow = new esper.Entity( model );
            arrow.forward( [ -1, 0, 0 ] );
            light.addChild( arrow );
        });
        esper.glTFLoader.load( './resources/models/gltf/duck/duck.gltf', function( model ) {
            rambler = model;
            rambler.scale( 5 );
            rambler.origin( [ 40, 0.5, 0 ] );
            //rambler.up( [ 0, -1, 0 ] );
            ramblerDeferred.resolve();
        });

        cubeMapTexture = new esper.TextureCubeMap({
            urls: {
                '+x': './resources/images/posx.jpg',
                '-x': './resources/images/negx.jpg',
                '+y': './resources/images/posy.jpg',
                '-y': './resources/images/negy.jpg',
                '+z': './resources/images/posz.jpg',
                '-z': './resources/images/negz.jpg'
            }
        }, function() {
            cubeTextureDeferred.resolve();
        });

        cube = new esper.Entity({
            scale: 500,
            meshes: [
                new esper.Mesh( esper.Cube.geometry() )
            ]
        });

        dynamicCubeMap = new esper.CubeMapRenderTarget({
            resolution: 1024,
            mipMap: true
        });

        sphere = new esper.Entity({
            scale: 5,
            origin: [ 20, 6, 0 ],
            meshes: [
                new esper.Mesh( esper.Sphere.geometry( 20, 20, 1 ) )
            ]
        });
        sphere.meshes[0].material.diffuseColor = [ 0.0, 1.0, 0.2, 1.0 ];
        sphere.meshes[0].material.reflection = 0.3;
        sphere.meshes[0].material.transparency = 0.0;
        sphere.meshes[0].material.specularComponent = 100;

        /*
        var texture = new esper.Texture2D({
            url: './resources/images/uvTest.png'
        }, function( texture ) {
            sphere.meshes[0].material = new esper.Material({
                diffuseTexture: texture
            });
        });
        */

        // load, compile, and link shader programs
        shadowShader = new esper.Shader({
            vert: "resources/shaders/shadow.vert",
            frag: "resources/shaders/shadow.frag"
        }, function() {
            shadowShaderDeferred.resolve();
        });
        shadowPhongShader = new esper.Shader({
            vert: "resources/shaders/shadowPhong.vert",
            frag: "resources/shaders/shadowPhong.frag"
        }, function() {
            shadowPhongShaderDeferred.resolve();
        });
        flatShader = new esper.Shader({
            vert: "resources/shaders/flat.vert",
            frag: "resources/shaders/flat.frag"
        }, function() {
            flatShaderDeferred.resolve();
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
        $.when( sponzaDeferred,
            ramblerDeferred,
            teapotDeferred,
            shadowShaderDeferred,
            shadowPhongShaderDeferred,
            flatShaderDeferred,
            cubeMapShaderDeferred,
            cubeTextureDeferred ).then ( function() {
                // initiate draw loop
                processFrame();
            });
    }
}
