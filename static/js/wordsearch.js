"use strict";

let wordlist, grid;
let wordsAdded;
let wordTable, wordBank;

let answers = {
	/*
	format:
	
	word: {
		row: <num>,
		col: <num>,
		reverse: <false or true>,
		direction: [
			<deltaRow>, <deltaCol>
		]
	},
	...
	*/
};

/*
plan for validation:
limit user to one word selection at a time
maintain another array of correct selections (aethetic thing)

check from top left:
	should never encounter the middle of a selection first
if selected cell encountered:
	look in all eight directions
	if a selected cell is found:
		find appropiate direction
		recursive:
			go to next cell based on direction
			if no more cell in the direction:
				validate all letters encountered up to the point

important notes:
	will not check for invalid selections, will just use first valid subpattern
*/

const BLANK_CHAR = "-";
const GRID_LEN = 10;
const DIRECTIONS = {
	NORTH: [0, -1],
	NORTHEAST: [1, -1],
	EAST: [1, 0],
	SOUTHEAST: [1, 1],
	SOUTH: [0, 1],
	SOUTHWEST: [-1, 1],
	WEST: [-1, 0],
	NORTHWEST: [-1, -1]
};
Object.freeze(DIRECTIONS);
for (let d in DIRECTIONS) Object.freeze(DIRECTIONS[d]);	//effectively an enum now
const DIRECTIONS_LEN = 8;

function constructList(s, num, min, max) {
    let temp = s.split(" ");
    //console.log(list);
    for (let i in temp){
	//console.log(list[i]);
	if(wordlist.length < num && temp[i].length <= max && temp[i].length >=min && wordlist.indexOf(temp[i]) == -1){
	    wordlist.push(temp[i]);
	}
    }
    console.log(wordlist);
}

//appends DOM elem to gameContainer
function appendMain(elem) {
	let gameDiv = document.getElementById("gameContainer");
	gameDiv.appendChild(elem);
}

//elem is a DOM object. removes the elem if it exists
function removeElem(elem) {
	let gameDiv = document.getElementById("gameContainer");
	if (elem !== null) {
		gameDiv.removeChild(elem);
	}
}

//create the html word table
function createTable() {
	wordTable = document.createElement("table");
	wordTable.id = "wordTable";
	let body = document.createElement("tbody");
	let row, data;
	
	for (let x of grid) {
		row = document.createElement("tr");
		
		for (let y of x) {
			data = document.createElement("td");
			data.className = "letter";
			data.innerHTML = y;
			
			data.addEventListener("click", e => {
				let elem = e.target;
				
				if (elem.classList.contains("letter")) {
					elem.classList.remove("letter");
					elem.classList.add("selected");
				}
				else if (elem.classList.contains("selected")) {
					elem.classList.remove("selected");
					elem.classList.add("letter");
				}
			});
			
			row.appendChild(data);
		}
		
		body.appendChild(row);
	}
	
	wordTable.appendChild(body);
	appendMain(wordTable);
}

//create the word bank
function createBank() {
	wordBank = document.createElement("ul");
	wordBank.id = "wordBank";
	let item;
	
	for (let word of Object.keys(answers)) {
		item = document.createElement("li");
		item.className = "word";
		
		if (answers[word]["reverse"]) {
			item.innerHTML = reverse(word);
		}
		else {
			item.innerHTML = word;
		}
		
		wordBank.appendChild(item);
	}
	
	appendMain(wordBank);
}

function checkSelection() {
	//holds all selected cells
	/*
	for each elem:
	
	{
		elem: <DOM element>,
		row: <num>,
		col: <num>
	}
	*/
	let selected = [];
	let elem;
	let body = wordTable.children.item(0);	//everything is in a <tbody>
	
	for (let row = 0; row < body.children.length; row++) {
		for (let col = 0; col < body.children.item(row).children.length; col++) {
			elem = body.children.item(row).children.item(col);
			if (elem.classList.contains("selected")) {
				selected.push({
					elem,
					row,
					col
				});
			}
		}
	}
	
	console.log(selected);
}

