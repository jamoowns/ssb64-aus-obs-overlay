var results = [];
var brackets = [];
var groups = [];
var EventName = "";

//JSON file containing ticker data pulled from Skynet
var TickerJSON = "../z_Dependencies/ticker.txt";

function setTicker() {
	xmlHttp=new XMLHttpRequest();
	xmlHttp.open("GET",TickerJSON,false);
	xmlHttp.send();
	
	$("#Breaking_News").html(xmlHttp.responseText);
}

function setTicker2() {
	var matches = "";
	for (var key in results) {
	    var i = 0;
		while (i<brackets.length) {
			if (brackets[i][0]==results[key][0] && brackets[i][1]>0) {
				matches = matches + results[key][1] + ",&nbsp;&nbsp;&nbsp;";
			}
			i++;
		}
	}
	var padding = "";
	var i = 0;
	while (i<($('#Breaking_News_Wrapper').width()/3)) {
		padding = padding + "&nbsp;";
		i++;
	}
	$("#Breaking_News").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + matches + padding);
}

function getTickerData() {

}

function InitialTicker() {
	$.getJSON(TickerJSON, function(d){		
		brackets[0] = [parseInt(d.bracket1) || 0, parseInt(d.showBracket1)];
		brackets[1] = [parseInt(d.bracket2) || 0, parseInt(d.showBracket2)];
		brackets[2] = [parseInt(d.bracket3) || 0, parseInt(d.showBracket3)];
		brackets[3] = [parseInt(d.bracket4) || 0, parseInt(d.showBracket4)];
		brackets[4] = [parseInt(d.bracket5) || 0, parseInt(d.showBracket5)];
		brackets[5] = [parseInt(d.bracket6) || 0, parseInt(d.showBracket6)];
		brackets[6] = [parseInt(d.bracket7) || 0, parseInt(d.showBracket7)];
		brackets[7] = [parseInt(d.bracket8) || 0, parseInt(d.showBracket8)];
		brackets[8] = [parseInt(d.bracket9) || 0, parseInt(d.showBracket9)];
		brackets[9] = [parseInt(d.bracket10) || 0, parseInt(d.showBracket10)];
		
	});

	$("#Breaking_News").delay(600).transition({opacity: '1'}, 600);

	setInterval (function() { UpdateTicker(); }, 5000);
}

function UpdateTicker() {
	$.getJSON(TickerJSON, function(d){
		
		if (d.EventName!=EventName) {
			EventName = d.EventName;
			$.getJSON("https://cors.io/?https://api.smash.gg/tournament/" + EventName + "?expand[]=event&expand[]=phase&expand[]=groups&expand[]=seeds&expand[]=sets", function(f){
				var group = f.entities.groups;
				var k = 0;
				while (k<group.length) {
					groups[group[k].id]=group[k].phaseId;
					k++;
				}
			});
		}

		brackets[0] = [parseInt(d.bracket1) || 0, parseInt(d.showBracket1)];
		brackets[1] = [parseInt(d.bracket2) || 0, parseInt(d.showBracket2)];
		brackets[2] = [parseInt(d.bracket3) || 0, parseInt(d.showBracket3)];
		brackets[3] = [parseInt(d.bracket4) || 0, parseInt(d.showBracket4)];
		brackets[4] = [parseInt(d.bracket5) || 0, parseInt(d.showBracket5)];
		brackets[5] = [parseInt(d.bracket6) || 0, parseInt(d.showBracket6)];
		brackets[6] = [parseInt(d.bracket7) || 0, parseInt(d.showBracket7)];
		brackets[7] = [parseInt(d.bracket8) || 0, parseInt(d.showBracket8)];
		brackets[8] = [parseInt(d.bracket9) || 0, parseInt(d.showBracket9)];
		brackets[9] = [parseInt(d.bracket10) || 0, parseInt(d.showBracket10)];
	});
	
	setTicker();

}	

function FetchResults() {
			for (var h in groups) {
				var j = 0;
				while (j<brackets.length) {
					if (brackets[j][0]==groups[h] && groups[h]>0 && brackets[j][0]>0 && brackets[j][1]>0) {
						$.getJSON("https://cors.io/?https://api.smash.gg/phase_group/" + h + "?expand%5B%5D=sets&expand%5B%5D=standings&expand%5B%5D=seeds", 
							function(f){
								var tempKey = 0;
								var entrants = f.entities.seeds;
								var sets = f.entities.sets;
								var id = f.entities.groups.id;
								var phaseid = f.entities.groups.phaseId;
								var entrantId;
								var i = 0;
								var count = 0;
								var entrantArr = [];
								var winner_score;
								var loser_score;
								while (i<entrants.length) {
									for (var key in entrants[i].mutations.participants) {
										for (var key2 in entrants[i].mutations.entrants) {
											if (entrants[i].mutations.entrants[key2].participantIds[0]==key) {
												entrantArr[entrants[i].mutations.entrants[key2].id]=entrants[i].mutations.participants[key].gamerTag;
											}
										}
									}
									i++;
								}
								i = 0;
								while (i<sets.length) {
									if (sets[i].winnerId!=null && sets[i].loserId!=null) {
										if (sets[i].winnerId==sets[i].entrant1Id) {
											winner_score = sets[i].entrant1Score;
											loser_score = sets[i].entrant2Score;
										} else {
											loser_score = sets[i].entrant1Score;
											winner_score = sets[i].entrant2Score;
										}
										results[sets[i].id] =  [phaseid, entrantArr[sets[i].winnerId] + " DEFEATS " + entrantArr[sets[i].loserId] + " (" + winner_score + "-" + loser_score + ")"];
										count++;
									}
									i++;
								}
							}
						);
					}
					j++;
				}
			}
			
}

