var periods = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var schedule = [
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
	{'in': '8:00am', 'out': '4:00pm'},
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
			'in' : ko.observable(schedule[i].in),
			'out' : ko.observable(schedule[i].out),
			'editingIn' : ko.observable(false),
			'editingOut' : ko.observable(false),
			'editIn' : function() {
				this.editingIn(true);
			},
			'editOut' : function() {
				this.editingOut(true);
			}
		});
	}
};

var Schedule = function(periods) {
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
};

var ViewModel = function() {
	var self = this;

	// Array of workers and schedules
	self.schedules = ko.observableArray([]);
	self.workers = ko.observableArray([]);

	// Instantiate one schedule with one worker
	self.schedules.push(new Schedule(periods));
	self.workers.push(new Worker(periods, schedule));
	console.log(self.workers()[0].hours.length);
};

ko.applyBindings(new ViewModel());