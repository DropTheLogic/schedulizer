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
		firstName: { string: 'John' },
		lastName: { string: 'Doe'},
		job: { string: 'Job name'},
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

var rangeData = [
	{
		name: {string: 'Full Day'},
		target: {
			start: {hour: 12, min: 0, ampm: 'am'},
			end: {hour: 11, min: 59, ampm: 'pm'}
		}
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
		name: {string: 'My Schedule'},
		ranges: rangeData,
		workers: workersData,
		queries: queriesData
	}
];

/**
 * Returns time object with observable attributes
 * @constructor
 * @param {object} day - Holds parameters for hour, minute, am
 */
var KoEditableTime = function(day) {
	return {
		'hour': ko.observable(day.hour),
		'min': ko.observable(day.min),
		'ampm': ko.observable(day.ampm),
		'editingHour' : ko.observable(false),
		'editingMin' : ko.observable(false),
		'editingAM' : ko.observable(false),
		'editHour' : function() {
			this.editingHour(true);
		},
		'editMin' : function() {
			this.editingMin(true);
		},
		'editAM' : function() {
			this.editingAM(true);
		}
	}
};

/**
 * Returns editable text object with observable attributes
 * @constructor
 * @param {object} text - Has text String value
 */
var KoEditableText = function(text) {
	return {
		'string': ko.observable(text.string),
		'editingString': ko.observable(false),
		'editString': function() {
			this.editingString(true);
		}
	}
};

