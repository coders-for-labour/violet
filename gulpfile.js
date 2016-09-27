var gulp = require('gulp');
var less = require('gulp-less');
var pug = require('gulp-jade');
var minifycss = require('gulp-clean-css');
var eslint = require('gulp-eslint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var livereload = require('gulp-livereload');
var bower = require('gulp-bower');
var bowerfiles = require('main-bower-files');
var typescript = require('gulp-typescript');
var tscConfig = require('./tsconfig.json');
const bump = require('gulp-bump');
// var tsProject = typescript.createProject('tsconfig.json');

/**
 *
 */
gulp.task('images-lite', function() {
  return gulp.src('app/lite/static/images/**/*.*')
    .pipe(gulp.dest('deploy/lite/static/images'))
    .pipe(livereload({auto: false}));
});
gulp.task('images-full', function() {
  return gulp.src('app/static/images/**/*.*')
    .pipe(gulp.dest('deploy/static/images'))
    .pipe(livereload({auto: false}));
});
gulp.task('server-images', function() {
  return gulp.src('app/server/images/**/*.*')
    .pipe(gulp.dest('deploy/images'))
    .pipe(livereload({auto: false}));
});
gulp.task('images', function() {
  return gulp.start(['images-full', 'images-lite', 'server-images']);
});

/**
 *
 */
gulp.task('app-scripts', function() {
  return gulp.src(['app/server/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulp.dest('deploy'));
});

/**
 *
 */
gulp.task('scripts', function() {
  return gulp.src('app/static/scripts/**/*.js')
    .pipe(concat('app.javascript.js'))
    .pipe(gulp.dest('deploy/static/scripts'))
    .pipe(rename('app.javascript.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('deploy/static/scripts'))
    .pipe(livereload({auto: false}));
});

gulp.task('type-scripts', function() {
  return gulp.src(['app/static/scripts/**/*.ts'])
    .pipe(typescript(tscConfig.compilerOptions))
    // .pipe(concat('app.js'))
    .pipe(gulp.dest('deploy/static/scripts'))
    // .pipe(rename('app.min.js'))
    // .pipe(uglify())
    // .pipe(gulp.dest('deploy/static/scripts'))
    .pipe(livereload({auto: false}));
});

/**
 *
 */
gulp.task('views-pug', function() {
  return gulp.src(['app/static/*.pug', 'app/static/views/**/*.pug'], {base: 'app/static/'})
      .pipe(pug())
      .pipe(gulp.dest('deploy/static'))
      .pipe(livereload({auto: false}));
});

gulp.task('views-pug-lite', function() {
  return gulp.src(['app/lite/views/**/*.pug'], {base: 'app/lite/views/'})
      // .pipe(pug())
      .pipe(gulp.dest('deploy/lite/views'))
      .pipe(livereload({auto: false}));
});

gulp.task('views-html', function() {
  return gulp.src(['app/static/*.html', 'app/static/views/**/*.html'])
      .pipe(gulp.dest('deploy/static'))
      .pipe(livereload({auto: false}));
});

gulp.task('views', function() {
  return gulp.start('views-pug', 'views-pug-lite', 'views-html');
});

/**
 *
 */
gulp.task('styles-app', function() {
  return gulp.src(['app/static/styles/**/*.less'])
    .pipe(less())
    .pipe(concat('main.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('deploy/static/styles'))
    .pipe(livereload({auto: false}));
});
gulp.task('styles', function() {
  return gulp.start('styles-app');
});

/**
 *
 */
gulp.task('mongroup', function() {
  return gulp.src('app/server/mongroup.*')
      .pipe(gulp.dest('deploy'));
});
gulp.task('json', function() {
  return gulp.src('app/server/*.json')
      .pipe(gulp.dest('deploy'));
});
gulp.task('ng', function() {
  return gulp.src([
    'node_modules/core-js/client/shim.min.js',
    'node_modules/core-js/client/shim.min.js.map',
    'node_modules/zone.js/dist/zone.js',
    'node_modules/reflect-metadata/Reflect.js',
    'node_modules/reflect-metadata/Reflect.js.map',
    'node_modules/systemjs/dist/system.src.js',
    'node_modules/rxjs/**/*',
    'node_modules/angular2-in-memory-web-api/*.js',
    'node_modules/@angular/core/bundles/core.umd.js',
    'node_modules/@angular/common/bundles/common.umd.js',
    'node_modules/@angular/compiler/bundles/compiler.umd.js',
    'node_modules/@angular/forms/bundles/forms.umd.js',
    'node_modules/@angular/http/bundles/http.umd.js',
    'node_modules/@angular/router/bundles/router.umd.js',
    'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
    'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js'
  ], {base: 'node_modules'}).pipe(gulp.dest('deploy/static/modules'));
});

gulp.task('resources', function() {
  return gulp.start(['mongroup', 'json', 'ng']);
});

/**
 *
 */
gulp.task('watch', ['clean'], function() {
  gulp.start('app-scripts', 'scripts', 'type-scripts', 'views', 'styles', 'resources', 'images', 'bower-files');
  gulp.start('start-watch');
});

gulp.task('start-watch', function() {
  livereload.listen();

  // Watch Images
  gulp.watch('app/static/images/**/*', ['images-full']);
  gulp.watch('app/lite/static/images/**/*', ['images-lite']);
  // Watch Styles
  gulp.watch('app/static/styles/**/*.less', ['styles-app']);
  // Watch Scripts
  gulp.watch('app/static/scripts/**/*.ts', ['type-scripts']);
  gulp.watch('app/static/scripts/**/*.js', ['scripts']);
  gulp.watch(['app/**/*.js', '!app/static/**/*.js'], ['app-scripts']);
  // Watch Views files
  gulp.watch('app/static/**/*.pug', ['views-pug']);
  gulp.watch('app/static/**/*.html', ['views-html']);
  // Watch Resources
  gulp.watch('app/server/**/*.json', ['json']);
});

/**
 *
 */
gulp.task('bower-clean', function() {
  return gulp.src(['app/static/components/*'])
    .pipe(clean());
});

/**
 *
 */
gulp.task('bower', ['bower-clean'], function() {
  return bower()
    .pipe(gulp.dest('app/static/components'));
});

/**
 *
 */
gulp.task('bower-update', function() {
  return bower()
    .pipe(gulp.dest('app/static/components'));
});

/**
 *
 */
gulp.task('bower-files', function() {
  return gulp.src(bowerfiles(), {base: 'app/static/components'})
    .pipe(gulp.dest('deploy/static/components'));
});

/**
 *
 */
gulp.task('clean', function() {
  return gulp.src(['deploy/*', '!deploy/components/'], {read: false})
    .pipe(clean());
});

/**
 *
 */
gulp.task('build', ['clean'], function() {
  return gulp.start('app-scripts', 'type-scripts', 'scripts', 'views', 'styles-app', 'bower-files', 'resources', 'images');
});

gulp.task('bump-prerelease', function() {
  return gulp.src(['./bower.json', './package.json', './README.md'])
    .pipe(bump({type: 'prerelease'}))
    .pipe(gulp.dest('./'));
});
