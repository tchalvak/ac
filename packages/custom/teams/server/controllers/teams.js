'use strict';

var mongoose = require('mongoose'),
    Team = mongoose.model('Team');

//exports.create = function(req, res) {
//
//    //User.where({teams: '547553c75de542cb3a5252ce'}).count(function (err, count) {
//    //    res.send(count + '');
//    //});
//    //
//    //return;
//    Team.remove({}, function (err) {
//        if (err) {
//            return res.send(err);
//        }
//    });
//    User.remove({}, function (err) {
//        if (err) {
//            return res.send(err);
//        }
//    });
//    req.body = {
//        team: {
//            name: 'A good team'
//        },
//        user: {
//            name: 'Some guy',
//            email: 'fuck@fuck.com'
//        }
//    };
//    var team = new Team(req.body.team);
//    var team2 = new Team(req.body.team);
//    //team.user = req.user;
//
//    team.validate(function (error) {
//        if (error) {
//            return res.send(team);
//        }
//    });
//
//    team.save(function(err) {
//        if (err) {
//            console.log('could not save team to database: ' + err);
//            return res.json(500, {
//                error: 'Cannot save the team'
//            });
//        }
//
//        team2.save(function (err) {
//            if (err) {
//                return res.json(err);
//            }
//            var user = new User(req.body.user);
//            user.teams = [team, team2];
//            user.save(function (err) {
//                if (err) {
//                    return res.send(err);
//                }
//                // Increment the userCount on the team document
//                // If this is a new record, increment the userCount for the team
//                var teams = user.teams;
//                _.each(teams, function (teamId) {
//                    Team.findOne({_id: teamId}, function (err, team) {
//                        if (!err) {
//                            console.error(team);
//                            team.userCount = team.userCount + 1;
//                            team.save(function (err) {
//                                if (err) {
//                                    return next(new Error('Could not update team user count'));
//                                }
//                            });
//                        }
//                    });
//                });
//                User
//                .findOne({})
//                .populate('Team')
//                .exec(function (err, user) {
//                    if (err) return res.json(err);
//
//                    res.json(user);
//                });
//            });
//        });
//        //res.json(team);
//    });
//};

/**
 * Get tasks for the current requested user
 */
exports.getTeamById = function(req, res, next) {
    // Make sure a user ID was passed in
    if (!req.params.hasOwnProperty('teamId')) {
        return next(new Error('A user ID must be passed in to this query'));
    }
    Team.getById(req.params.teamId, function (err, task) {
        if (err) {
            return next(err);
        }
        return res.json(task);
    });
};