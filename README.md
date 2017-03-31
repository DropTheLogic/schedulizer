# Schedulizer
#### The Staff Schedule and Task Organizer

## About
Schedulizer is a spreadsheet-style responsive web app that organizes staff
scheduling based around jobs and tasks. It is written in Javascript using the
[Knockout.js](http://knockoutjs.com) MVVM framework as well as
[Bootstrap](http://getbootstrap.com) for styling.

## Install
Schedulizer is currently in alpha production and is woefully unoptimized :)
No build tools are used yet. To install, simply clone or download this
repository and open `src/index.html`. All development code is found in
`src/js/app.js` and `src/index.html` with styling in `src/css/main.css`
and `src/css/print.css`.

## How to use
Each schedule in Schedulizer has a small menu of buttons and a group of tabs
to select one of several table views:

#### Schedule
The schedule table is made up columns for the days of the week, and rows for
employees and their work schedules on those days. At its most basic, you may
add employees and edit the hours that make up their schedules. Schedulizer
will tally and display each worker's total hours in the final column. In the
table's footer, Schedulizer will also tally (optionally) any total queries
based on those employee hours.

#### Ranges
The ranges table allows you to create predefined time Ranges to use for total
queries. You may edit each Range name and click each time element to select
times to begin and end the range with.

#### Right Now
The right now table checks the current time and displays all employees that
are scheduled to be at work *right now*, at a quick glance. It displays the
worker's name, their Job name, as well as the current time.

#### Options
The options view is a simple list of options to customize your experience
using Schedulizer.

## Features

#### Click-to-edit
Most of the text and numbers displayed are capable of being edited, in-place,
simply by clicking on them. For example, clicking on an employee's name will
change the the name's element to an input field where you can type. Clicking
anywhere else, or pressing `ENTER`, `ESC`, or `TAB` will save the name and
revert element back to a normal display element. For numerical text, i.e. the
time in employee's schedules, clicking will bring up a select element
in-place, where you can scroll to the desired time.

#### Tab Control
Since Schedulizer has most of it's editable fields hidden by default, pressing
`TAB` would normally ignore them. However, when actively editing any element,
pressing `TAB` will go to the next element, hidden or not. Note: unlike normal
`TAB` functionality, pressing `TAB` here will skip buttons and links (for now).

#### Query Totals
Each schedule table has a footer that totals the number of workers for that
day, given a time range and job type. For example, you can set a query to
look for employees with the job 'bar-back' who are working between 11:30am and
4:00pm. It will look through all the employee schedules and tally the number
of bar-backs found at that time for each day. To set time, either edit the
times manually or select a preset time range. To set job, select jobs
(automatically found from employee job titles). Combine multiple jobs into a
single query if it should tally when an employee with *either* job is found.
Case: you need to schedule a certain time range with at least three of
*any combination* of nurses or residents.

#### Saving
Schedulizer uses localStorage, when available, to save both individual
schedules and whole suites of schedules. If you save a schedule, you can load
it onto a schedule at a later time. If you save the whole suite, it will
automatically load when you navigate back to Schedulizer.

#### Exporting
Every schedule has the option to export to CSV-format file (using the
Blob constructor). This can be imported into various external spreadsheet
applications, though it will lose the built-in calculations for totals.

#### Printing
Using the print button, Schedulizer can print one table at a time, removing
most of the buttons and interactive visual elements.

#### User Options
* Single Name: Schedules display to two columns by default, for first and
last names. Select this if you prefer to use one field only for naming
employees.

* Text Size: Choose between the default font-size or a slightly larger
version.

## Contributing
Have a feature idea? Want to kick my butt at a refactoring a chunk of code?
Want to improve this README? Send a pull request and I'll have a look!

## License
This software is released under the [MIT](http://opensource.org/licenses/MIT)
Glicense.