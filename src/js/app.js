var periods = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var minutes = [
	'00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
	'11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
	'21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
	'31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
	'41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
	'51', '52', '53', '54', '55', '56', '57', '58', '59' ];
var am = ['am', 'pm'];

var workersData = [
	{
		firstName: 'John',
		lastName: 'Doe',
		job: 'Job name',
		hours: [
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': true },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': false },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': false },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': false },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': false },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': false },
			{
				'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
				'out': {'hour': 4, 'min': 0, 'ampm': 'pm'},
				'off': true }
		]
	}
];

var options = {
	'useSingleName' : {'value' : false},
	'largerFont' : {'value' : false},
	'highlight' : {'color' : 'f5f5f5'}
};

var rangeData = [
	{
		name: 'Full Day',
		target: {
			start: {hour: 12, min: 0, ampm: 'am'},
			end: {hour: 11, min: 59, ampm: 'pm'}
		}
	}
];

var taskData = [
	{
		name: 'Task',
		range: rangeData[0],
		assignedWorkers: []
	}
];

var queriesData = [
	{
		target: {
			start: rangeData[0].target.start,
			end: rangeData[0].target.end,
		},
		targetJobs: ['Some job'],
		selectedIndex: 0
	}
];

var scheduleData = [
	{
		name: 'My Schedule',
		scheduleOptions: options,
		ranges: rangeData,
		tasks: taskData,
		workers: workersData,
		queries: queriesData
	}
];

// Schedule cell colors and corresponding classes
var cellColors = {
	'Green' : { 'eClass' : 'success', 'bgClass' : 'bg-success' },
	'Blue' : { 'eClass' : 'info', 'bgClass' : 'bg-info' },
	'Yellow' : { 'eClass' : 'warning', 'bgClass' : 'bg-warning' },
	'Red' : { 'eClass' : 'danger', 'bgClass' : 'bg-danger' }
};

/**
 * Returns time object with observable attributes
 * @constructor
 * @param {object} day - Holds parameters for hour, minute, am
 */
var KoEditableTime = function(day) {
	return {
		'hour': ko.observable(day.hour),
		'min': ko.observable(day.min),
		'ampm': ko.observable(day.ampm)
	}
};

/**
 * Returns worker Hours object with observable attributes
 * @constructor
 * @param {object} data - Holds parameters for off, color, setColor, in, out
 */
var Hours = function(data) {
	return {
		'off' : ko.observable(data.off),
		'toggleOff' : function() {
			(this.off()) ? this.off(false) : this.off(true);
		},
		'color' : ko.observable(data.color || 'none'),
		'setColor' : function(color) {
			if (this.color() === color) {
				this.color('none');
			} else {
				this.color(color);
			}
		},
		'in' : new KoEditableTime(data.in),
		'out' : new KoEditableTime(data.out)
	}
};

var Worker = function(periods, data) {
	var self = this;

	// Worker Name
	self.firstName = ko.observable(data.firstName);
	self.lastName = ko.observable(data.lastName);

	// Worker Job
	self.job = ko.observable(data.job);

	// Worker schedule
	self.hours = ko.observableArray();
	for (let i = 0; i < periods.length; i++) {
		self.hours()[i] = ko.observable(new Hours(data.hours[i]));
	}
	self.totalTime = ko.computed(function() {
		let tt = 0;
		self.hours().forEach(function(day) {
			if (!day().off()) {
				tt += calculateShiftHours(day().in, day().out);
			}
		});
		return tt;
	}, this);
};

var Range = function(data) {
	var self = this;

	self.name = ko.observable(data.name);

	self.target = {
		'start' : new KoEditableTime(data.target.start),
		'end' : new KoEditableTime(data.target.end)
	};
};

var Task = function(data, schedule) {
	var self = this;
	let workers = schedule.workers;

	self.name = ko.observable(data.name);

	// Time range when task is needed
	self.range = ko.observable(new Range (data.range));

	// Workers task is assigned to throughout the week
	self.assignedWorkers = [];
	for (let i = 0; i < periods.length; i++) {
		let assignedWorker =
			(data.assignedWorkers[i]) ? data.assignedWorkers[i] : undefined;
		self.assignedWorkers.push(ko.observable(assignedWorker));
	}

	// Available workers to potentially assign task
	self.availableWorkers = ko.observableArray([]);

	// Calculate available workers on day
	self.findWorkers = function(day) {
		return ko.computed(function() {
			// Hold worketrs matched on this day
			let available = ['None'];
			// Cycle through each worker to tally up
			workers().forEach(function(worker) {
				// Find if worker is off today or is working
				let workerHours = worker().hours()[day]();
				let isWorking = !workerHours.off();
				if (isWorking && isInRange(workerHours, self.range().target)) {
					let name = worker().firstName() +
						((schedule.scheduleOptions.useSingleName.value()) ?
						'' : ' ' + worker().lastName());
					available.push(name);
				}
			});
			return available;
		}, this);
	};

	// Add a single day's available workers to array
	self.tallyDay = function(day) {
		self.availableWorkers.push(self.findWorkers(day));
	};

	// Add availble workers for each day
	for (let i = 0; i < periods.length; i++) {
		self.tallyDay(i);
	}

};

