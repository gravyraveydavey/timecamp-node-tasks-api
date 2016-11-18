#!/usr/bin/env node
var request = require('request');
var fs = require('fs');
var jsonfile = require('jsonfile')
var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');

require('./key.js');

var url = "https://www.timecamp.com/third_party/api/tasks/format/json/api_token/" + global.timecamp_api_key;

// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}
// Configure the request
var options = {
    url: url,
    method: 'POST',
    headers: headers,
//    form: task	// configure on the fly
}

// Start the request
var imported_array = [];
var clients = [];

program
  .version('0.0.1')
  .option('-i, --input <input_file>', 'Path to .json file')
  .option('-v, --verbose', 'enable console logging')
  .option('-o, --output <output_directory>', 'create and save json of import API responses to this directory')
  .option('-b, --batch', 'batch mode - bypasses input controls!')
  .option('-k, --key', 'your API key')
  .option('-t, --task <task>', 'specify api task (defaults to import) <archive|import|export|delete>')
  .option('-d, --dryrun', 'dry run')
  .parse(process.argv);


switch(program.task){
	case 'archive':
		console.log('archiving all tasks...');
		options.method = 'PUT';
		if (!program.input){
			console.log('Error: please provide a json file using -i [path_to_file]');
		} else {
			var obj = JSON.parse(fs.readFileSync(program.input, 'utf8'));
			if (obj){
				archive_request_loop(obj, 0);
			}
		}
		break;
	case 'export':
		if (!program.output){
			console.log('Error: please provide an output for the json using -o [path_to_file]');
		} else {
			export_tasks();
		}
		break;
	case 'delete':
		delete_tasks();
		break;
	case 'import':
		if (!program.input){
			console.log('Error: please provide a json file using -i [path_to_file]');
		} else {
			var obj = JSON.parse(fs.readFileSync(program.input, 'utf8'));
			if (obj){
				request_loop(obj, 0);
			}
		}
		break;
	default:
		console.log('Error: please provide a task using -t [taskname]');
		break;
}

function get_tasks(){

	console.log('getting tasks...');
	options.url = "https://www.timecamp.com/third_party/api/tasks/format/json/api_token/" + timecamp_api_key;
	options.method = 'GET';
	options.headers['Content-Type'] = 'application/json';

	request(options, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        // prints response to json file
	        current_projects = JSON.parse(response.body);
			console.log('got tasks!');
	        return current_projects;
	    } else {
		    console.log('error getting tasks');
		    console.log('status code: ' + response.statusCode );
			process.exit();
	    }
    });
}

function export_tasks(){
	var current_projects = get_tasks();
	if (current_projects){
		jsonfile.writeFile(program.output + '/current_projects.json', current_projects, function(err){
			if (err){
				console.error(err);
				process.exit();
			} else {
				console.log('successfully exported projects to ' + program.output + '/current_projects.json');
			}
		});
	}
}

function delete_tasks(){

	var current_projects = {}
	if (!program.input){
		current_projects = get_tasks();
		// this fails due to callback timing
	} else {
		current_projects = JSON.parse(fs.readFileSync(program.input, 'utf8'));
	}

	if (current_projects){
		to_be_deleted = []

		var task = {
			name: '000 temp - to be deleted',
			archived: 0
		};
		options.form = task;

		if (program.verbose) console.log('Creating project for nesting... ');
		request(options, function (error, response, body) {
		    if (!error && response.statusCode == 201) {
		        // Print out the response body
				var responseJson = JSON.parse(body);
				if (program.verbose){
					console.log('successfully created parent task.');
					console.log(responseJson);
				}
				var parent = Object.keys(responseJson);
				parent = parent[0];
				// now begin archive loop
				options.method = 'PUT';
				options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
				for (var key in current_projects) {
					if (current_projects.hasOwnProperty(key)) {
						if (current_projects[key].archived == "1"){
							current_projects[key].parent_id = parent
							to_be_deleted.push(current_projects[key]);
							console.log( 'adding ' + current_projects[key].name + ' to delete folder');
						} else {
							//console.log( 'skipping ' + current_projects[key].name);
						}
					}
				}
				console.log('Begining update loop - ' + to_be_deleted.length + ' projects to be deleted');
				update_loop(to_be_deleted, 0);
		    } else {
			    console.log('error importing: ' + task.name );
			    console.log('status code: ' + response.statusCode );
		    }
	    });

	}
}

function update_loop(obj, i){
	if (i < obj.length){

		var task = {
			name: obj[i].name, // name also required (bug)
			task_id: obj[i].task_id, // required
			parent_id: obj[i].parent_id, // what we're updating
			archived: 0 // what we're updating
		};

		options.form = task;

		request(options, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		        // Print out the response body
				console.log('successfully updated: ' + obj[i].name );
		        i++;
		        update_loop(obj, i);
		    } else {
			    console.log('error archiving: ' + obj[i].name );
				console.log(error);
			    console.log('status code: ' + response.statusCode );
		        update_loop(obj, i);
		    }
		});
	}
}


