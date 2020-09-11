//https://sliptree.github.io/bootstrap-tokenfield/

jQuery(function(){

	let users = JSON.parse(localStorage.getItem("users"));

	if (typeof users !== "undefined") {
		alert("Couldn't find any other users to potentially report.")
		window.location = "home.html"
	} else if (users.length == 0) {
		alert("Couldn't find any other users to potentially report.")
		window.location = "home.html"
	}
	
    //for testing
    /*const user1 = {
        "first_name": "string",
        "last_name": "string",
        "email": "string@gmail.com",
        "school": "string",
        "signup_at": "inactive"
    }
    users = [user1]*/
    var source = users.map(function(x) {
        let object = {
        label: x["first_name"] + " " + x["last_name"],
        userEmail: x["email"]
        }
        return object
    })

    $('#tokenfield').tokenfield({
        autocomplete: {
        source: source,
        delay: 100
        },
        showAutocompleteOnFocus: true
    }).on('tokenfield:createtoken', function (event) {
        //make sure token doesn't already exist and is a valid
        var exists = true;
        $.each(source, function(index, token) {
            if (token.userEmail === event.attrs.userEmail)
                exists = false;
        });
        if (exists === true)
            event.preventDefault();
        else {
            var existingTokens = $(this).tokenfield('getTokens');
            $.each(existingTokens, function(index, token) {
                if (token.userEmail === event.attrs.userEmail )
                    event.preventDefault();
            });
        }
    });

    $('#submitButton').click(function() {
        let tokens = $('#tokenfield').tokenfield('getTokens')
        if (tokens.length < 1) {
            alert("You must add contacts before you can report them.")
        } else {
			$('#submitButton').addClass('disabled')
			$('#submitButton').html(`Loading...`);
            //$('#submitButton').prop("disabled", true);
            //$('#submitButton').html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report Contacts`);
            let targets = tokens.map(x => x["userEmail"])
            reportContacts(targets).then(function () {
				$("#submitButton").removeClass("disabled")
				$("#submitButton").html("Report")
                //$('#submitButton').find('span').removeClass("spinner-border spinner-border-sm")
                //$('#submitButton').prop("disabled", false);
            })
        }
    })
});
