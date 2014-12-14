'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
_ = require('lodash');

/**
 * Task Schema
 */
var TaskHistorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

/**
 * Define array of dependencies
 * @type {Schema}
 */
var TaskDependencySchema = new Schema({
    dependency: {
        type: Schema.ObjectId,
        ref: 'Task',
        required: true
    }
});

/**
 * Task Schema
 */
var TaskSchema = new Schema({
    modified: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: Schema.ObjectId,
        ref: 'Team',
        required: true
    },
    estimate: {
        type: Number,
        default: 0
    },
    dependencies: [TaskDependencySchema],
    assignedTo: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    history: [TaskHistorySchema]
});

/**
 * Validations
 */
TaskSchema.path('title').validate(function (title) {
    return !!title;
}, 'Title cannot be blank');

TaskSchema.path('content').validate(function (content) {
    return !!content;
}, 'Content cannot be blank');

TaskSchema.path('user').validate(function (user) {

});

/**
 * Statics
 */
    // Query task by ID
TaskSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name').exec(cb);
};

// Query task by user ID
TaskSchema.statics.loadByUserId = function (id, cb) {
    this.find({
        user: id
    }).populate('user', 'name').exec(cb);
};

// Query tasks by team ID
TaskSchema.statics.loadByTeamId = function (id, cb) {
    this.find({
        team: id
    },
    null,
    {sort: {_id: -1}}).populate('user', 'name').exec(cb);
};

// Get most recent tasks for the requested user
TaskSchema.statics.getMostRecent = function (userId, count, page, callback) {
    // Set page to 1 if not set
    page = page || 1;
    var args = Array.prototype.slice.call(arguments);
    // For calls without page or count specified
    if (!_.isFunction(callback)) {
        var filteredArgs = args.filter(function (val) {
            return _.isFunction(val);
        });
        if (filteredArgs.length !== 1) {
            throw new Error('A single callback must be passed to TaskSchema.getMostRecent');
        }
        callback = filteredArgs[0];
    } else {
        callback = args[args.length - 1];
    }
    // Pagination
    page = args.length < 4 ? 1 : page;
    page = (page - 1) * 5;
    // Default count
    count = args.length < 3 ? 5 : count;
    // Find the requested tasks
    this.find({
        user: userId
    }, null, {sort: {_id: -1}}).skip(page).limit(count).populate('user', 'name').exec(callback);
};

/**
 * Update modified time on save
 */
TaskSchema.pre('save', function (next) {
    this.modified = new Date();
    next();
});

mongoose.model('Task', TaskSchema);
