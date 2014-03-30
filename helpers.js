module.exports = {
	//take a string and return it all lower case except the first letter, also trim leading and trailing spaces
	'cleanCase' : function(inString){
		var outString = inString.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase();

		outString = outString.slice(0,1).toUpperCase() + outString.slice(1);

		return outString
	},

	//search results should have newest on top; all profiles have a .timeCreated member == Date.now() upon creation, sort by this. 
	'sortByTimestamp' : function(a,b){
		if (a.timeCreated && b.timeCreated){
			return b.timeCreated - a.timeCreated
		} else if(a.timeCreated) return -1
		else if(b.timeCreated) return 1
		else return 0;
	},

	'buildLinkTable' : function(descriptions, links){
		var scrubbedDescriptions = []
		,	scrubbedLinks = []
		,	i;

		for(i=0; i<descriptions.length; i++){
			if(descriptions[i] != "" || links[i] != ""){
				scrubbedDescriptions = scrubbedDescriptions.concat(descriptions[i]);
				scrubbedLinks = scrubbedLinks.concat(links[i]);
			}
		}

		return [scrubbedDescriptions, scrubbedLinks];
	}
}