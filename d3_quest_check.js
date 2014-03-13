ALL_ACTS = ['act1', 'act2', 'act3', 'act4'];

ACT_NAMES = {
  act1: 'Act I',
  act2: 'Act II',
  act3: 'Act III',
  act4: 'Act IV'
};

ALL_QUESTS = {
  act1: [
    'The Fallen Star',
    'The Legacy of Cain',
    'A Shattered Crown',
    'Reign of the Black King',
    'Sword of the Stranger',
    'The Broken Blade',
    'The Doom in Wortham',
    'Trailing the Coven',
    'The Imprisoned Angel',
    'Return to New Tristram'
  ],
  act2: [
    'Shadows in the Desert',
    'The Road to Alcarnus',
    'City of Blood',
    'A Royal Audience',
    'Unexpected Allies',
    'Betrayer of the Horadrim',
    'Blood and Sand',
    'The Black Soulstone',
    'The Scouring of Caldeum',
    'Lord of Lies'
  ],
  act3: [
    'The Siege of Bastion\'s Keep',
    'Turning the Tide',
    'The Breached Keep',
    'Tremors in the Stone',
    'Machines of War',
    'Siegebreaker',
    'Heart of Sin'
  ],
  act4: [
    'Fall of the High Heavens',
    'The Light of Hope',
    'Beneath the Spire',
    'Prime Evil'
  ]
};

/**
 * Service for battle.net account-related stuff.
 */
AccountSvc = function($routeParams) {
  this.routeParams_ = $routeParams;
};

/**
 * Gets the career profile based on a battle.net ID.
 */
AccountSvc.prototype.getAccountProfileUrl = function() {
  var region = this.routeParams_['region'];
  var bnetId = this.routeParams_['bnetId'];

  if (!(region && bnetId)) {
    console.log('AccountSvc.getAccountProfileUrl: no region or bnetId');
  }
  return 'http://' + region + '.battle.net/api/d3/profile/' + bnetId + '/';
};

/**
 * Gets specific hero info, based on a battle.net ID and a hero ID.
 */
AccountSvc.prototype.getHeroProfileUrl = function() {
  var region = this.routeParams_['region'];
  var bnetId = this.routeParams_['bnetId'];
  var heroId = this.routeParams_['heroId'];

  if (!(region && bnetId && heroId)) {
    console.log('AccountSvc.getAccountProfileUrl: no region or bnetId');
  }

  return 'http://' + region + '.battle.net/api/d3/profile/' + bnetId +
    '/hero/' + heroId;
};


/**
 * Service for checking quest completion.
 */
CheckQuestsSvc = function($http, account) {
  this.http_ = $http;
  this.account_ = account;
  this.heroInfo_ = {};   // just the name for now
  this.rawQuestData_ = {};
  this.completedQuests_ = {};
};

/**
 * Compares quest completion data with the lists of known quests.
 */
CheckQuestsSvc.prototype.checkQuestCompletion_ = function() {
  for (var i = 0; i < ALL_ACTS.length; i++) {
    var act = ALL_ACTS[i];

    // Create quest -> status assoc array; initialize as incomplete
    var allActQuests = ALL_QUESTS[act];
    var completedInAct = {};
    for (var j = 0; j < allActQuests.length; j++) {
      var questName = allActQuests[j];
      completedInAct[questName] = false;
    }

    // Compare with battle.net data and mark all completed quests
    var completedActQuests = this.rawQuestData_[act]['completedQuests'];
    for (var j = 0; j < completedActQuests.length; j++) {
      var questName = completedActQuests[j]['name'];
      completedInAct[questName] = true;
    }
    this.completedQuests_[act] = completedInAct;
  }
};

/**
 * Fetches and computes quest completion status.
 */
CheckQuestsSvc.prototype.checkQuests = function() {
  this.http_.jsonp(this.account_.getHeroProfileUrl() + '?callback=JSON_CALLBACK').
    success(function(data) {
      var heroInfo = {
        name: data['name']
      };
      angular.copy(data['progress']['normal'], this.rawQuestData_);
      angular.copy(heroInfo, this.heroInfo_);
      this.checkQuestCompletion_();
    }.bind(this));
};

/**
 * Getter for quest completion info.
 */
CheckQuestsSvc.prototype.getQuestInfo = function() {
  return this.completedQuests_;
};

/**
 * Getter for general hero info.
 */
CheckQuestsSvc.prototype.getHeroInfo = function() {
  return this.heroInfo_;
};

AccountInputCtrl = function(account) {
};

HeroSelectCtrl = function(account) {
};

/**
 * Controller for the quest completion template
 */
QuestStatusCtrl = function(quests) {
  quests.checkQuests();
  this.actIds = ALL_ACTS;
  this.actNames = ACT_NAMES;
  this.questNames = ALL_QUESTS;
  this.questData = quests.getQuestInfo();
  this.heroInfo = quests.getHeroInfo();
};


/**
 * Routes
 */
routeCfg = function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'account_form.html',
    controller: 'AccountInputCtrl',
    controllerAs: 'accountInput'
  });
  
  $routeProvider.when('/:region/:bnetId', {
    templateUrl: 'hero_form.html',
    controller: 'HeroSelectCtrl',
    controllerAs: 'heroSelect'
  });

  $routeProvider.when('/:region/:bnetId/:heroId', {
    templateUrl: 'quest_status.html',
    controller: 'QuestStatusCtrl',
    controllerAs: 'questStatus'
  });
  
  $routeProvider.otherwise({
    redirectTo: '/'
  });
};

var mod = angular.module('d3QuestCheck', ['ngRoute']);
mod.config(routeCfg);
mod.controller('AccountInputCtrl', AccountInputCtrl);
mod.controller('HeroSelectCtrl', HeroSelectCtrl);
mod.controller('QuestStatusCtrl', QuestStatusCtrl);
mod.service('quests', CheckQuestsSvc);
mod.service('account', AccountSvc);
