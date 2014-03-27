//function for binding to the onclick of the scientist/developer
//radio in the sign-up and user profile form; displays the rest of the form the
//first time a profession is chosen during signup, and ensures the profession-
//dependent labels for all further questions is correctly inserted.
function manageUserForm(){
	var wrapperDiv = document.getElementById('registrationDetails')
	,	isScientist
	,	disciplineText = document.getElementById('disciplineText')
	,	languageText = document.getElementById('languageText');

	//switch the details section of the form to opacity=1 and allow height expansion:
	if(wrapperDiv)
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

//validate the signup form before submission
function signupValidation(){
	var allOK = true
	,	pass = document.getElementById('pass')
	,	repass = document.getElementById('repass')
	,	disciplines = document.querySelectorAll('input[name="discipline[]"]')
	,	disciplineChosen = false
	,	languages = document.querySelectorAll('input[name="language[]"]')
	,	languageChosen = false
	,	passError = document.getElementById('passError')
	,	disciplineError = document.getElementById('disciplineError')
	, 	languageError = document.getElementById('languageError')

	//demand password match
	if(pass.value != repass.value){
		allOK = false;
		pass.style.border = '2px solid #FF0000';
		repass.style.border = '2px solid #FF0000';
		passError.style.display = 'block';
	} else {
		pass.style.border = ''
		repass.style.border = ''
		passError.style.display = 'none';
	}

	//demand at least one member of each checkbox group is checked
	[].forEach.call(disciplines, function(discipline){
		disciplineChosen = disciplineChosen || discipline.checked;
	});
	if(!disciplineChosen){
		allOK = false;
		disciplineError.style.display = 'block';
	} else {
		disciplineError.style.display = 'none';
	}

	[].forEach.call(languages, function(language){
		languageChosen = languageChosen || language.checked;
	});
	if(!languageChosen){
		allOK = false;
		languageError.style.display = 'block';
	} else {
		languageError.style.display = 'none';
	}

	//return to top of form if mistakes present
	if(!allOK)
		document.body.scrollTop = document.documentElement.scrollTop = 0;

	//turn off email error - server will turn it back on if necessary
	if(document.getElementById('emailError'))
		document.getElementById('emailError').style.display = 'none';

	return allOK;
}