function init() {
	wordlist = [];
	grid = [];
	wordsAdded = [];
	
	for (let y = 0; y < GRID_LEN; y++) {
		grid.push([]);
		for (let x = 0; x < GRID_LEN; x++) {
			grid[y].push(BLANK_CHAR);
		}
		
	}
}

//ajax with promise
function ajaxP(settings) {
	return new Promise((resolve, reject) => {
		$.ajax(settings).done(resolve).fail(reject);
	});
}

function start() {
	ajaxP({
		url: 'http://www.randomtext.me/api/gibberish/p-1/100',
		type: 'GET'
	})
	.then( data => {			//we don't plan on using the status
		console.log("constructing word list");
		let randomwords = data["text_out"].replace("<p>","").replace("</p>","").toUpperCase();
		constructList(randomwords,10,4,8);
	})
	.then(() => {
		console.log("filling word grid");
		addWords();
		fillRandom();
	})
	.then(() => {
		console.log("printing answers");
		console.log(answers);
	})
	.then(() => {
		console.log("printing grid");
		printGrid(grid);
	})
	.then(() => {			//remove please wait
		console.log("removing wait notification");
		let waitMsg = document.getElementById("wait");
		removeElem(waitMsg);
	})
	.then(() => {			//construct html table
		console.log("generating html table");
		createTable();
	})
	.then(() => {
		console.log("creating word bank");
		createBank();
	})
	.then(() => {
		console.log("temp");
		console.log(wordTable);
	})
	.then(() => {
		console.log("adding validation button");
		let validate = document.createElement("div");
		validate.className = "button";
		validate.innerHTML = "Check";
		validate.addEventListener("click", e => {
			checkSelection();
		});
		appendMain(validate);
	})
	
	//add a "please wait notification"
	let waitMsg = document.createElement("h4");
	waitMsg.innerHTML = "Please wait";
	waitMsg.id = "wait";
	appendMain(waitMsg);
}

function reverse(s) {
	return s.split("").reverse().join("");
}

function printGrid(grid) {
	let temp;
	for (let x of grid) {
		temp = "";
		for (let y of x) {
			temp += y + " ";
		}
		console.log(temp);
	}
}

function fillRandom() {
	let lo = "A".charCodeAt(0);
	let hi = "Z".charCodeAt(0)+1;
	
	for (let x = 0; x < GRID_LEN; x++) {
		for (let y = 0; y < GRID_LEN; y++) {
			if (grid[x][y] == BLANK_CHAR) {
				grid[x][y] = String.fromCharCode( Math.floor(Math.random() * (hi-lo) + lo));
			}
		}
	}
}

function addWords() {
	let row, col;
	for (let word of wordlist) {
		row = Math.floor(Math.random() * DIRECTIONS_LEN);
		col = Math.floor(Math.random() * DIRECTIONS_LEN);
		
		addSingleWord(word, row, col);
	}
	
	printGrid(grid);
}

function addSingleWord(word, row, col){
	let counter;
	let tRow, tCol;
	let delta;
	
	for (let turn = 0; turn < 2; word = reverse(word), turn++) {	//forward and reverse
		for (let x = 0; x < 3; x++) {
			//random direction
			delta = DIRECTIONS[ Object.keys(DIRECTIONS)[ Math.floor(Math.random() * DIRECTIONS_LEN)] ];
			tRow = row;
			tCol = col;
			
			
			//first, check if we can place it
			for (counter = 0; counter < word.length; counter++) {
				//if out of bounds
				if (tRow < 0 || tRow >= grid.length || tCol < 0 || tCol >= grid[0].length) break;
				
				//if word can't overlap
				if (grid[tRow][tCol] !== BLANK_CHAR && grid[tRow][tCol] !== word[counter]) break;
				
				tRow += delta[0];
				tCol += delta[1];
			}
			
			//try a new direction
			if (counter != word.length) break;
			tRow = row;
			tCol = col;
			
			//now actually place it
			for (counter = 0; counter < word.length; counter++) {
				grid[tRow][tCol] = word[counter];
					
				tRow += delta[0];
				tCol += delta[1];
			}
			
			//add to answer key
			answers[word] = {
				row,
				col,
				reverse: turn == 1,
				direction: delta
			};
			
			wordsAdded.push(word);
			return true;
		}
	}
	
	return false;
}


init();
start();

