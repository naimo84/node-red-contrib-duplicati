var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');
var watch = require('gulp-watch');

var paths = {
    pages: ['src/*.html'],
    assets: ['src/icons/*.svg'],
    src: 'src',
    dist: 'dist'
};

function copyHtml() {
    return gulp.src(paths.pages, { base: paths.src })    
        .pipe(gulp.dest(paths.dist));
}

gulp.task("copy-html", copyHtml);

gulp.task("copy-assets", function () {
    return gulp.src(paths.assets)
        .pipe(gulp.dest(paths.dist + "/icons"));
});

gulp.task('develop', function (done) {
   watch(paths.pages).pipe(gulp.dest(paths.dist));

    
})

gulp.task("default", gulp.series(
    gulp.parallel('copy-html'),
    gulp.parallel('copy-assets'),
    () => {
        return tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(paths.dist));
    })
);