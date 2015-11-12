( function() {

    "use strict";

    var gulp = require('gulp'),
        concat = require('gulp-concat'),
        minifyHtml,
        bower,
        csso,
        filter,
        uglify;

    var paths = {
        js: [ 'webapp/js/**/*.js', 'webapp/app.js' ],
        webworkers: [ 'webapp/webworkers/**/*js'],
        css: [ 'webapp/css/reset.css', 'webapp/css/*.css' ],
        fonts: [ 'webapp/**/*.eof', 'webapp/**/*.svg', 'webapp/**/*.ttf', 'webapp/**/*.woff', 'webapp/**/*.woff2', 'webapp/**/*.otf' ],
        html: [ 'webapp/html/**/*.html' ],
        index: [ 'webapp/index.html' ],
        images: [ 'webapp/resources/images*/*.png' ],
        favicons: [ 'webapp/favicons/*' ],
        shaders: [ 'webapp/resources/shaders/*.vert', 'webapp/resources/shaders/*.frag' ]
    };

    function handleError( err ){
        console.log( err );
        this.emit('end');
    }

    gulp.task('clean', function () {
        var del = require('del');
       	del.sync([ 'build/*']);
    });

    gulp.task('lint', function() {
        var jshint = require('gulp-jshint');
        return gulp.src( [ './webapp/**/*.js',
            '!./webapp/vendor/**/*.js'] )
            .pipe( jshint() )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('build-js', function() {
        var sourcemaps = require('gulp-sourcemaps');
        uglify = uglify || require('gulp-uglify');
        return gulp.src( paths.js )
            .pipe( sourcemaps.init() )
            .pipe( concat('maelstrom.min.js') )
            .pipe( sourcemaps.write() )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-js', function() {
        uglify = uglify || require('gulp-uglify');
        return gulp.src( paths.js )
            .pipe( concat('maelstrom.min.js') )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-css', function () {
        csso = csso || require('gulp-csso');
        var concat = require('gulp-concat');
        return gulp.src( paths.css )
            .pipe( csso() )
            .pipe( concat('maelstrom.min.css') )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-html', function() {
        minifyHtml = minifyHtml || require('gulp-minify-html');
        return gulp.src( paths.html )
            .pipe( minifyHtml() )
            .pipe( gulp.dest('build/html') );
    });

    gulp.task('copy-index', function() {
        var replace = require('gulp-replace');
        minifyHtml = minifyHtml || require('gulp-minify-html');
        return gulp.src( paths.index )
            .pipe( replace( /({{GOOGLE_ANALYTICS_ID}})/, process.env.GOOGLE_ANALYTICS_ID ) )
            .pipe( minifyHtml() )
            .pipe( gulp.dest('build') );
    });

    gulp.task('copy-fonts', function() {
        var rename = require('gulp-rename');
        return gulp.src( paths.fonts )
            .pipe( rename({dirname: ''}) )
            .pipe( gulp.dest('build/fonts') );
    });

    gulp.task('copy-webworkers', function() {
        uglify = uglify || require('gulp-uglify');
        return gulp.src( paths.webworkers )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest('build/webworkers/') );
    });

    gulp.task('copy-shaders', function() {
        return gulp.src( paths.shaders )
            .pipe( gulp.dest('build/shaders/') );
    });

    gulp.task('copy-images', function() {
        return gulp.src( paths.images )
            .pipe( gulp.dest('build/') );
    });

    gulp.task('copy-favicons', function() {
        return gulp.src( paths.favicons )
            .pipe( gulp.dest('build/') );
    });

    gulp.task('build-vendor-js', function() {
        filter = filter || require('gulp-filter');
        bower = bower || require('main-bower-files');
        uglify = uglify || require('gulp-uglify');
        return gulp.src( bower() )
            .pipe( filter('**/*.js') ) // filter js files
            .pipe( concat('vendor.min.js') )
            .pipe( uglify() )
            .pipe( gulp.dest('build/vendor') );
    });

    gulp.task('build-vendor-css', function() {
        filter = filter || require('gulp-filter');
        bower = bower || require('main-bower-files');
        csso = csso || require('gulp-csso');
        return gulp.src( bower() )
            .pipe( filter('**/*.css') ) // filter css files
            .pipe( csso() )
            .pipe( concat('vendor.min.css') )
            .pipe( gulp.dest('build/vendor') );
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
        var express = require( 'express' ),
            bodyParser = require( 'body-parser' ),
            compression = require( 'compression' ),
            app = express();
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( compression() );
        app.use( express.static( __dirname + "/build/" ) );
        app.listen( 8080, function() {
            console.log( 'Listening on port %d', 8080 );
        });
        return app;
    });

    gulp.task('deploy', function( done ) {
        var runSequence = require('run-sequence');
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
        var runSequence = require('run-sequence');
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

    gulp.task('default', function() {
        var runSequence = require('run-sequence');
        runSequence( ['build'], ['watch'], ['serve'] );
    });

}());
