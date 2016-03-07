( function() {

    "use strict";

    var gulp = require('gulp');
    var concat = require('gulp-concat');
    var del = require('del');
    var jshint = require('gulp-jshint');
    var sourcemaps = require('gulp-sourcemaps');
    var uglify = require('gulp-uglify');
    var csso = require('gulp-csso');
    var minifyHtml = require('gulp-minify-html');
    var replace = require('gulp-replace');
    var rename = require('gulp-rename');
    var filter = require('gulp-filter');
    var bower = require('main-bower-files');
    var runSequence = require('run-sequence');

    var project = 'maelstrom';
    var paths = {
        js: [
            'webapp/js/**/*.js',
            'webapp/app.js' ],
        webworkers: [
            'webapp/webworkers/**/*js'
        ],
        css: [
            'webapp/css/reset.css',
            'webapp/css/*.css' ],
        fonts: [
            'webapp/**/*.eof',
            'webapp/**/*.svg',
            'webapp/**/*.ttf',
            'webapp/**/*.woff',
            'webapp/**/*.woff2',
            'webapp/**/*.otf' ],
        html: [
            'webapp/html/**/*.html'
        ],
        index: [
            'webapp/index.html'
        ],
        images: [
            'webapp/resources/images*/*.png'
        ],
        favicons: [
            'webapp/favicons/*'
        ],
        shaders: [
            'webapp/resources/shaders/*.vert',
            'webapp/resources/shaders/*.frag'
        ],
        build: 'build'
    };

    function handleError( err ){
        console.log( err );
        this.emit('end');
    }

    gulp.task('clean', function () {
       	del.sync([ paths.build ]);
    });

    gulp.task('lint', function() {
        return gulp.src( paths.js )
            .pipe( jshint() )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('build-js', function() {
        return gulp.src( paths.js )
            .pipe( sourcemaps.init() )
            .pipe( concat( project + '.min.js') )
            .pipe( sourcemaps.write() )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build-min-js', function() {
        return gulp.src( paths.js )
            .pipe( concat( project + '.min.js') )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build-min-css', function () {
        return gulp.src( paths.css )
            .pipe( csso() )
            .pipe( concat( project + '.min.css' ) )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-html', function() {
        return gulp.src( paths.html )
            .pipe( minifyHtml() )
            .pipe( gulp.dest( paths.build + '/html' ) );
    });

    gulp.task('copy-index', function() {
        return gulp.src( paths.index )
            .pipe( replace( /({{GOOGLE_ANALYTICS_ID}})/, process.env.GOOGLE_ANALYTICS_ID ) )
            .pipe( minifyHtml() )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('copy-fonts', function() {
        return gulp.src( paths.fonts )
            .pipe( rename({ dirname: '' }) )
            .pipe( gulp.dest( paths.build + '/fonts' ) );
    });

    gulp.task('copy-webworkers', function() {
        return gulp.src( paths.webworkers )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest( paths.build + '/webworkers' ) );
    });

    gulp.task('copy-shaders', function() {
        return gulp.src( paths.shaders )
            .pipe( gulp.dest( paths.build + '/shaders') );
    });

    gulp.task('copy-images', function() {
        return gulp.src( paths.images )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('copy-favicons', function() {
        return gulp.src( paths.favicons )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build-vendor-js', function() {
        return gulp.src( bower() )
            .pipe( filter('**/*.js') ) // filter js files
            .pipe( concat('vendor.min.js') )
            .pipe( uglify() )
            .pipe( gulp.dest( paths.build + '/vendor' ) );
    });

    gulp.task('build-vendor-css', function() {
        return gulp.src( bower() )
            .pipe( filter('**/*.css') ) // filter css files
            .pipe( csso() )
            .pipe( concat('vendor.min.css') )
            .pipe( gulp.dest( paths.build + '/vendor' ) );
    });

    gulp.task('watch', function( done ) {
        gulp.watch( paths.js, [ 'build-js' ] );
        gulp.watch( paths.css, ['build-min-css'] );
        gulp.watch( paths.html, [ 'build-min-html' ] );
        gulp.watch( paths.images, [ 'copy-images' ] );
        gulp.watch( paths.index, [ 'copy-index' ] );
        gulp.watch( paths.shaders, [ 'copy-shaders' ] );
        gulp.watch( paths.favicons, [ 'copy-favicons' ] );
        gulp.watch( paths.webworkers, [ 'copy-webworkers' ] );
        done();
    });

    gulp.task('serve', function() {
        var express = require( 'express' );
        var bodyParser = require( 'body-parser' );
        var compression = require( 'compression' );
        var app = express();
        var port = 8080;
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( compression() );
        app.use( express.static( __dirname + '/' + paths.build  ) );
        app.listen( port, function() {
            console.log( 'Listening on port %d', port );
        });
        return app;
    });

    gulp.task('deploy', function( done ) {
        runSequence(
            [
                'clean',
                'lint'
            ],
            [
                'build-min-js',
                'build-min-css',
                'build-min-html',
                'build-vendor-js',
                'build-vendor-css',
                'copy-webworkers',
                'copy-index',
                'copy-images',
                'copy-shaders',
                'copy-favicons',
                'copy-fonts'
            ],
            done );
    });

    gulp.task('build', function( done ) {
        runSequence(
            [
                'clean',
                'lint'
            ],
            [
                'build-js',
                'build-min-css',
                'build-min-html',
                'build-vendor-js',
                'build-vendor-css',
                'copy-webworkers',
                'copy-index',
                'copy-images',
                'copy-shaders',
                'copy-favicons',
                'copy-fonts'
            ],
            done );
    });

    gulp.task('default', function( done ) {
        runSequence(
            [ 'build' ],
            [ 'watch' ],
            [ 'serve' ],
            done );
    });

}());
