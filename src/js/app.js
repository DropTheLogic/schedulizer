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
		name: 'John Doe',
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

var queriesData = [
	{
		target: {
			start: {hour: 8, min: 30, ampm: 'am'},
			end: {hour: 4, min: 30, ampm: 'pm'},
			jobs: ['Some job']
		}
	}
];

var scheduleData = [
	{
		name: 'My Schedule',
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

var Worker = function(periods, data) {
	var self = this;

	// Worker Name
	self.name = ko.observable(data.name);
	self.editingName = ko.observable(false);
	self.editName = function() {
		self.editingName(true);
	};

	// Worker Job
	self.job = ko.observable(data.job);
	self.editingJob = ko.observable(false);
	self.editJob = function() {
		self.editingJob(true);
	};

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

var Schedule = function(periods, data) {
	var self = this;

	// Schedule name
	self.name = ko.observable(data.name);
	self.editingName = ko.observable(false);
	self.editName = function(name) {
		self.editingName(true);
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

	// Keep track of distinct jobs entered
	self.jobs = ko.computed(function() {
		var jobs = [];
		self.workers().forEach(function(worker) {
			var isUnique = true;
			jobs.forEach(function(exisitingJob) {
				if (worker().job() === exisitingJob)
					isUnique = false;
			});
			if (isUnique) {
				jobs.push(worker().job());
			}
		});
		return jobs;
	}, this);

	// Define array to hold queries and load queries from raw data
	self.queries = ko.observableArray([]);
	data.queries.forEach(function(queryData) {
		self.queries.push( new Query(self.workers, queryData) );
	});

	// Push new Query to queries array
	self.addQuery = function() {
		self.queries.push( new Query(self.workers, data.queries[0]) );
	};

	// Delete query from queries array
	self.deleteQuery = function(index) {
		self.queries.splice(index, 1)
	}
};

/**
 * Returns Query object that takes an array of workers, and tallies matches
 * between the worker's schedules and certain observable targets.
 * @constructor
 * @param {object} workers - observable array of worker objects
 */
var Query = function(workers, targetData) {
	var self = this;

	// Array of each day's query tallies
	self.tallies = ko.observableArray([]);

	// Targets for query to match
	self.target = {
		start: new KoEditableTime(targetData.target.start),
		end: new KoEditableTime(targetData.target.end),
		jobs: ko.observableArray([])
	};

	// Load target jobs array for query
	targetData.target.jobs.forEach(function(job) {
		self.target.jobs.push(ko.observable(job));
	});

	// Add new job to job target array
	self.addJob = function(value) {
		self.target.jobs.push(ko.observable('job'));
	};

	// Calculate result of query
	self.result = function(day) {
		let target = self.target;
		return ko.computed(function() {
			// How many workers can be matched on this day
			let tally = 0;
			// Cycle through each worker to tally up
			workers().forEach(function(worker) {
				// Find if worker is off today or is working
				let workerHours = worker().hours()[day]();
				let isWorking = !workerHours.off();
				if (isWorking && isInRange(workerHours, target)) {
					// Find if job matches
					for (let i = 0; i < target.jobs().length; i++) {
						if (worker().job() === target.jobs()[i]()) {
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

	if (workerIn >= targetStart && workerIn <= targetEnd ||
		workerIn <= targetStart && workerOut > targetStart) {
		return true;
	}
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
	// Adjust 12 to zero hour
	let t = (time.hour() === 12) ? 0 : time.hour();
	// Add 12 hours if PM
	t += (time.ampm() != 'am') ? 12 : 0;
	// Add minutes as a decimal
	t += time.min() / 60;
	return t;
};

var ViewModel = function() {
	var self = this;

	// Suite Name
	self.name = ko.observable('Schedulizer');
	self.editingName = ko.observable(false);
	self.editName = function(name) {
		self.editingName(true);
	};

	// Array of schedules
	self.schedules = ko.observableArray([]);

	// Pushes new schedule to schedules array
	self.addSchedule = function() {
		self.schedules.push(
			ko.observable(new Schedule(periods, scheduleData[0]))
		);
	};

	// Clears focus if enter is pressed
	self.clearFocus = function(data, event) {
		if (event && event.keyCode === 13) {
			document.activeElement.blur();
			return true;
		}
		else
			return true;
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
			let name = parsedData.name;
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
		let i = index();
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