var Schedule = function(periods, data) {
	var self = this;

	// Schedule name
	self.name = ko.observable(data.name);

	// Array of different table views
	self.views = ['Schedule', 'Tasks', 'Workers', 'Ranges', 'Right Now',
		'Options'];

	// Options
	self.scheduleOptions = {
		'useSingleName' : {
			'text' : 'Use single name field only',
			'value' : ko.observable(data.scheduleOptions.useSingleName.value),
			'function' : function() {
				// Toggle value
				(this.value()) ? this.value(false) : this.value(true);
			}
		},
		'largerFont' : {
			'text' : 'Use larger text size',
			'value' : ko.observable(data.scheduleOptions.largerFont.value),
			'function' : function(data, e) {
				// Toggle value
				(this.value()) ? this.value(false) : this.value(true);
			}
		},
		'highlight' : {
			'color' : ko.observable(data.scheduleOptions.highlight.color),
			'presets' : ['fff7c4', 'e9ffa6', 'a3ffed', 'ffdbfe'],
			'fontColor' : function() {
				// Check luminance of background color and set text
				// color to contrast accordingly. Relevant code from:
				// https://stackoverflow.com/a/35970186/6867508
				let hex = this.color(),
					r = parseInt(hex.slice(0, 2), 16),
					g = parseInt(hex.slice(2, 4), 16),
					b = parseInt(hex.slice(4, 6), 16),
					luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b);
				return (luminance > 186) ? '#000' : '#fff';
			},
			'setPreset' : function(data, evt) {
				this.color(data);
				let parent = evt.currentTarget.parentElement;
				let picker = parent.querySelector('input');
				picker.setAttribute('style', 'background-color: #' + data);
			},
			'instantiate' : function(el) {
				let input = document.createElement('INPUT');
				let picker = new jscolor(input);
				picker.fromString(this.color());
				input.setAttribute("data-bind",
					"value: scheduleOptions.highlight.color");
				el.appendChild(input);
			}
		}
	};

	// Run any setting functions onload, if property warrants
	self.loadOptions = function(context) {
		for (let prop in self.scheduleOptions) {
			let option = self.scheduleOptions[prop];
			if (option.hasOwnProperty('init')) {
				option.init(context);
			}
		}
	};

	// Hold scroll position of table elements
	self.scrollEdge = { left: ko.observable(0), right : ko.observable(0) };
	self.scrollPos = { left : ko.observable(0), right : ko.observable(0) };
	self.needsScrolling = ko.observable(false);

	// Update table position variables when scrolling
	self.updateScrollPos = function(data, el) {
		// Find element with scroll-control class
		let scrollEl =
			el.closest('.schedule').getElementsByClassName('scroll-control')[0];
		// Find which table is active
		let i = self.views.indexOf(self.selected());
		let table = scrollEl.getElementsByClassName('table')[i];
		// Get positions of table and table's container
		let outerRect = scrollEl.getBoundingClientRect();
		let tableRect = table.getBoundingClientRect();

		// Set scroll positions
		self.scrollEdge.left(outerRect.left);
		self.scrollEdge.right(outerRect.right);
		self.scrollPos.left(tableRect.left);
		self.scrollPos.right(tableRect.right);
		(tableRect.width > outerRect.width) ?
			self.needsScrolling(true) : self.needsScrolling(false);
	};

	// Add shadow class based on table scroll position
	self.addShadowStyle = function() {
		let left = self.scrollPos.left(),
			// Account for positions with decimal(?)
			right = self.scrollPos.right() - 1,
			edgeL = self.scrollEdge.left(),
			edgeR = self.scrollEdge.right();

		if (self.needsScrolling()) {
			if (left === edgeL) return 'right-shadow';
			if (right <= edgeR) return 'left-shadow';
			if (left < edgeL && right > edgeR) return 'both-shadows';
		}
	};

	// Adds highlighting to appropriate .cell elements
	self.addHighlighting = function(data, item) {
		let target = item.target;
		let cellGroup = '.table-schedule tbody .cell:not(button),' +
				'.table-tasks tbody .cell:not(button)';
		let closestCell = item.target.closest(cellGroup);

		if (closestCell !== null) {
			// Remove old styling
			let otherCells = $(closestCell).closest('tbody').find('.cell');
			otherCells.removeAttr('style');

			// Find row and column to highlight
			let row =
				$(closestCell).closest('tr').not('.manage-worker').find('td');
			let col = $(closestCell).closest('tbody')
				.find('tr:not(:last) > td:nth-child(' +
					(closestCell.cellIndex + 1) + ')')
				.not('.manage-worker');

			// Apply styling
			let color = self.scheduleOptions.highlight.color();
			let text = self.scheduleOptions.highlight.fontColor();
			let style = 'background-color: #' + color + '; color: ' + text;
			$(row).attr('style', style);
			$(col).attr('style', style);
		}
		else {
			// Remove old styling if mouse has left
			$('.cell').removeAttr('style');
		}
	};

	// Keep track of the schedule's different table views
	self.selected = ko.observable(self.views[0]);
	self.select = function(data) {
		self.selected(data);
	};

	// Array of named ranges of time
	self.ranges = ko.observableArray([]);
	// Load in ranges from data
	data.ranges.forEach(function(range) {
		self.ranges.push( ko.observable(new Range(range)) );
	});

	// Push new range to ranges array
	self.addRange = function() {
		self.ranges.push(ko.observable(new Range(rangeData[0])) );
	};

	// Default schedule period length and heading titles
	self.periodNames = ko.observableArray();
	for (let i = 0; i < periods.length; i++) {
		self.periodNames()[i] = ko.observable(periods[i]);
	}

	// Define workers observable array and load workers from raw data
	self.workers = ko.observableArray([]);
	data.workers.forEach(function(workerData) {
		self.workers.push(ko.observable(new Worker(periods, workerData)));
	});

	// Select worker for worker profile
	self.selectedWorker = ko.observable(self.workers()[0]);

	// Copy and paste functions for worker hours
	self.clipboard = ko.observable('');
	self.copyHours = function(data) {
		self.clipboard(ko.toJS(data));
	};
	self.pasteHours = function(context, index) {
		let workersIndex = self.workers().indexOf(context.$rawData);
		// If workersIndex is not found, then paste hours for selectedWorker
		if (workersIndex === -1) {
			self.selectedWorker().hours()[index()](
				new Hours(self.clipboard())
				);
			return;
		}
		self.workers()[workersIndex]().hours()[index()](
			new Hours(self.clipboard())
		);
	};

	// Set worker hours to be a given range
	self.pasteRange = function(range, hours) {
		// Flatten range data to update observables with
		let rangeJS = {
			in: ko.toJS(range.target.start),
			out: ko.toJS(range.target.end)
		};
		// Cycle through range times and time components and then update hours
		Object.keys(rangeJS).forEach(function(time) {
			Object.keys(rangeJS[time]).forEach(function(key) {
				hours[time][key](rangeJS[time][key]);
			});
		});
		// Remove off
		hours.off(false);
	};

	/**
	 * Pushes new object to given array for this schedule
	 * @param {string} listName - name of array to insert item into
	 * @param {object} data - observable object data (optional)
	 * @param {object} index - observable index of current data (optional)
	 * @param {integer} newIndex - index of desired insertion,
	 *								  relative to index parameter (optional)
	 */
	self.addItem = function(listName, data, index, newIndex) {
		// Does object need to be inserted at the end?
		let isInside = typeof newIndex === 'number';

		// Default parameter to pass to constructor uses passed data
		let param = ko.toJS(data);
		// If object is to added to the end, use the default data
		// for the appropriate constructor type
		if (!isInside) {
			switch (listName) {
				case 'workers' : param = workersData[0]; break;
				case 'tasks' : param = taskData[0]; break;
				case 'ranges' : param = rangeData[0]; break;
				default : break;
			}
		}

		// Create new object to inject into target list
		let newObj;
		switch (listName) {
			case 'workers' : newObj = new Worker(periods, param); break;
			case 'tasks' : newObj = new Task(param, self); break;
			case 'ranges' : newObj = new Range(param); break;
		}

		// Insert object
		let i = (isInside) ? index() + newIndex : self[listName]().length;
		self[listName].splice(i, 0, ko.observable(newObj));
	};

	/**
	 * Moves given object to given relative index position
	 * @param {string} listName - name of array to insert item into
	 * @param {object} data - current observable object
	 * @param {object} index - observable index of current data
	 * @param {integer} newIndex - desired index, relative to current index
	 */
	self.moveItem = function(listName, data, index, newIndex) {
		let i = index();
		let j = i + newIndex;

		// Make sure requested move is within bounds
		if (j >= 0 && j < self[listName]().length) {
			// Store target index data in temp variable
			let temp = self[listName]()[j]();

			// Assign current data to target index
			self[listName]()[j](data());

			// Assign temp data to old index position
			self[listName]()[i](temp);

			// Remove Tooltip
			$('.tooltip').remove();
		}
	};

	// Deletes observable object from given array
	self.deleteItem = function(listName, index) {
		let i = index();
		self[listName].splice(i, 1);
	};

	// Define and load tasks
	self.tasks = ko.observableArray([]);
	data.tasks.forEach(function(task) {
		self.tasks.push(ko.observable(new Task(task, self)));
	});

	// Push new task to tasks array
	self.addTask = function() {
		self.tasks.push(new Task(taskData[0], self) );
	};

	// Define array to hold queries and load queries from raw data
	self.queries = ko.observableArray([]);
	data.queries.forEach(function(queryData) {
		self.queries.push( new Query(self.workers, queryData, self.ranges) );
	});

	// Push new Query to queries array
	self.addQuery = function() {
		self.queries.push( new Query(self.workers, queriesData[0], self.ranges) );
	};

	self.hasQueries = ko.computed(function() {
		if (self.queries().length > 0) return true;
		return false;
	});

	// Delete query from queries array
	self.deleteQuery = function(index) {
		self.queries.splice(index, 1)
	};

	/**
	 * Sort workers array by given property, in given direction
	 * @param {object} prop - Either an observable property or an object
	 *   containing the desired observable property to sort by.
	 * @param {integer} direction - Either 1 or -1, to sort in reverse.
	 */
	self.sortBy = function(prop, direction) {
		return function() {
			self.workers.sort(function(a, b) {
				// Set a and b to appropraite observable value to sort by
				a = a()[prop]();
				b = b()[prop]();
				return a == b ? 0 : (a < b ? -direction : direction);
			});
		};
	};

	// Keep track of distinct jobs entered
	self.jobs = ko.observableArray([]);

	// Update jobs array to only keep jobs in use by workers and queries
	self.scanJobs = ko.computed(function() {
		// Add new jobs to jobs array as they appear
		self.workers().forEach(function(worker) {
			let isUnique = true;
			for (let i = 0; i < self.jobs().length; i++) {
				if (worker().job() === self.jobs()[i]) {
					isUnique = false;
					break;
				}
			}
			if (isUnique) {
				self.jobs.push(worker().job());
			}
		});
		// Remove unused jobs from array
		for (let i = 0; i < self.jobs().length; i++) {
			let listedJob = self.jobs()[i];
			let isNotInUse = true;
			// First, make sure job is not being used in a query
			queryLoop: for (let j = 0; j < self.queries().length; j++) {
				let targetJobs = self.queries()[j].targetJobs();
				targetJobLoop: for (let k = 0; k < targetJobs.length; k++) {
					if (listedJob === targetJobs[k]()) {
						isNotInUse = false;
						break queryLoop;
					}
				}
			}
			// Then, make sure job does not belong to any worker
			if (isNotInUse) {
				for (let j = 0; j < self.workers().length; j++) {
					if (listedJob === self.workers()[j]().job()) {
						isNotInUse = false;
						break;
					}
				}
			}
			// If listed job was not found, remove from jobs array
			if (isNotInUse) {
				self.jobs.splice(i, 1);
			}
		}
	}, this);
};

