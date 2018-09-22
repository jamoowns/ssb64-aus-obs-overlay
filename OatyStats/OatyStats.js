/** Defining constants. */
const START_OF_YEAR = (new Date((new Date()).getFullYear(), 0)).getTime() / 1000;
const SSB64_GAME_ID = 4;
const SINGLES_EVENT_ID = 1;

/** Classes. */
var EventType = Object.freeze({"SETS":1, "MATCHES":2, "INFO":3, "DEBUG":4})

class Set {
    /**
     * @param {Date} date Date of the set
     * @param {number} p1Id Player1Id
     * @param {number} p1Score Player1Score
     * @param {number} p2Id Player2Id
     * @param {number} p2Score Player2Score
     */
    constructor(date, p1Id, p1Score, p2Id, p2Score){
      this.date = date;
      // this.tourniName = tourniName;
      this.p1Id = p1Id;
      this.p1Score = p1Score;
      this.p2Id = p2Id;
      this.p2Score = p2Score;
    }

    /**
     * @returns {Date} Date of set
     */
    getDate(){
      return this.date;
    }

    getTournamentName(){
      return this.tourniName;
    }

    /**
     * @param {number} p1Id Player1 id
     * @param {number} p2Id Player2 id
     * @returns {boolean} true if set has both players
     */
    hasPlayers(p1Id, p2Id){
      if (this.getP1Id() == p1Id && this.getP2Id() == p2Id){
        return true;
      } else if (this.getP1Id() == p2Id && this.getP2Id() == p1Id){
        return true;
      } else {
        return false;
      }
    }
    /**
     * @param {number} playerId playerId to get score for
     * @returns {number} score of the given player
     */
    getScore(playerId){
      if (this.getP1Id() == playerId){
        return this.getP1Score();
      } else if (this.getP2Id() == playerId){
        return this.getP2Score();
      }
    }
    
    /**
     * @returns {number} the losers player id
     */
    getLoserId(){
      if (this.getP1Score() > this.getP2Score()){
        return this.getP2Id();
      } else {
        return this.getP1Id();
      }
    }

    /**
     * @returns {number} the losers winners id
     */
    getWinnerId(){
      if (this.getP1Score() > this.getP2Score()){
        return this.getP1Id();
      } else {
        return this.getP2Id();
      }
    }
    
    /**
     * @returns {number} Player 1's id
     */
    getP1Id() {
      return this.p1Id;
    }

    /**
     * @returns {number} Player 2's id
     */
    getP2Id() {
      return this.p2Id;
    }

    /**
     * @returns {number} Player 1's score
     */
    getP1Score() {
      return this.p1Score;
    }

    /**
     * @returns {number} Player 2's score
     */
    getP2Score() {
      return this.p2Score;
    }
}

class Score {
    constructor(p1Score, p2Score){
      this.p1Score = p1Score;
      this.p2Score = p2Score;
    }

    getP1Score() {
      return this.p1Score;
    }

    getP2Score() {
      return this.p2Score;
    }

    addP1Score(score) {
      if (typeof score !== "undefined") {
        this.p1Score+=score;
      } else {
        this.p1Score++;
      }
    }

    addP2Score(score) {
      if (typeof score !== "undefined") {
        this.p2Score+=score;
      } else {
        this.p2Score++;
      }
    }

    addScore(score) {
      this.p1Score+=score.getP1Score();
      this.p2Score+=score.getP2Score();
    }
}

class LoadingEvent {
    constructor(eventType, message){
      this.eventType = eventType;
      this.message = message;
    }

    getEventType() {
      return this.eventType;
    }

    getMessage() {
      return this.message;
    }
}

class HeadToHeadDetails {
  setSetCount(count){
    this.setCount = count;
  }

  getSetCount() {
    return this.setCount;
  }

  setMatchCount(count){
    this.matchCount = count;
  }

  getMatchCount() {
    return this.matchCount;
  }

  setMostRecentWins(recentWins) {
    this.recentWins = recentWins;
  }

  /**
   * @returns {[Date, Date]} a tuple containing P1 then P2 most recent wins
   */
  getMostRecentWins() {
    return this.recentWins;
  }
}

