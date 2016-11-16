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

## Usage

First create a .js file called 'key.js' and put it in the root of the folder - in there define your timecamp API key like this:
`var timecamp_api_key = "xxxxxxxxxxxxxxx";`
Find your API key in your [account settings](https://www.timecamp.com/people/edit)

## Import format

Create a JSON file of all your projects / tasks / clients as an array of objects, following this format:
```
[{
	"client": "Client Name",
	"name": "INDIVIDUAL PROJECT NAME",
	"tags": "TAG 1, TAG 2, TAG 3",
	"full_name": "PROJECT CODE - PROJECT NAME"
}]
```