/**
 * Returns Query object that takes an array of workers, and tallies matches
 * between the worker's schedules and certain observable targets.
 * @constructor
 * @param {object} workers - observable array of worker objects
 */
var Query = function(workers, targetData, ranges) {
	var self = this;

	// Array of each day's query tallies
	self.tallies = ko.observableArray([]);

	// Targets job for query to match
	self.targetJobs = ko.observableArray([]);

	// Load target jobs array for query
	targetData.targetJobs.forEach(function(job) {
		self.targetJobs.push(ko.observable(job));
	});

	// Holds current range data from range array
	self.selectedRange = ko.observable(ranges()[targetData.selectedIndex]());

	// Holds index in ranges array of the selected range
	self.selectedIndex = ko.computed(function() {
		for (let i = 0; i < ranges().length; i++) {
			if (ranges()[i]() === self.selectedRange()) {
				return i;
			}
		}
		return -1;
	}, this);

	// Add new job to job target array
	self.addJob = function(value) {
		self.targetJobs.push(ko.observable('job'));
	};

	// Calculate result of query
	self.result = function(day) {
		return ko.computed(function() {
			// How many workers can be matched on this day
			let tally = 0;
			// Cycle through each worker to tally up
			workers().forEach(function(worker) {
				// Find if worker is off today or is working
				let workerHours = worker().hours()[day]();
				let isWorking = !workerHours.off();
				if (isWorking && isInRange(workerHours, self.selectedRange().target)) {
					// Find if job matches
					for (let i = 0; i < self.targetJobs().length; i++) {
						if (worker().job() === self.targetJobs()[i]()) {
							tally++;
							break;
						}
					}
				}
			});
			return tally;
		}, this);
	};

	// Add a single tally to tallies array
	self.addTallies = function(day) {
		self.tallies.push(self.result(day));
	};

	// Add tally for each day
	for (let i = 0; i < periods.length; i++) {
		self.addTallies(i);
	}
};

