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
    finishedLoading()
  } else {
    await configureClient();
    finishedLoading()
  }
	updateUI()
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

function finishedLoading() {
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

  //hide testing if Branson/Headlands
  auth0.getIdTokenClaims().then(claims => {
    let roles = claims["http://marintracingapp.org/role"]
    if (roles.includes("headlands") || roles.includes("branson")) {
      $("#testingPanel").remove()
    }
  })
}

document.getElementById("logout").onclick = function() {logout()};

function logout() {
  localStorage.clear()
    auth0.logout({
    	returnTo: window.location.origin
 	 });
}
