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
  	await configureClient();
	updateUI()
}

document.getElementById("logout").onclick = function() {logout()};

function logout() {
    auth0.logout({
    	returnTo: window.location.origin
 	 });
}
