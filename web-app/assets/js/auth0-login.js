document.getElementById("branson").onclick = function() {showGoogle()};
document.getElementById("ma").onclick = function() {showGoogle()};
//for tracking whether or not to run active function
var newAuth = false
window.onload = async () => {
	//show spinner
    $('#branson').addClass('disabled')
	$('#branson').html(`Loading...`);
	$('#ma').addClass('disabled')
	$('#ma').html(`Loading...`);
  	await configureClient();
	const isAuthenticated = await auth0.isAuthenticated();
	$("#branson").removeClass("disabled")
	$("#branson").html("Login with branson.org")
	$("#ma").removeClass("disabled")
	$("#ma").html("Login with ma.org")
	if (isAuthenticated) {
		document.location.href="/home.html";
		return
	}
    var urlParams;
    (window.onpopstate = function () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);
        urlParams = {};
        while (match = search.exec(query))
           urlParams[decode(match[1])] = decode(match[2]);
    })();
	//const query = window.location.search;
  	//if (query.includes("code=") && query.includes("state=")) {
    if (("code" in urlParams) && ("state" in urlParams)) {
		//show spinner
    	$('#branson').addClass('disabled')
		$('#branson').html(`🔐 Encrypting...`);
		$('#ma').addClass('disabled')
		$('#ma').html(`🔐 Encrypting...`);
    	// Process the login state
    	await auth0.handleRedirectCallback();
		//const token = await auth0.getTokenSilently()
		//authToken = token
		const claims = await auth0.getIdTokenClaims();
		authToken = claims.__raw
		//set as active
        markUserAsActive().then(function() {
            $(document).ready(function() {
                $("#branson").removeClass("disabled")
				$("#branson").html("Login with branson.org")
				$("#ma").removeClass("disabled")
				$("#ma").html("Login with ma.org")
            });
			// Use replaceState to redirect the user away and remove the querystring parameters
			document.location.href="/home.html";
        });
  	} else if (("error" in urlParams) && ("error_description" in urlParams)) {
		alert(urlParams["error"] + " – " + urlParams["error_description"])
	}
}
const showGoogle = async () => {
    await auth0.loginWithRedirect({
		redirect_uri: window.location.origin
	})
}