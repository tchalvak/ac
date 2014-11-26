'use strict';

var crypto = require('crypto');

/**
 * Create a random hex string of specific length and
 * @todo consider taking out to a common unit testing javascript helper
 * @return string
 */
function getRandomString(len) {
    if (!len) {
        len = 16;
    }

    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex');
}

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Team = mongoose.model('Team'),
    q = require('q');

var request = require('supertest');
var server = request.agent('http://localhost:3000');

/**
 * Globals
 */
var user1,
    user2;

/**
 * Test Suites
 */
describe('Model User:', function () {

    before(function (done) {
        user1 = {
            name: 'Full name',
            email: 'test' + getRandomString() + '@test.com',
            teams: [mongoose.Types.ObjectId()],
            password: 'password',
            provider: 'local'
        };

        user2 = {
            name: 'Full name',
            email: 'test' + getRandomString() + '@test.com',
            teams: [mongoose.Types.ObjectId()],
            password: 'password',
            provider: 'local'
        };

        done();
    });

    describe('Method Save', function () {
        it('should begin without the test user', function (done) {
            User.find({
                email: user1.email
            }, function (err, users) {
                users.should.have.length(0);

                User.find({
                    email: user2.email
                }, function (err, users) {
                    users.should.have.length(0);
                    done();
                });

            });
        });

        it('should be able to save the user', function (done) {
            var _user = new User(user1);
            _user.save(function (err) {
                if (err) {
                    User.remove({}, function (err) {
                        should.not.exist(err);
                    });
                }
                _user.remove();
                done();
            });

        });

        it('should check that roles are assigned and created properly', function (done) {
            var _user = new User(user1);
            _user.save(function (err) {
                should.not.exist(err);

                // the user1 object and users in general are created with only the 'authenticated' role
                _user.hasRole('authenticated').should.equal(true);
                _user.hasRole('admin').should.equal(false);
                _user.isAdmin().should.equal(false);
                _user.roles.should.have.length(1);
                _user.remove(function (err) {
                    should.not.exist(err);
                    done();
                });
            });
        });

        it('should require at least one team to save', function (done) {
            var userWithoutTeam = {};
            // Create a copy of user1 without teams set
            for (var attr in user1) {
                if (user1.hasOwnProperty(attr)) {
                    if (attr !== 'teams') {
                        userWithoutTeam[attr] = user1[attr];
                    }
                }
            }
            // Create new user
            var _user = new User(userWithoutTeam);
            _user.save(function (err) {
                // Verify error
                should.exist(err);
                _user.teams = mongoose.Types.ObjectId();
                // Verify save with team
                _user.save(function (err) {
                    should.not.exist(err);
                    _user.remove(function (err) {
                        should.not.exist(err);
                        done();
                    });
                });
            });
        });

        it('should allow multiple teams for a single user', function (done) {
            // Create new user
            var _user = new User(user1);
            // Add another team
            _user.teams.push(mongoose.Types.ObjectId());
            _user.save(function (err) {
                // Verify save with multiple teams
                _user.save(function (err) {
                    should.not.exist(err);
                    _user.remove(function (err) {
                        should.not.exist(err);
                        done();
                    });
                });
            });
        });

        it('should confirm that password is hashed correctly', function (done) {
            var _user = new User(user1);
            _user.save(function (err) {
                should.not.exist(err);
                _user.hashed_password.should.not.have.length(0);
                _user.salt.should.not.have.length(0);
                _user.authenticate(user1.password).should.equal(true);
                _user.remove(function (err) {
                    should.not.exist(err);
                    done();
                });

            });
        });

        it('should be able to create user and save user for updates without problems', function (done) {

            var _user = new User(user1);
            _user.save(function (err) {
                should.not.exist(err);

                _user.name = 'Full name2';
                _user.save(function (err) {
                    should.not.exist(err);
                    _user.name.should.equal('Full name2');
                    _user.remove(function () {
                        done();
                    });
                });

            });

        });

        it('should fail to save an existing user with the same values', function (done) {

            var _user1 = new User(user1);
            _user1.save();

            var _user2 = new User(user1);

            return _user2.save(function (err) {
                should.exist(err);
                _user1.remove(function () {

                    if (!err) {
                        _user2.remove(function () {
                            done();
                        });
                    }

                    done();

                });

            });
        });

        it('should show an error when try to save without name', function (done) {
            var _user = new User(user1);
            _user.name = '';

            return _user.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should show an error when try to save without password and provider set to local', function (done) {
            var _user = new User(user1);
            _user.password = '';
            _user.provider = 'local';

            return _user.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to to save without password and provider set to twitter', function (done) {
            var _user = new User(user1);

            _user.password = '';
            _user.provider = 'twitter';

            return _user.save(function (err) {
                _user.remove(function () {
                    should.not.exist(err);
                    _user.provider.should.equal('twitter');
                    _user.hashed_password.should.have.length(0);
                    done();
                });
            });
        });

    });

    // source: http://en.wikipedia.org/wiki/Email_address
    describe('Test Email Validations', function () {
        it('Shouldnt allow invalid emails #1', function (done) {
            var _user = new User(user1);
            _user.email = 'Abc.example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #2', function (done) {
            var _user = new User(user1);
            _user.email = 'A@b@c@example.com';
            _user.save(function (err) {
                if (err) {
                    should.exist(err);
                    done();
                } else {
                    _user.remove(function (err2) {
                        should.exist(err);
                        done();
                    });
                }
            });
        });

        it('Shouldnt allow invalid emails #3', function (done) {
            var _user = new User(user1);
            _user.email = 'a"b(c)d,e:f;g<h>i[j\\k]l@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #4', function (done) {
            var _user = new User(user1);
            _user.email = 'just"not"right@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #5', function (done) {
            var _user = new User(user1);
            _user.email = 'this is"not\\allowed@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #6', function (done) {
            var _user = new User(user1);
            _user.email = 'this\\ still\\"not\\allowed@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #7', function (done) {
            var _user = new User(user1);
            _user.email = 'john..doe@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Shouldnt allow invalid emails #8', function (done) {
            var _user = new User(user1);
            _user.email = 'john.doe@example..com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.exist(err);
                        done();
                    });
                } else {
                    should.exist(err);
                    done();
                }
            });
        });

        it('Should save with valid email #1', function (done) {
            var _user = new User(user1);
            _user.email = 'john.doe@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.not.exist(err);
                        done();
                    });
                } else {
                    should.not.exist(err);
                    done();
                }
            });
        });

        it('Should save with valid email #2', function (done) {
            var _user = new User(user1);
            _user.email = 'disposable.style.email.with+symbol@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.not.exist(err);
                        done();
                    });
                } else {
                    should.not.exist(err);
                    done();
                }
            });
        });

        it('Should save with valid email #3', function (done) {
            var _user = new User(user1);
            _user.email = 'other.email-with-dash@example.com';
            _user.save(function (err) {
                if (!err) {
                    _user.remove(function () {
                        should.not.exist(err);
                        done();
                    });
                } else {
                    should.not.exist(err);
                    done();
                }
            });
        });
    });
});