/** -----Variables.----- */

/** Local cache of playerIds so we don't always have to poll smashGG. */
var playerIdCache = {};
var phaseGroupCache = {};

var loadingEventCb;

/**
  * Get the Player id given a gamerTag and phase group.
  *
  * @param {number} phase_group phasegroup to search in
  * @param {number} gamerTag gamer tag to look for
  * @return {number} playerId or -1 if not found
  */
async function getPlayerIdFromTagInGroup(phase_group, gamerTag) {
    // Check if we have already cached this playerId
    let playerId = playerIdCache[gamerTag];
    if (typeof playerId !== "undefined") {
        return playerId;
    }
    // If not, find from smashgg.
    let response = await fetch("https://cors.io/?https://api.smash.gg/phase_group/" + phase_group + "?expand%5B%5D=entrants");
    let f = await response.json();

    var players = f.entities.player;
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.gamerTag == gamerTag) {
            // Cache the playerId for future use.
            playerIdCache[gamerTag] = player.id;
            return player.id;
        }
    }

    return -1;
}

/**
  * Get the Player id given an entrantID and phase group.
  *
  * @param {number} phase_group phasegroup to search in
  * @param {number} entrantId entrantId to look for
  * @return {number} playerId or -1 if not found
  */
async function getPlayerIdFromEntrant(phase_group, entrantId) { // Gets the player Id from an entrant id
    let response = await fetch("https://cors.io/?https://api.smash.gg/phase_group/" + phase_group + "?expand%5B%5D=entrants");
    let f = await response.json();

    var entrants = f.entities.entrants;
    for (var i = 0; i < entrants.length; i++) {
        var entrant = entrants[i];
        if (entrant.id == entrantId) {
            return entrant.playerIds[entrant.participantIds[0]];
        }
    }
    return -1;
}

/**
  * Looks up an item in a collection based on a given attribute.
  * (Ok javascript is kinda groovy...)
  *
  * @param {Array} collection collection to look in
  * @param {string} attributeId attribute of collection we are concerned with
  * @param {string} value what we are looking for
  * @return {any} collection item if found
  * @throws {TypeError} If a collection item does not have the [attributeId] property
  */
function getByAttribute(collection, attributeId, value){
    for (var i = 0; i < collection.length; i++) {
        var item = collection[i];
        if (item[attributeId] == value) {
            return item;
        }
    }
}

/**
  * Determine whether a given date is this year.
  *
  * @param {Date} date date to check
  * @return {boolean} true if this year, false otherwise
  */
function isDateThisYear(date){
    // Check the date of the given tournament
    if (date < START_OF_YEAR) {
        return false;
    } else {
        return true;
    }
}

/**
  * Use the defined callback to send an event.
  *
  * @param {EventType} eventType type of event created
  * @param {string} message event message
  */
function sendEvent(eventType, message){
    loadingEventCb(new LoadingEvent(eventType, message));
}

/**
  * Gets the matchup set count between two players.
  * 
  * @param {int} pId PlayerId of player1
  * @param {int} oId PlayerId of player2
  * @return {HeadToHeadDetails} Head to head details of the two players
  */
