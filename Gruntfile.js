module.exports = function (grunt) {
    grunt.initConfig({
        connect: {
            options: {
                livereload: 35729,
                //keepalive: true
            },
            livereload: {
                middleware: function (connect) {
                    return [
                        require('connect-livereload')(), // <--- here
                        checkForDownload,
                        mountFolder(connect, '.'),
                        connect.static('.')
                    ];
                }
            }
        },

        watch: {
            options: {
                // Start a live reload server on the default port 35729
                livereload: true
            },
            all: {
                files: ['./**/*.html', './**/*.js'],
                tasks: [],
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    './{,*/}*.html'
                ]
            }
        },
    });

    grunt.registerTask('serve', function serve(){
        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