/**
 * Returns a true if worker hours overlap with target times
 * @param {object} workerHours - Contains integer hour, integer min, string am/pm
 * @param {object} target - Contains integer hour, integer min, string am/pm
 */
var isInRange = function(workerHours, target) {
	let targetStart = convertTimeToDecimal(target.start);
	let targetEnd = convertTimeToDecimal(target.end);
	let workerIn = convertTimeToDecimal(workerHours.in);
	let workerOut = convertTimeToDecimal(workerHours.out);

	// If worker's workday runs into the next day
	if (workerIn > workerOut) {
		// If target also runs into the next day,
		// then 24:00 is guaranteed to overlap
		if (targetStart > targetEnd) {
			return true;
		}
		if (workerIn <= targetEnd || workerOut >= targetEnd) {
			return true;
		}
	}

	// If target runs to the next day, but not the worker's schedule
	else if (targetStart > targetEnd) {
		if (workerIn <= targetEnd || workerOut >= targetStart) {
			return true;
		}
	}

	// Otherwise check for normal overlap
	if (workerIn >= targetStart && workerIn <= targetEnd ||
		workerIn <= targetStart && workerOut > targetStart) {
		return true;
	}

	// If no overlap found
	return false;
};

/**
 * Returns a decimal number representing length of time in hours
 * @param {object} time1 - Contains integer hour, integer min, string am/pm
 * @param {object} time2 - Contains integer hour, integer min, string am/pm
 */
