//function for binding to the onclick of the scientist/developer
//radio in the sign-up form; displays the rest of the form the
//first time a profession is chosen, and ensures the profession-
//dependent labels for all further questions is correctly inserted.
function manageSignupForm(){
	var wrapperDiv = document.getElementById('registrationDetails')
	,	isScientist
	,	disciplineText = document.getElementById('disciplineText')
	,	languageText = document.getElementById('languageText');

	//switch the details section of the form to opacity=1 and allow height expansion:
	wrapperDiv.setAttribute('style', 'max-height: 2000px; opacity: 1');

	//determine which radio button got clicked:
	isScientist = document.getElementById('science').checked

	//set the question text as a function of profession:
	if(isScientist){
		disciplineText.innerHTML = 'What is your discipline?';
		languageText.innerHTML = 'What languages would you like to work in?';
	} else {
		disciplineText.innerHTML = 'What disciplines interest you?';
		languageText.innerHTML = 'What languages are you comfortable working in?'
	}
} 