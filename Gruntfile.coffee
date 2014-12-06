module.exports = (grunt) =>

	grunt.initConfig
		# Works for now, but inefficient - compiles ALL coffee files each time one is saved
		coffee:
			dist:
				files: [{
					expand: true
					flatten: true
					cwd: 'public/modules/src/'
					src: ['*.coffee']
					dest: 'public/modules/dist/'
					rename: (dest, src) ->
  						dest + "/" + src.replace(/\.coffee$/, ".js")
				}]
		compass:
			dist:
				options:
					sassDir: 'public/sass'
					cssDir: 'public/stylesheets'
					environment: 'production'
			dev:
				options:
					sassDir: 'public/sass'
					cssDir: 'public/stylesheets'
		# nodemon: 
	 #        dev: 
	 #            options: 
	 #                file: 'server.js',
	 #                nodeArgs: ['--debug'],
	 #                env: 
	 #                    PORT: '5000'
		watch:
		  sass:
		    files: ["public/sass/*.scss"]
		    tasks: ["compass:dist"]
		  css:
		    files: ["*.css"]
		  coffee:
		  	files: ['public/modules/src/*.coffee']
		  	tasks: ['coffee:dist']
		  livereload:
		    files: ["public/stylesheets/*.css"]
		   	options:
		      livereload: true

	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.loadNpmTasks 'grunt-contrib-compass'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-nodemon'

	# grunt.registerTask 'server', (target) ->
	# 	nodemon = grunt.util.spawn
	# 		cmd: 'grunt'
	#         grunt: true
	#         args: 'nodemon'

	grunt.registerTask "default", ['watch']

