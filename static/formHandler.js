//function for binding to the onclick of the scientist/developer
//radio in the sign-up and user profile form; displays the rest of the form the
//first time a profession is chosen during signup, and ensures the profession-
//dependent labels for all further questions is correctly inserted.
function manageUserForm(){
	var wrapperDiv = document.getElementById('registrationDetails')
	,	isScientist
	,	disciplineText = document.getElementById('disciplineText')
	,	languageText = document.getElementById('languageText')
	,	affiliationText = document.getElementById('affiliation')
	,	paidText = document.getElementById('isPaid')
	,	yesPaidText = document.getElementById('yesPaid')
	,	noPaidText = document.getElementById('noPaid')

	//switch the details section of the form to opacity=1 and allow height expansion:
	if(wrapperDiv)
		wrapperDiv.setAttribute('style', 'max-height: 10000px; opacity: 1');

	//determine which radio button got clicked:
	isScientist = document.getElementById('science').checked

	//set the question text as a function of profession:
	if(isScientist){
		disciplineText.innerHTML = '*What is your discipline?';
		languageText.innerHTML = '*What languages would you like to work in?';
		affiliationText.innerHTML = '*What sort of organization are you affiliated with?  Check all that apply.'
		paidText.innerHTML = '*Are you currently offering any paid positions for developers?';
		yesPaidText.innerHTML = 'Yes we are!';
		noPaidText.innerHTML = 'Not at this time.';
	} else {
		disciplineText.innerHTML = '*What disciplines interest you?';
		languageText.innerHTML = '*What languages are you comfortable working in?';
		affiliationText.innerHTML = '*What sort of affiliations are you interested in working with?  Check all that apply.';
		paidText.innerHTML = '*Are you only interested in paid positions, or is a volunteer engagement possible?';
		yesPaidText.innerHTML = 'Paid positions only, please.'
		noPaidText.innerHTML = 'I might have some volunteer time available.'
	}
} 

//validate user profile forms
function profileValidation(){
	var allOK = true
	,	pass = document.getElementById('pass')
	,	repass = document.getElementById('repass')
	,	disciplines = document.querySelectorAll('input[name="discipline[]"]')
	,	disciplineChosen = false
	,	languages = document.querySelectorAll('input[name="language[]"]')
	,	languageChosen = false
	,	altDiscipline = otherDisc.value
	,	altLanguage = otherLang.value
	,	affiliations = document.querySelectorAll('input[name="affiliation[]"]')
	,	affiliationChosen = false
	,	passError = document.getElementById('passError')
	,	disciplineError = document.getElementById('disciplineError')
	, 	languageError = document.getElementById('languageError')

	//demand password match
	if(pass){
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
	}

	//demand at least one member of each checkbox group is checked, and / or the 'other' field is filled out:
	[].forEach.call(disciplines, function(discipline){
		disciplineChosen = disciplineChosen || discipline.checked;
	});

	if(!disciplineChosen && !altDiscipline){
		allOK = false;
		disciplineError.style.display = 'block';
	} else {
		disciplineError.style.display = 'none';
	}

	[].forEach.call(languages, function(language){
		languageChosen = languageChosen || language.checked;
	});
	if(!languageChosen && !altLanguage){
		allOK = false;
		languageError.style.display = 'block';
	} else {
		languageError.style.display = 'none';
	}

	[].forEach.call(affiliations, function(affiliation){
		affiliationChosen = affiliationChosen || affiliation.checked;
	});
	if(!affiliationChosen){
		allOK = false;
		affiliationError.style.display = 'block';
	} else {
		affiliationError.style.display = 'none';
	}

	//return to top of form if mistakes present
	if(!allOK)
		document.body.scrollTop = document.documentElement.scrollTop = 0;

	//turn off email & name error - server will turn it back on if necessary
	if(document.getElementById('emailError'))
		document.getElementById('emailError').style.display = 'none';
	if(document.getElementById('uNameError'))
		document.getElementById('uNameError').style.display = 'none';	

	return allOK;
}

//expand the registration / user profile form to add another description/link pair
function appendURL(){
	var title = document.createElement('label')
	,	description = document.createElement('input')
	,	URL = document.createElement('input')
	,	addButton = document.getElementById('addURL');

	title.innerHTML = 'Link:';

	description.type = 'text';
	description.name = 'linkDescription[]';
	description.placeholder = 'Description';

	URL.type = 'url';
	URL.name = 'link[]';
	URL.placeholder = 'URL';
	URL.onchange = tweakURL.bind(URL);

	addButton.parentNode.insertBefore(title, addButton);
	addButton.parentNode.insertBefore(description, addButton);
	addButton.parentNode.insertBefore(URL, addButton);
}

//help format URLs correctly
function tweakURL(){
	if(this.value.indexOf('http') != 0 && this.value != '')
		this.value = 'http://' + this.value;
}
