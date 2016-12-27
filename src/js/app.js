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
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
	{'in': {'hour': 8, 'min': 0, 'am': 'am'},
	'out': {'hour': 4, 'min': 0, 'am': 'pm'}},
];

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
			'in' : {
				'hour': ko.observable(schedule[i].in.hour),
				'min': ko.observable(schedule[i].in.min),
				'am': ko.observable(schedule[i].in.am),
			},
			'out' : {
				'hour': ko.observable(schedule[i].out.hour),
				'min': ko.observable(schedule[i].out.min),
				'am': ko.observable(schedule[i].out.am)
			},
			'editingInHour' : ko.observable(false),
			'editingInMin' : ko.observable(false),
			'editingInAM' : ko.observable(false),
			'editingOutHour' : ko.observable(false),
			'editingOutMin' : ko.observable(false),
			'editingOutAM' : ko.observable(false),
			'editInHour' : function() {
				this.editingInHour(true);
			},
			'editInMin' : function() {
				this.editingInMin(true);
			},
			'editInAM' : function() {
				this.editingInAM(true);
			},
			'editOutHour' : function() {
				this.editingOutHour(true);
			},
			'editOutMin' : function() {
				this.editingOutMin(true);
			},
			'editOutAM' : function() {
				this.editingOutAM(true);
			}
		});
	}
	self.totalTime = ko.computed(function() {
		let tt = 0;
		self.hours().forEach(function(day) {
			tt += calculateShiftHours(day().in, day().out);
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
};

/* Returns a decimal number representing time in hours
 * @param {object} time1 - Contains integer hour, integer min, string am/pm
 * @param {object} time2 - Contains integer hour, integer min, string am/pm
 */
var calculateShiftHours = function(time1, time2) {
	let t1, t2;
	// Adjust 12 to zero hour
	t1 = (time1.hour() === 12) ? 0 : time1.hour();
	t2 = (time2.hour() === 12) ? 0 : time2.hour();
	// Add 12 hours if PM
	t1 += (time1.am() != 'am') ? 12 : 0;
	t2 += (time2.am() != 'am') ? 12 : 0;
	// Add minutes as a decimal
	t1 += time1.min() / 60;
	t2 += time2.min() / 60;
	// Subtract second time from first
	let time = t2 - t1;
	// If time value is negative, add 24, else, return time
	return (time < 0) ? time + 24 : time;
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