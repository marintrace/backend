const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
	console.log(isAuthenticated)
	if (isAuthenticated) {
		//const token = await auth0.getTokenSilently()
		//authToken = token

		const claims = await auth0.getIdTokenClaims();
		authToken = claims.__raw
	} else {
		window.location = 'index.html'; //If User is not logged in, redirect to login page
	}
};

window.onload = async () => {
  markAllAsLoading()
  if (typeof authToken !== "undefined") {
    await updateUI()
    finishedLoading()
  } else {
    await configureClient();
    await updateUI()
    finishedLoading()
  }
}

function markAllAsLoading() {
  $('#negativeTrigger').addClass('disabled')
  $('#negativeTrigger').html(`Loading...`);

  $('#positiveTrigger').addClass('disabled')
  $('#positiveTrigger').html(`Loading...`);

  $('#reportContacts').addClass('disabled')
  $('#reportContacts').html(`Loading...`);

  $('#reportSymptoms').addClass('disabled')
  $('#reportSymptoms').html(`Loading...`);

  $('#triggerStatus').addClass('disabled')
  $('#triggerStatus').html(`Loading...`);
}

//public vars that can be accessed by other classes
var userVaccinated = false
var userIsTilden = false

async function finishedLoading() {
  //config on school by school basis
  await auth0.getIdTokenClaims().then(claims => {
    let roles = claims["http://marintracingapp.org/role"]

    //hide testing if Branson/Headlands
    if (roles.includes("headlands") || roles.includes("branson") | roles.includes("branson-summer") | roles.includes("ngs")) {
      $("#testingPanel").remove()
    }

    if (roles.includes("tilden-albany") || roles.includes("tilden-walnut-creek")) {
      userIsTilden = true
    }
  })

  if (userIsTilden) {
    setupTildenQuestionnaire() //setup form for tilden
    await getUserStatus(tildenVaccineConfig) //pull down vaccine status and hide symptoms if vaccinated
  }

  $("#negativeTrigger").removeClass("disabled")
  $("#negativeTrigger").html("Report negative test »")

  $("#positiveTrigger").removeClass("disabled")
  $("#positiveTrigger").html("Report positive test »")

  $("#reportContacts").removeClass("disabled")
  $("#reportContacts").html("Report contacts »")

  $("#reportSymptoms").removeClass("disabled")
  $("#reportSymptoms").html("Report symptoms »")

  $("#triggerStatus").removeClass("disabled")
  $("#triggerStatus").html("View status card »")
}

function setupTildenQuestionnaire() {
  $("#travelLabel").text("I have travelled internationally in the last 5 days") //change travel question
  $("#difficulty_breathing").parent().hide() //shorten symptom list
  $("#fatigue").parent().hide()
  $("#headache").parent().hide()
  $("#congestion_runny_nose").parent().hide()
  $("#nausea_vomiting").parent().hide()
  $("#diarrhea").parent().hide()
  $("#muscle_body_aches").parent().hide()
}

async function tildenVaccineConfig(vaccineStatus) {
  let entry_data = vaccineStatus[vaccineStatus.reason]
  if (entry_data.criteria.includes("Fully Vaccinated")) {
    userVaccinated = true
    $("#symptomQuestions").hide()
  }
}

document.getElementById("logout").onclick = function() {logout()};

function logout() {
  localStorage.clear()
    auth0.logout({
    	returnTo: window.location.origin
 	 });
}
