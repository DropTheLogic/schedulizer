var periods = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var minutes = [
	00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 10,
	11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
	21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
	31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
	51, 52, 53, 54, 55, 56, 57, 58, 59 ];
var am = ['am', 'pm'];
var schedule = [
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'ampm': 'am'},
	'out': {'hour': 4, 'min': 0, 'ampm': 'pm'}},
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

var Worker = function(periods, schedule) {
	var self = this;

	// Worker Name
	self.name = ko.observable('John Doe');
	self.editingName = ko.observable(false);
	self.editName = function() {
		self.editingName(true);
	};

	// Worker Job
	self.job = ko.observable('Job name');
	self.editingJob = ko.observable(false);
	self.editJob = function() {
		self.editingJob(true);
	};

	// Worker schedule
	self.hours = ko.observableArray();
	for (let i = 0; i < periods.length; i++) {
		self.hours()[i] = ko.observable({
			'off' : ko.observable(false),
			'toggleOff' : function() {
				(this.off()) ? this.off(false) : this.off(true);
			},
			'in' : new KoEditableTime(schedule[i].in),
			'out' : new KoEditableTime(schedule[i].out)
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

var Schedule = function(periods, schedule) {
	var self = this;

	// Schedule name
	self.name = ko.observable('My Schedule');
	self.editingName = ko.observable(false);
	self.editName = function(name) {
		self.editingName(true);
	};

	// Default schedule period length and heading titles
	self.periodNames = ko.observableArray();
	for (let i = 0; i < periods.length; i++) {
		self.periodNames()[i] = ko.observable(periods[i]);
	}

	// Define workers array and instantiate one worker
	self.workers = ko.observableArray([]);
	self.workers.push(new Worker(periods, schedule));

	// Pushes new worker to workers array for this schedule
	self.addWorker = function() {
		self.workers.push(new Worker(periods, schedule));
	};

	// Deletes worker from workers array
	self.deleteWorker = function(index) {
		self.workers.splice(index, 1);
	}

	// Keep track of distinct jobs entered
	self.jobs = ko.computed(function() {
		var jobs = [];
		self.workers().forEach(function(worker) {
			var isUnique = true;
			jobs.forEach(function(exisitingJob) {
				if (worker.job() === exisitingJob)
					isUnique = false;
			});
			if (isUnique) {
				jobs.push(worker.job());
			}
		});
		return jobs;
	}, this);

	// Define array to hold queries and instantiate one query
	self.queries = ko.observableArray([]);
	self.queries.push( new Query(self.workers) );
};

/**
 * Returns Query object that takes an array of workers, and tallies matches
 * between the worker's schedules and certain observable targets.
 * @constructor
 * @param {object} workers - observable array of worker objects
 */
var Query = function(workers) {
	var self = this;

	// Array of each day's query tallies
	self.tallies = ko.observableArray([]);

	// Targets for query to match
	self.target = {
		start: new KoEditableTime({hour: 8, min: 30, ampm: 'am'}),
		end: new KoEditableTime({hour: 4, min: 30, ampm: 'pm'}),
		job: ko.observable() };

	// Calculate result of query
	self.result = function(day) {
		let targetJob = self.target.job;
		return ko.computed(function() {
			// How many workers can be matched on this day
			let tally = 0;
			// Cycle through each worker to tally up
			workers().forEach(function(worker) {
				// Find if worker is off today or is working
				let isWorking = !worker.hours()[day]().off();
				if (isWorking && worker.job() === targetJob() &&
					isInRange(worker.hours()[day](), self.target)) {
					tally++;
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

	if (workerIn > targetStart && workerIn < targetEnd ||
		workerIn < targetStart && workerOut > targetStart) {
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

	// Array of schedules
	self.schedules = ko.observableArray([]);

	// Instantiate one schedule
	self.schedules.push(new Schedule(periods, schedule));

	// Pushes new schedule to schedules array
	self.addSchedule = function() {
		self.schedules.push(new Schedule(periods, schedule));
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
};

ko.applyBindings(new ViewModel());