function request_loop(obj, i){
	if (i < obj.length){
		var isClient = false;
		if (obj[i].name == obj[i].client) isClient = true;

		var task = {
			name: obj[i].full_name,
			tags: obj[i].tags,
			archived: 0,
			billable: 1,
			role: 3
		};

		if (obj[i].client in clients && !isClient){
			task.parent_id = clients[obj[i].client];
			task.external_parent_id = obj[i].client;
		}

		options.form = task;

		if (program.batch){
			console.log('BATCH MODE ACTIVE');
			if (program.dryrun){
				console.log('successfully imported: ' + task.name );
				i++;
				request_loop(obj, i);
			} else {
				request(options, function (error, response, body) {
				    if (!error && response.statusCode == 201) {
				        // Print out the response body
						console.log('successfully imported: ' + task.name );
						if (program.output){
							if (program.verbose){
								console.log('response: ');
								console.log(responseJson);
							}
							imported_array.push(responseJson);
							if (isClient) clients[task.name] = responseJson.task_id;
							//if (program.verbose) console.log(clients);

							jsonfile.writeFile(program.output + '/imported_projects.json', imported_array, function(err){
								if (err){
									console.error(err);
								} else {
							        i++;
							        request_loop(obj, i);
								}
							});
						} else {
					        i++;
					        request_loop(obj, i);
						}

				    } else {
					    console.log('error importing: ' + task.name );
					    console.log('status code: ' + response.statusCode );
				        request_loop(obj, i);
				    }
				});
			}


		} else {

			co(function *() {
				var input = yield prompt('import ' + task.name + '? (y/n/i/q - yes/no/inspect/quit) : ');
				input = input.toLowerCase();
				if (input == 'y'){

					if (program.dryrun){
						console.log('successfully imported: ' + task.name );
						i++;
						request_loop(obj, i);
					} else {
						request(options, function (error, response, body) {
						    if (!error && response.statusCode == 201) {
						        // Print out the response body
								console.log('successfully imported: ' + task.name );
								if (program.output){
									var responseJson = body;
									if (program.verbose){
										console.log('response: ');
										console.log(responseJson);
									}
									imported_array.push(responseJson);
									if (isClient) clients[task.name] = responseJson.task_id;
									//if (program.verbose) console.log(clients);

									jsonfile.writeFile(program.output + '/imported_projects.json', imported_array, function(err){
										if (err){
											console.error(err);
										} else {
									        i++;
									        request_loop(obj, i);
										}
									});
								} else {
							        i++;
							        request_loop(obj, i);
								}

						    } else {
							    console.log('error importing: ' + task.name );
							    console.log('status code: ' + response.statusCode );
						        request_loop(obj, i);
						    }
						});
					}
				} else if (input == 'i') {
					console.log(task);
				} else if (input == 'q') {
					process.exit();
				} else {
					console.log('skipped: ' + task.name );
					i++;
				}
		        request_loop(obj, i);
			});

		}
	}
}




function archive_request_loop(obj, i){
	if (i < obj.length){

		if (obj[i].tags !== ""){
	        i++;
	        archive_request_loop(obj, i);
		} else {
			var id = obj[i].task_id;
			var task = {
				task_id: obj[i].task_id,
				name: obj[i].name,
				archived: "1"
			};

			options.form = task;

			if (program.batch){
				console.log('BATCH MODE ACTIVE');

				if (program.dryrun){
					console.log('successfully archived: ' + obj[i].name );
					i++;
			        archive_request_loop(obj, i);
				} else {

					request(options, function (error, response, body) {
					    if (!error && response.statusCode == 200) {
					        // Print out the response body
							console.log('successfully archived: ' + obj[i].name );
					        i++;
					        archive_request_loop(obj, i);
					    } else {
						    console.log('error archiving: ' + obj[i].name );
							console.log(error);
						    console.log('status code: ' + response.statusCode );
					        archive_request_loop(obj, i);
					    }
					});
				}

			} else {

				co(function *() {
					var input = yield prompt('archive ' + obj[i].name + '? (y/n/i/q - yes/no/inspect/quit) : ');
					input = input.toLowerCase();
					if (input == 'y'){

						if (program.dryrun){
							console.log('successfully archived: ' + obj[i].name );
							i++;
					        archive_request_loop(obj, i);
						} else {

							request(options, function (error, response, body) {
							    if (!error && response.statusCode == 200) {
							        // Print out the response body
									console.log('successfully archived: ' + obj[i].name );
							        i++;
							        archive_request_loop(obj, i);
							    } else {
								    console.log('error archiving: ' + obj[i].name );
									console.log(error);
								    console.log('status code: ' + response.statusCode );
							        archive_request_loop(obj, i);
							    }
							});
						}
					} else if (input == 'i') {
						console.log(obj[i]);
						archive_request_loop(obj, i);
					} else if (input == 'q') {
						process.exit();
					} else {
						console.log('skipped: ' + obj[i].name );
						i++;
						archive_request_loop(obj, i);
					}
				});
			}
		}

	}
}