var calculateShiftHours = function(time1, time2) {
	let t1 = convertTimeToDecimal(time1);
	let t2 = convertTimeToDecimal(time2);
	// Subtract second time from first
	let time = t2 - t1;
	// If time value is negative, add 24, else, return time
	return (time < 0) ? time + 24 : time;
};

/**
 * Returns a decimal number representing time in hours
 * @param {object} time - Contains integer hour, integer min, string am/pm
 */
var convertTimeToDecimal = function(time) {
	time = ko.toJS(time);
	// Adjust 12 to zero hour
	let t = (time.hour === 12) ? 0 : time.hour;
	// Add 12 hours if PM
	t += (time.ampm != 'am') ? 12 : 0;
	// Add minutes as a decimal
	t += time.min / 60;
	return t;
};

var ViewModel = function() {
	var self = this;

	// Track if document is loaded
	self.loading = ko.observable(true);

	// Event handling on load
	$(document).ready(function() {
		// Display loading screen until document is ready
		self.loading(false);

		// Watch for table resizing. Since only one table is displayed at a
		// time, this ensures that the container stays the same size as the
		// largest table (thereby preventing the container from resizing
		// itself whenever tabs/tables change).
		function setHeight() {
			// Gather table container elements to check
			let tableEls = document.getElementsByClassName('table-container');

			// Check each table and resize min-height if needed
			for (let i = 0; i < tableEls.length; i++) {
				let el = tableEls[i];
				let currentHeight = window.getComputedStyle(el).height;
				let minHeight = $(el).css('min-height');
				if (parseInt(currentHeight) > parseInt(minHeight)) {
					$(el).css('min-height', currentHeight);
				}
			}
			// Continue watching for height changes
			window.requestAnimationFrame(setHeight);
		}
		// Kick-off table height watching
		window.requestAnimationFrame(setHeight);

		// Alert if navigating away from page
		window.onbeforeunload = function(e) {
			let dialogText = 'Are you sure you want to leave?' +
				' You might have unsaved changes.';
			e.returnValue = dialogText;
			return dialogText;
		};
	});

	// Manage current time for 'right now' views
	self.clock = ko.observable(new Date());
	// Keep current time up-to-date
	self.getCurrentTime = function() {
		self.clock( new Date() );
	};
	setInterval(self.getCurrentTime, 1000);
	// Format time object to fit target comparisons
	self.timeAsTarget = function() {
		let hour = this.clock().getHours();
		let targetTime = {
			'hour' : (hour === 0) ? 12 : (hour > 12) ? hour - 12 : hour,
			'min' : this.clock().getMinutes(),
			'ampm' : (hour > 11) ? 'pm' : 'am'
		};
		return { 'start': targetTime, 'end' : targetTime };
	};

	// Toggle visibility of element's dislplay/edit children on click event
	self.showEditEl = function(data, e) {
		let el = e;
		// Grab element from event if being called by click
		if (e.type && e.type === 'click') {
			el = e.currentTarget;
		}
		let editEl = el.getElementsByClassName('editable-edit')[0];
		let displayEl = el.getElementsByClassName('editable-display')[0];
		// Check if this edit element is currently hidden
		if ((' ' + editEl.className + ' ').indexOf(' ' + 'hidden' + ' ') > -1) {
			// Hide display element
			displayEl.className += ' hidden';
			// Show and focus the editable element
			editEl.classList.remove('hidden');
			editEl.focus();
			// Select element
			if (editEl.nodeName != 'SELECT') {
				editEl.select();
			}
		}
	};
	// On event, hide this editable element, and show sibling dislpay element
	self.showDisplayEl = function(data, e) {
		let el = e.currentTarget;
		let parent = el.parentElement;
		let displayEl = parent.getElementsByClassName('editable-display')[0];
		el.className += ' hidden';
		displayEl.classList.remove('hidden');
	};

	// Suite Name
	self.name = ko.observable('Schedulizer');

	// Array of schedules
	self.schedules = ko.observableArray([]);

	// Clears focus if enter is pressed
	self.clearFocus = function(data, event) {
		if (event && event.keyCode === 13) {
			document.activeElement.blur();
			return true;
		}
		else
			return true;
	};

	// Mange special input key events
	self.manageKeys = function(data, event) {
		// If TAB is pressed, blur current element and advance to and
		// "activate" the next (hidden) input element.
		if (event && event.keyCode === 9) {
			event.preventDefault();

			// Find if user is tabbing (forward) or shift-tabbing (backwards)
			let dir = (event.shiftKey) ? -1 : 1;

			// Gather a collection of all input elements to cycle through
			let inputs = document.body.querySelectorAll(
				'select,input:not(.file-input)');
			inputs = Array.prototype.slice.call(inputs);

			// Lookup the active element's index position within the collection
			let thisIndex = inputs.indexOf(event.currentTarget);

			// Find the next element's index, accounting for wrap-around borders
			let nextIndex = (thisIndex + dir < 0) ? inputs.length - 1 :
				(thisIndex + dir === inputs.length) ? 0 : thisIndex + dir;
			let nextInput = inputs[nextIndex];

			// Check that the next input-type element is valid to activate
			let invalidElement;
			do {
				// Assume element is valid
				invalidElement = false;

				// Identify ancestors that may be hidden
				let closestHidden = nextInput.parentNode.closest('.hidden');

				// Find if the next element is inside a table that is hidden
				if (closestHidden) {
					invalidElement = true;
				}

				// If next element is already visibile, simply pass focus to it
				else if (!nextInput.classList.contains('hidden')) {
					nextInput.focus();
					return true;
				}

				// If no valid situation was found, advance to next element
				if (invalidElement) {
					// Check boundary of elemets list and wrap-around
					nextIndex = (nextIndex + dir < 0) ? inputs.length - 1 :
						(nextIndex + dir === inputs.length) ?
						0 : nextIndex + dir;
					nextInput = inputs[nextIndex];
				}

			} while (invalidElement);

			// Show editable element
			self.showEditEl(data, nextInput.parentElement);
			return true;
		}

		// If ENTER or ESC are pressed, blur element
		else if (event && (event.keyCode === 13 || event.keyCode === 27)) {
			document.activeElement.blur();
			return true;
		}

		else {
			return true;
		}
	};

	// Print section
	self.printSection = function(data, e) {
		// Apply print class to this section
		let section = e.currentTarget.parentElement.parentElement.parentElement;
		section.className += ' section-to-print';

		// Print section
		window.print();

		// Remove print class from this section
		section.classList.remove('section-to-print');
	};

	/**
	 * Save current schedule to external local file (in flat, JSON format)
	 * @param {function} data - Schedule knockout object
	 */
	self.saveSchedule = function(data) {
		let scheduleJSON = ko.toJSON(data);
		let title = JSON.parse(scheduleJSON).name;
		self.exportFile(scheduleJSON, title, 'text/JSON', 'sched');
	};

	/**
	 * Load in schedule from JSON data
	 * @param {object} data - Schedule data object in JSON format.
	 * @param {function} index - Observable index to load this schedule to.
	 */
	self.loadSchedule = function(data, index) {
		let parsedData = JSON.parse(data);
		let name = parsedData.name;
		let verified = confirm(
			'Overwrite current schedule with saved schedule "' + name + '"?'
		);
		if (verified) {
			let i = index();
			self.schedules()[i](new Schedule(periods, parsedData));
		}
	};

	/**
	 * Import data from file, pass data to be loaded where needed.
	 * @param {object} element - DOM Element holding file data.
	 * @param {function} index - Observable index to pass to cb, if any
	 * @param {function} callback - Function to call after loading (load data)
	 */
	self.importFile = function(element, index, callback) {
		// Get file data from element
		let file = element.files[0];

		// Instantiate Reader to handle file
		let reader = new FileReader();
		reader.onload = function(event) {
			let fileData = event.target.result;
			// Send file data to be loaded by callback function
			callback(fileData, index);
		};
		reader.readAsText(file);
	};

	// Add new Schedule at the current position of the schedules array
	self.newSchedule = function(data, index) {
		// Flatten index only if it's an observable
		let i = (typeof index === 'function') ? index() : index;
		self.schedules.splice(i + 1, 0,
			ko.observable(new Schedule(periods, scheduleData[0]))
		);
	};

	// Remove current schedule from array and from page
	self.removeSchedule = function(data, index) {
		let name = data.name();
		let verified = confirm('Really remove the schedule "' + name +
			'" from the page?');
		if (verified) {
			let i = index();
			self.schedules.splice(i, 1);
		}
	}

	// Save suite of schedules to file and localStorage (for autoloading)
	self.saveSuite = function() {
		// Define current suite
		let suite = {
			'name' : self.name,
			'schedules' : self.schedules
		};
		// Convert suite to JSON
		suite = ko.toJSON(suite);

		// Save to localStorage for quick-loading
		localStorage.savedSuite = suite;
		// Save suite to local JSON file for user storage, archiving
		self.exportFile(suite, 'Suite', 'text/JSON', 'suite');
	};

	// Load suite of schedules from saved file or localStorage
	self.loadSuite = function(data) {
		// Get save data from localStorage (if autoloading) or from data
		let savedData = JSON.parse(
			(data === undefined) ? localStorage.savedSuite : data);

		// If this function fires as a result of user button click,
		// verify with user that they want to overwrite unsaved changes
		let verified = (typeof data === 'string') ?
			confirm('Erase schedules and load from data?') : true;

		if (verified) {
			// Display suite name
			self.name(savedData.name);

			// Re-initialize schedules array
			self.schedules.splice(0, self.schedules().length);

			// Load in schedules from parsed save data
			savedData.schedules.forEach(function(schedule) {
				self.schedules.push(
					ko.observable(new Schedule(periods, schedule))
				);
			});
		}
	}

	// Auto-load suite, if found
	if (localStorage.savedSuite) {
		self.loadSuite();
	}
	else {
		// If no suite data found, instantiate one example schedule
		self.schedules.push(
			ko.observable(new Schedule(periods, scheduleData[0]))
		);
	}

	// Export table to CSV file
	self.exportToCSV = function(data, event) {
		// Array of data to export
		let csv = [];
		// Element for parent Schedule
		let el = event.currentTarget.parentElement.parentElement.parentElement;

		// Append title and subheader to csv data
		let title = el.getElementsByClassName('click-to-edit')[0].innerText;
		let subheader =
			el.getElementsByClassName('table-tab-selected')[0].innerText;
		csv.push(title + ' - ' + subheader + '\n');

		// Grab visible trs to append to csv data array
		let rows = el.querySelectorAll('table:not(.hidden) tr');
		for (let i = 0 ; i < rows.length - 1; i++) {
			let row = [];
			// Grab tds from each tr, excluding ones not needed for export
			let cols = rows[i].querySelectorAll(
				'td:not(.add-worker):not(.add-query):not(.query-manage)');
			for (let j = 0; j < cols.length; j++) {
				// Grab all of the cell's content, and format, when applicaple
				let cellContent = cols[j].innerText.trim();

				// Remove whitespace from spans (or their children) that
				// contain times
				let displaysTime = (cols[j].classList.contains('time')) ?
					true : (cols[j].querySelectorAll('.time').length > 0) ?
					true : false;
				if (displaysTime) {
					cellContent = cols[j].innerText.replace(/\s/g, '');
				}

				// Get select value (or values) for visible selects in a cell
				let selectElements =
					cols[j].querySelectorAll('select:not(.hidden)');
				if (selectElements.length > 0) {
					if (cellContent === cols[j].innerText.trim()) {
						cellContent = '';
					}
					for (let k = 0; k < selectElements.length; k++) {
						// Grab value of select element
						let selectData = ko.dataFor(selectElements[k]);
						// If computed from a range object, get the name
						if (typeof selectData === 'object') {
							selectData = selectData.selectedRange().name();
						}
						// Append to cellContent
						cellContent += ' ' + selectData + ' ';
					}
				}

				// Add cell contents into row array
				row.push(cellContent.trim());

				// If cell has colspan beyond 1, add empty cells to match
				if (cols[j].getAttribute('colspan') > 1) {
					let extraCells = cols[j].getAttribute('colspan');
					while (--extraCells > 0) {
						row.push('');
					}
				}
			}

			// Add each row to the csv data array
			csv.push('\n' + row.join(','));
		}

		// Export csv data to file
		self.exportFile(csv, title.trim(), 'text/csv', 'csv');
	};

	/**
	 * Save data into file by creating blob and downloading it
	 * @param {object/string} data - Data to encode into file
	 * @param {string} subTitle - Schedule title
	 * @param {string} fileType - Type of file to export
	 * @param {string} ext - Extension for file (no punctuation)
	 */
	self.exportFile = function(data, subTitle, fileType, ext) {
		let blob = new Blob([data], { type: fileType + ';charset=utf-8;' });
		// Create filename from suite name and schedule title
		let filename = self.name() + ' - ' + subTitle + '.' + ext;
		if (navigator.msSaveBlob) { // IE 10+
			navigator.msSaveBlob(blob, filename);
		}
		else {
			let link = document.createElement("a");
			let url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};
};

// Runs passed function and parameters once element has loaded
ko.bindingHandlers.elementReady = {
    init: function(element, valueAccessor, bindingContext) {
		// Once this element has loaded
		$(element).ready(function() {
			let func = ko.unwrap(valueAccessor()).func;
			// Get parameter(s) passed in as an array
			let params = ko.unwrap(valueAccessor()).params;
			// Runs function with passed parameter(s)
			func(...params);
		});
    },
	update: function(element, valueAccessor, bindingContext) {
		// re-run function on window resize
		$(window).resize(function() {
			let func = ko.unwrap(valueAccessor()).func;
			// Get parameter(s) passed in as an array
			let params = ko.unwrap(valueAccessor()).params;
			// Runs function with passed parameter(s)
			func(...params);
		});
	}
};

// Process nodes before setting bindings
ko.bindingProvider.instance.preprocessNode = function(node) {

	/**
	 * Handle replacement of placeholder text in templates, in order to
	 * bind data after replacement occurs. Specifically, make button
	 * management code reusable, since defined Workers, Tasks, etc
	 * need to be manipulated by the user in similar fashion.
	 */
	// Check that node is meant to have it's text replaced
	if (node.classList && node.classList.contains('management-replace')) {
		// Find given Object name and extrapolate name of corresponding array
		let context = ko.contextFor(node);
		let type = Object.getPrototypeOf(context.$data).constructor.name;
		// i.e. 'Worker' objects are held by the Schedule in a 'workers' array
		let list = type.toLowerCase() + 's';

		// Find given descriptive name of Object
		let name;
		if (type === 'Worker') {
			let options = context.$parent.scheduleOptions;
			name = context.$data.firstName() +
				((options.useSingleName.value()) ?
				'' : ' ' + context.$data.lastName());
		}
		else {
			name = context.$data.name();
		}

		// Create new element to replace placeholder node
		let el = document.createElement('div');
		el.classList = node.classList;
		// Replace all occurrences of placeholder text
		el.innerHTML = node.innerHTML
			.replace(/%object/g, type)
			.replace(/%name/g, name)
			.replace(/%list/g, list);

		// Replace node with new element
		node.parentElement.replaceChild(el, node);
		return [el];
	}
};

ko.applyBindings(new ViewModel());