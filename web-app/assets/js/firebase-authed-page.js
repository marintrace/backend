document.getElementById("logout").onclick = function() {logout()};

function logout() {
    firebase.auth().signOut().then(function() {
        window.location = 'index.html';
    }).catch(function(error) {
        alert("Failed to sign out. Please try again.");
    });
}

var authToken = ""

firebase.auth().onAuthStateChanged(user => {
    if(!user) {
        window.location = 'index.html'; //If User is not logged in, redirect to login page
    } else {
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
            authToken = idToken
        }).catch(function(error) {
            alert("Failed to retrive ID token, reports will fail. Try signing out and signing in agains.");
        });
    }
});
