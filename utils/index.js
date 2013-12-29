////////////////////////////////////////////////////////
//helper functions//////////////////////////////////////
////////////////////////////////////////////////////////

//compare two users, return bool indicating match
function isMatch(user1, user2){
/*
	//bail if both users have the same profession
	if( (user1.scientist && user2.scientist) || (!user1.scientist && !user2.scientist) ) return false;
	if( (user1.developer && user2.developer) || (!user1.developer && !user2.developer) ) return false;

	//look for a language match
	if( !arrayIntersect(user1.language, user2.language) ) return false;

	//look for a discipline match
	if( !arrayIntersect(user1.discipline, user2.discipline) ) return false;	

	//all arrays intersect, a match is found!
*/
	return true;
	
}
exports.isMatch = isMatch;

//given two arrays, return true iff they share at least one element
function arrayIntersect(arr1, arr2){
	var i, j;

	//walk through all arrays and compare all elements; bail with return true as soon as any match is found
	for(i=0; i<arr1.length; i++){
		for(j=0; j<arr2.length; j++){
			if(arr1[i] === arr2[j]) return true;
		}
	}

	//nope:
	return false;
}
exports.arrayIntersect = arrayIntersect;