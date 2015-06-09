var gulp = require('gulp'),
    gutil = require('gulp-util'),
    bower = require('bower'),
    concat = require('gulp-concat'),
    sass = require('gulp-ruby-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    sh = require('shelljs'),
    browserify = require('browserify'),
    sourcemaps = require('gulp-sourcemaps'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    replaceHtml = require('gulp-html-replace');

var paths = {
  sass: ['./scss/**/*.scss']
};

var liveReload = false;
var serverPort = 8888;

gulp.task('clean', function () {
    return gulp.src(
        [
            './www/'
        ],
        {
            read: false
        }
    ).pipe(
        clean()
    );
});

gulp.task('default', ['sass']);

gulp.task('sass', function () {
    return sass('./scss/ionic.app.scss')
        .on('error', function (err) {
            console.error('Error!', err.message);
        })
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./www/css/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('browserify:dev', function () {
    browserify(
        './src/js/app.js'
    ).bundle(
        {debug: true}
    ).on(
        'error',
        function (err) {
            console.log(err.message);
        }
    ).pipe(
        source('app.bundle.js')
    ).pipe(
        buffer()
    ).pipe(
        sourcemaps.init({loadMaps: true})
    ).pipe(
        sourcemaps.write('./')
    ).pipe(
        gulp.dest('./src/js/')
    );
});

gulp.task('browserify:dist', function () {
    browserify(
        './src/js/app.js'
    ).bundle(
        {debug: true}
    ).pipe(
        source('app.min.js')
    ).pipe(
        buffer()
    ).pipe(
        uglify()
    ).pipe(
        gulp.dest('./www/js/')
    );
});

gulp.task('copy', function () {
    gulp.src(
        './src/img/**/*'
    ).pipe(
        gulp.dest('./www/img/')
    );

    gulp.src([
        './src/lib/ionic/js/ionic.bundle.min.js'
    ]).pipe(
        gulp.dest('./www/js/')
    );
});

gulp.task('server', function () {
    connect.server({
        livereload: liveReload,
        root: 'src',
        port: serverPort
    });
});

gulp.task('open-browser', function () {
    var options = {
        url: "http://localhost:" + serverPort
    };
    gulp.src(
        "./src/index.html"
    ).pipe(
        open("", options)
    );
});

gulp.task('replace-html', function () {
    gulp.src(
        './src/index.html'
    ).pipe(
        replaceHtml({
            'css': 'css/app.min.css',
            'js': [
                'js/lib.min.js',
                'cordova.js',
                'js/app.min.js'
            ]
        })
    ).pipe(
        gulp.dest('./www/')
    );
});

gulp.task('dev', ['sass', 'browserify:dev', 'server'], function () {
    gulp.start('open-browser');
});

gulp.task('dist', ['clean'], function () {
    gulp.start('sass', 'browserify:dist', 'copy', 'replace-html');
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