async function getMatchupData(pId, oId){
    let response = await fetch("https://cors.io/?https://api.smash.gg/player/" + pId);
    let f = await response.json();
    var setScore = new Score(0, 0);
    var matchScore = new Score(0, 0);

    var attendees = f.entities.attendee;
    var total = attendees.length;

    var p1MostRecentWin = new Date(0);
    var p2MostRecentWin = new Date(0);

    for (var i = 0; i < total; i++) {
        sendEvent(EventType.SETS, (i+1) + "/" + total);

        var attendee = attendees[i];
        var tournaments = f.entities.tournament;
        var tournament = getByAttribute(tournaments, 'id', attendee.tournamentId);

        // If tourni not found skip it (This shouldn't happen...)
        if (typeof tournament === "undefined"){
            continue;
        }
        // Ignore tournaments from the previous year.
        if (!isDateThisYear(tournament.endAt)){
            continue;
        }

        var events = attendee.events;
        // Get the SSB64 events only.
        for (var k = 0; k < events.length; k++) {
            var event = events[k];
            if (event.videogameId == SSB64_GAME_ID && event.type == SINGLES_EVENT_ID) {
                var pools = attendee.pools;
                // Ensure the tournament has some pools.
                if (typeof pools === "undefined"){
                    continue;
                }

                var setsInPool = await getAllSetsInPool(pools, event.id);

                let setCount = getSetWins(setsInPool, pId, oId);
                let matchCount = getGameWins(setsInPool, pId, oId);

                let recentWinsDate = getMostRecentWins(setsInPool, pId, oId);

                if (p1MostRecentWin < recentWinsDate[0]){
                    p1MostRecentWin = recentWinsDate[0];
                    // TODO: Cleanup win date code.
                    // TODO: Implement P1 and P2 score setting.
                }
                if (p2MostRecentWin < recentWinsDate[1]){
                    p2MostRecentWin = recentWinsDate[1];
                }

                setScore.addScore(setCount);
                matchScore.addScore(matchCount);
            }
        }
    }
    let h2h = new HeadToHeadDetails();
    h2h.setSetCount(setScore);
    h2h.setMatchCount(matchScore);
    h2h.setMostRecentWins([p1MostRecentWin, p2MostRecentWin]);

    return h2h;
}

/**
 * Gets all the sets in a given pool.
 * 
 * @param {Array} pools The list of pools 
 * @param {int} eventId The event we are concerned with
 * @returns {Set[]} all sets in the pool
 */
async function getAllSetsInPool(pools, eventId){
  let phaseGroupData = [];
  // Loop through all pools (Phase groups).
  for (var k = 0; k < pools.length; k++) {
    let phaseGroup = pools[k];
    if (phaseGroup.eventId == eventId) {
        // One of the phase group ids.
        let newData = await getAllSetsInPhaseGroup(phaseGroup.phaseGroupId);
        phaseGroupData = phaseGroupData.concat(newData);
    }
  }
  return phaseGroupData;
}

/**
  * Gets the id of a player given an entrantId in a list of entrants.
  *
  * @param {Array} entrants list of entrants to search through
  * @param {number} entrantId the id to find
  * @return {number} the player id, or -1 if not found
  */
function pIdFromEntrants(entrants, entrantId){
    var entrant = getByAttribute(entrants, "id", entrantId);
    if (typeof entrant !== "undefined"){
        return entrant.playerIds[entrant.participantIds[0]];
    }
    return -1;
}

/**
  * Gets all the sets from a phase group.
  *
  * @param {number} phaseGroupId the phase group id to get sets for
  * @return {Set[]} the list of sets
  */
async function getAllSetsInPhaseGroup(phaseGroupId) {
    // Check the phaseGroup cache.
    let phaseGroupData = phaseGroupCache[phaseGroupId];
    if (typeof phaseGroupData !== "undefined") {
        return phaseGroupData;
    }

    let response = await fetch("https://cors.io/?https://api.smash.gg/phase_group/" + phaseGroupId + "?expand%5B%5D=sets&expand%5B%5D=entrants");
    let f = await response.json();

    var sets = [];
    
    for (var i = 0; i < f.entities.sets.length; i++) {
      
      let set = f.entities.sets[i];

      let p1Id = pIdFromEntrants(f.entities.entrants, set.entrant1Id);
      let p2Id = pIdFromEntrants(f.entities.entrants, set.entrant2Id);
      sets.push(new Set(set.completedAt, p1Id, set.entrant1Score, p2Id, set.entrant2Score));
    }

    // Caching the phaseGroup sets for future lookups.
    phaseGroupCache[phaseGroupId] = sets;
    return sets;
}

/**
 * Get the most recent wins for two players
 * 
 * @param {Set[]} sets Array of sets to look through
 * @param {number} pId Player1's id
 * @param {number} oId Player2's id
 * @returns {[Date, Date]} First item is Player1id, second is Player2id
 */