// Clear the users collection
var clearUsers = function () {
    var deferred = q.defer();
    User.remove({}, function (err) {
        if (err) {
            deferred.reject('Could not clear users collection');
        }
    });
    deferred.resolve('tasks cleared');
    return deferred.promise;
};

// Clear the teams collection
var clearTeams = function () {
    var deferred = q.defer();
    Team.remove({}, function (err) {
        if (err) {
            deferred.reject('Could not clear teams collection');
        }
    });
    deferred.resolve('tasks cleared');
    return deferred.promise;
};

describe('User controller', function () {
    describe('create', function () {
        var serverUp, user;

        beforeEach(function (done) {
            q.all([clearTeams(), clearUsers()]).then(function () {
                done();
            });
        });

        beforeEach(function () {
            user = {
                name: 'testy tester',
                email: 'test@test.com',
                password: 'password',
                confirmPassword: 'password'
            };
        });

        it('should require a name for the new user', function (done) {
            delete user.name;
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('You must enter a name');
                return done();
            });
        });

        it('should require an email for the new user', function (done) {
            delete user.email;
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('You must enter a valid email address');
                return done();
            });
        });

        it('should require a password for the new user', function (done) {
            delete user.password;
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('You must enter a password');
                return done();
            });
        });

        it('should require a password that is between 8-100 characters', function (done) {
            user.password = 'a';
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('Password must be between 8-100 characters long');
            });
            // 101 characters
            user.password = 'fejwiofejoigneffwoignewignwoiengoiewngoiwgnewoingwoignewgoinoewingewoignoiwnoiwnwoignewoignewoignewoi';
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('Password must be between 8-100 characters long');
                return done();
            });
        });

        it('should require a matching confirm password for the new user', function (done) {
            user.confirmPassword = 'badPassword';
            server
            .post('/register')
            .send(user)
            .expect(400)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                res.error.text.should.be.equal('Passwords do not match');
                return done();
            });
        });

        it('should create a user and a team for that user together', function (done) {
            server
            .post('/register')
            .send(user)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    should.not.exist(err);
                    return done(err);
                }
                var user = res.body.user;
                // User properties
                user.name.should.be.equal('testy tester');
                user.email.should.be.equal('test@test.com');
                user.roles.length.should.be.equal(1);
                user.roles[0].should.be.equal('authenticated');
                // Check team exists
                user.teams.length.should.be.equal(1);
                // Query the new team and check name

                Team.findOne({
                    _id: user.teams[0]
                }, function (err, team) {
                    team.name.should.be.equal('testy tester\'s Team');
                    done();
                });
            });
        });
    });
});