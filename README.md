# Timecamp 'Tasks' node.js client

A quick and dirty node.js CLI client for doing some batch operations on your timecamp tasks via the API.

I made this for three main reasons:

1. The dashboard doesn't let you import tasks via a CSV _with_ tags.
2. The dashboard doesn't let you select multiple tasks at once for archive / deletion.
3. When you import tasks via CSV you end up with ton's of 3rd level nested tasks called '0' - bug?

So I essentially wanted to wipe my account clean and start again, scrapping the CSV garbage and importing my clients + projects, properly nested and with appropriate tags such as the project code.

## Input flags

| Flag | Alt            | Description  |
| -----|----------------| -------------|
| -i   | --input [file] | Path to .json file |
| -v   | --verbose 		| enable console logging |
| -o   | --output [dir]	| create and save json of import API responses to this directory |
| -b   | --batch 		| batch mode - bypasses input controls! |
| -k   | --key 			| your API key |
| -t   | --task [task] 	| specify api task [archive/import/export/delete] |
| -d   | --dryrun 		| dry run |

## Functions

| Name | Description |
| ---- | ----------- |
| Export tasks | does get request, dumps tasks to output .json |
| Import tasks | loops through a .json file and imports tasks either one by one or in a batch |
| Archive | loops through a .json and archives tasks either one by one or in a batch |
| Delete | loops through a .json and moves all archived tasks to a single parent temp task so it can be deleted from the projects interface |

## Setup

First create a .js file called 'key.js' and put it in the root of the folder - in there define your timecamp API key like this:
`var timecamp_api_key = "xxxxxxxxxxxxxxx";`
Find your API key in your [account settings](https://www.timecamp.com/people/edit)

Then in the CLI run `npm install`

## Usage

### Export tasks
`timecamp -t export -o path/to/folder/to/save`
It will then create current_projects.json

### Archive tasks
`timecamp -t archive -i path/to/json/file.json`
It will then loop through all the tasks in the json file and update them one by one, prompting you as it goes.
You can archive the task by responding `y`, skip a task with `n`, inspect the task object with `i`, or quit the script with `q`.

You can also run the batch flag to process the entire json file recursively without any prompts. 
`timecamp -t archive -i path/to/json/file.json -b`
Be careful, as this will archive **all** the tasks in the json!

### Delete tasks
This will loop through all your archived projects in the supplied input json file and nest them under one temporary project. Then all you have to do is open your projects page in Timecamp and delete that one project, as it deletes all the subtasks with it.
`timecamp -t delete -i path/to/json/file.json`

### Import tasks
Loops through the input json file, prompting you one by one for each project found.
You can import the task by responding `y`, skip a task with `n`, inspect the task object with `i`, or quit the script with `q`.
If you specify an output directory then the response of the import request will be saved and written to an output json. This is useful if you want to access the task_id and other timecamp data from the newly created task.
`timecamp -t import -i path/to/json/file.json -o path/to/folder/to/save`

#### Import format

Create a JSON file of all your projects / tasks / clients as an array of objects, following this format:
```
[{
	"client": "Client Name",
	"name": "Client Name",
	"tags": "",
	"full_name": "Client Name"
},{
	"client": "Client Name",
	"name": "INDIVIDUAL PROJECT NAME",
	"tags": "TAG 1, TAG 2, TAG 3",
	"full_name": "PROJECT CODE - PROJECT NAME"
}]
```
If the client parameter and the name parameter are the same the import script will recognise this as a client, store the task_id from the import response in memory and use it to nest further tasks referencing this client.