function getMostRecentWins(sets, pId, oId) {
    var p1MostRecentWin = new Date(0);
    var p2MostRecentWin = new Date(0);
    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];

        if (set.hasPlayers(pId, oId)) {
          if (set.getWinnerId() == pId) {
            if (p1MostRecentWin < set.getDate()){
                p1MostRecentWin = new Date(set.getDate() * 1000);
            }
          } else {
            if (p2MostRecentWin < set.getDate()){
                p2MostRecentWin = new Date(set.getDate() * 1000);
            }
          }
        }
    }
    return [p1MostRecentWin, p2MostRecentWin];
}

/**
  * Gets the game count between two players in a given phase group.
  *
  * @param {Set[]} sets list of sets to sum
  * @param {number} pId id of player1
  * @param {number} oId id of player2 (opponent)
  * @return {Score} A Score of the p1 and p2 wins
  */
function getGameWins(sets, pId, oId){
  var pWinCount = 0;
  var oWinCount = 0;

  for (var i = 0; i < sets.length; i++) {
      var set = sets[i];

      if (set.hasPlayers(pId, oId)) {
        pWinCount+=set.getScore(pId);
        oWinCount+=set.getScore(oId);
      }
  }
  return new Score(pWinCount, oWinCount);
}

/**
  * Gets the set count between two players in a given phase group.
  *
  * @param {Set[]} sets list of sets
  * @param {number} pId id of player1
  * @param {number} oId id of player2 (opponent)
  * @return {Score} P1 and P2 set wins
  */
function getSetWins(sets, pId, oId){
    var pWinCount = 0;
    var oWinCount = 0;

    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];

        if (set.hasPlayers(pId, oId)) {
          if (set.getWinnerId() == pId){
            pWinCount++;
          } else {
            oWinCount++;
          }
        }
    }
    return new Score(pWinCount, oWinCount);
}

/**
  * Get the Player id given a gamerTag and tournament.
  *
  * @param {number} tournamentSlug tournament to search in
  * @param {number} gamerTag gamer tag to look for
  * @return {number} playerId or -1 if not found
  */
async function getPlayerIdFromTagInTournament(tournamentSlug, gamerTag){
    // Check if we have already cached this playerId
    let playerId = playerIdCache[gamerTag];
    if (typeof playerId !== "undefined") {
        return playerId;
    }
    // If not, find from smashgg.
    let response = await fetch("https://cors.io/?https://api.smash.gg/tournament/" + tournamentSlug + "?expand%5B%5D=event&expand%5B%5D=phase&expand%5B%5D=groups");
    let f = await response.json();

    playerId = -1;

    let events = f.entities.event.filter(event => event.videogameId == SSB64_GAME_ID);
    for (var i = 0; i < events.length; i++) {
      let event = events[i];

      let phases = f.entities.phase.filter(phase => phase.eventId == event.id);
      for (var j = 0; j < phases.length; j++) {
        let phase = phases[j];

        let groups = f.entities.groups.filter(group => group.phaseId == phase.id);

        for (var k = 0; k < groups.length; k++) {
          playerId = await getPlayerIdFromTagInGroup(groups[k].id, gamerTag);
          if (playerId != -1) {
            return playerId;
          }
        }
      }
    }

    return -1;
}

/**
  * Gets the head to head stats of two players.
  *
  * @param {string} p1Gamertag Player1 gamertag
  * @param {string} p2Gamertag Player2 gamertag
  * @param {string} tournamentSlug tournament that both players have to be in
  * @param {Callback} loadingCallbackFn function that is called when a loading event has occured.
  * @return {HeadToHeadDetails} of the two given players
  */
async function getHeadToHead(p1Gamertag, p2Gamertag, tournament, loadingCallbackFn){
    // TODO: Make an Loading callback interface.
    loadingEventCb = loadingCallbackFn;

    sendEvent(EventType.INFO, "Loading Started.");
    let player1Id = await getPlayerIdFromTagInTournament(tournament, p1Gamertag);
    let player2Id = await getPlayerIdFromTagInTournament(tournament, p2Gamertag);

    let matchupData = await getMatchupData(player1Id, player2Id);
    sendEvent(EventType.INFO, "Loading Complete");

    return matchupData;
}