var Worker = function(periods, data) {
	var self = this;

	// Worker Name
	self.firstName = new KoEditableText(data.firstName);
	self.lastName = new KoEditableText(data.lastName);

	// Worker Job
	self.job = new KoEditableText(data.job);

	// Worker schedule
	self.hours = ko.observableArray();
	for (let i = 0; i < periods.length; i++) {
		self.hours()[i] = ko.observable({
			'off' : ko.observable(data.hours[i].off),
			'toggleOff' : function() {
				(this.off()) ? this.off(false) : this.off(true);
			},
			'in' : new KoEditableTime(data.hours[i].in),
			'out' : new KoEditableTime(data.hours[i].out)
		});
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

	self.name = new KoEditableText(data.name);
	self.named = ko.computed(function() {
		return self.name.string();
	}, this);

	self.target = {
		'start' : new KoEditableTime(data.target.start),
		'end' : new KoEditableTime(data.target.end)
	};
};

var Schedule = function(periods, data) {
	var self = this;

	// Schedule name
	self.name = new KoEditableText(data.name);

	// Array of different table views
	self.views = ['Schedule', 'Ranges', 'Right Now'];

	// Keep track of the schedule's different table views
	self.selected = ko.observable(self.views[0]);
	self.select = function(data) {
		self.selected(data);
	};

	// Array of named ranges of time
	self.ranges = ko.observableArray([]);
	// Load in ranges from data
	data.ranges.forEach(function(range) {
		self.ranges.push( new Range(range) );
	});

	// Push new range to ranges array
	self.addRange = function() {
		self.ranges.push(new Range(rangeData[0]) );
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

	// Copy and paste functions for worker hours
	self.clipboard = ko.observable('');
	self.copyHours = function(data) {
		self.clipboard(ko.toJS(data));
	};
	self.pasteHours = function(context, index) {
		let workersIndex = self.workers().indexOf(context.$rawData);
		self.workers()[workersIndex]().hours()[index()]({
			'off' : ko.observable(self.clipboard().off),
			'toggleOff' : function() {
				(this.off()) ? this.off(false) : this.off(true);
			},
			'in' : new KoEditableTime(self.clipboard().in),
			'out' : new KoEditableTime(self.clipboard().out)
		});
	};

	/**
	 * Pushes new worker to workers array for this schedule
	 * @param {object} data - observable Worker data (optional)
	 * @param {object} index - observable index of current data (optional)
	 * @param {integer} newIndex - index of desired insertion,
	 *								  relative to index parameter (optional)
	 */
	self.addWorker = function(data, index, newIndex) {
		// If insertion location provided, insert new worker there
		if (typeof newIndex === 'number') {
			let i = index();
			// Flatten worker data to be parsed by Worker function
			let workerData = ko.toJS(data);
			self.workers.splice(i + newIndex, 0,
				ko.observable(new Worker(periods, workerData))
			);
		}
		// If no insertion parameter passed, add a new worker at the end
		else {
			self.workers.push(
				ko.observable(new Worker(periods, workersData[0]))
			);
		}
	};

	/**
	 * Moves current worker to given relative index position
	 * @param {object} data - current observable Worker object
	 * @param {object} index - observable index of current data
	 * @param {integer} newIndex - desired index, relative to current index
	 */
	self.moveWorker = function(data, index, newIndex) {
		let i = index();
		let j = i + newIndex;

		// Make sure requested move is within bounds
		if (j >= 0 && j < self.workers().length) {
			// Store target index data in temp variable
			let temp = self.workers()[j]();

			// Assign current data to target index
			self.workers()[j](data());

			// Assign temp data to old index position
			self.workers()[i](temp);
		}
	};

	// Deletes worker from workers array
	self.deleteWorker = function(index) {
		let i = index();
		self.workers.splice(i, 1);
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
				let ready = typeof a()[prop] == 'function';
				a = (ready) ? a()[prop]() : a()[prop].string();
				b = (ready) ? b()[prop]() : b()[prop].string();
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
				if (worker().job.string() === self.jobs()[i]) {
					isUnique = false;
					break;
				}
			}
			if (isUnique) {
				self.jobs.push(worker().job.string());
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
					if (listedJob === self.workers()[j]().job.string()) {
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
	self.selectedRange = ko.observable(ranges()[targetData.selectedIndex]);

	// Holds index in ranges array of the selected range
	self.selectedIndex = ko.computed(function() {
		return ranges.indexOf(self.selectedRange());
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
						if (worker().job.string() === self.targetJobs()[i]()) {
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

	// Display loading screen until document is ready
	self.loading = ko.observable(true);
	$(document).ready(function() {
		self.loading(false);
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
	self.editingName = ko.observable(false);
	self.editName = function(name) {
		self.editingName(true);
	};

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

			// Find index of next input-type element
			let nextIndex = $(':input').index(event.currentTarget) + dir;
			let nextInput = $(':input:eq(' + nextIndex + ')').get();
			let invalidElement;

			// Check that the next input-type element is valid to activate
			do {
				// Assume element is valid
				invalidElement = false;
				// Skip any buttons
				if (nextInput['0'].nodeName === 'BUTTON') {
					invalidElement = true;
				}
				else if (nextInput['0'].nodeName === 'SELECT') {
					// If this element is under a day in which the worker
					// is off, skip as is should remain hidden.
					if (ko.contextFor(nextInput['0']).$parent.off()) {
						invalidElement = true;
					}
				}
				// If no valid situation was found, advance to next element
				if (invalidElement) {
					nextInput = $(':input:eq(' + (nextIndex += dir) + ')').get();
				}
			} while (invalidElement);

			// Show editable element
			self.showEditEl(data, nextInput['0'].parentElement);
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

	// Use localStorage to save current schedule
	self.saveSchedule = function(data) {
		let verified = confirm('Overwrite previous data file?');
		if (verified) {
			let scheduleJSON = ko.toJSON(data);
			localStorage.savedScheduleJSON = scheduleJSON;
		}
	};

	// Use localStorage to load saved schedule
	self.loadSchedule = function(data, index) {
		if (localStorage.savedScheduleJSON) {
			let parsedData = JSON.parse(localStorage.savedScheduleJSON);
			let name = parsedData.name.string;
			let verified = confirm(
				'Overwrite current schedule with saved schedule "' + name + '"?'
			);
			if (verified) {
				let i = index();
				self.schedules()[i](new Schedule(periods, parsedData));
			}
		}
		else {
			alert('Warning: no save data found!');
		}
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
		let name = data.name.string();
		let verified = confirm('Really remove the schedule "' + name +
			'" from the page?');
		if (verified) {
			let i = index();
			self.schedules.splice(i, 1);
		}
	}

	// Save suite of schedules to local storage
	self.saveSuite = function() {
		let verified = confirm('Overwrite previous save data file?');
		if (verified) {
			let suiteJSON = ko.toJSON(self.schedules);
			localStorage.savedSuiteJSON = suiteJSON;
			localStorage.savedName = self.name();
		}
	};

	// Load suite of schedules from local storage
	self.loadSuite = function(data) {
		if (localStorage.savedSuiteJSON) {
			let parsedData = JSON.parse(localStorage.savedSuiteJSON);

			// If this function fires as a result of user button click,
			// verify with user that they want to overwrite unsaved changes
			let verified = (typeof data === 'object') ?
				confirm('Erase schedules and load from data?') : true;

			if (verified) {
				// Display suite name
				self.name(localStorage.savedName);

				// Re-initialize schedules array
				self.schedules.splice(0, self.schedules().length);

				// Load in schedules from parsed save data
				parsedData.forEach(function(schedule) {
					self.schedules.push(
						ko.observable(new Schedule(periods, schedule))
					);
				});
			}
		}
	}

	// Auto-load suite, if found
	if (localStorage.savedSuiteJSON) {
		self.loadSuite();
	}
	else {
		// If no suite data found, instantiate one example schedule
		self.schedules.push(
			ko.observable(new Schedule(periods, scheduleData[0]))
		);
	}
};

ko.applyBindings(new ViewModel());