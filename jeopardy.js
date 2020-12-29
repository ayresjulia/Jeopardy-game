const numOfCategories = 6;
const numCluesPerCat = 5;
let categories = [];

/* Get numOfCategories random category from API.*/

async function getCategoryIds() {
	let response = await axios.get('https://jservice.io/api/categories/?count=60');
	let catIds = response.data.map(c => c.id);
	return _.sampleSize(catIds, numOfCategories);
}

/* Return object with data about a category: */

async function getCategory(catId) {
	const response = await axios.get(`https://jservice.io/api/category?id=${catId}`);
	let cat = response.data;
	let allClues = cat.clues;
	let randomClues = _.sampleSize(allClues, numCluesPerCat);
	let clues = randomClues.map(c => ({
		question: c.question,
		answer: c.answer,
		showing: null
	}));

	return { title: cat.title, clues };
}

/* Fill the HTML table#jeopardy with the categories & cells for questions. */

async function fillTable() {
	$('#jeopardy thead').empty();
	//$('#btn').text('Restart');
	let $tr = $('<tr>');
	for (let catIdx = 0; catIdx < numOfCategories; catIdx++) {
		$tr.append($('<th>').text(categories[catIdx].title));
	}
	$('#jeopardy thead').append($tr);

	$('#jeopardy tbody').empty();
	for (let clueIdx = 0; clueIdx < numCluesPerCat; clueIdx++) {
		let $tr = $('<tr>');
		for (let catIdx = 0; catIdx < numOfCategories; catIdx++) {
			$tr.append($('<td>').attr('id', `${catIdx}-${clueIdx}`).html('<i class="fas fa-question-circle"></i>'));
		}
		$('#jeopardy tbody').append($tr);
	}
}

/* Handle clicking on a clue: show the question or answer.*/

function handleClick(e) {
	let id = e.target.id;
	let [catId, clueId] = id.split('-');
	let clue = categories[catId].clues[clueId];
	let msg;

	if (!clue.showing) {
		msg = clue.question;
		clue.showing = 'question';
	} else if (clue.showing === 'question') {
		msg = clue.answer;
		clue.showing = 'answer';

		$(`#${catId}-${clueId}`).css('background-color', '#28a200');
		$('h1').remove();
		$('button').remove();
		$('.row').append('<img id="trebek" src="https://media2.giphy.com/media/dBs8TvgxZxI2VqLyo4/source.gif">');
		setTimeout(function () {
			$('#trebek').remove();
			$('.row').append('<h1 id="title">Jeopardy!</h1>');
			$('.row').append('<button id="btn">Restart</button>');
		}, 1800);
	} else {
		// already showing answer; ignore
		return;
	}

	// Update text of cell
	$(`#${catId}-${clueId}`).html(msg);
}

/* Start game: */

async function setupAndStart() {
	let catIds = await getCategoryIds();
	categories = [];

	for (let catId of catIds) {
		categories.push(await getCategory(catId));
	}
	$('#btn').on('click', function () {
		$('#btn').text('Loading...');
		$('#loadingImg').append('<img id="image" src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/35771931234507.564a1d2403b3a.gif"/>');
		setTimeout(fillTable, 3000);
		setTimeout(function () {
			$('#loadingImg').remove();
			$('#btn').text('Restart');
			$('#jeopardy').css('background-color', 'white');
		}, 2800);
	});
}

/** On click of start / restart button, set up game. */

$('#btn').on('click', setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
	setupAndStart();
	$('#jeopardy').on('click', 'td', handleClick);
});
