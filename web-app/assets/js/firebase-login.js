//login w firebase
var provider = new firebase.auth.GoogleAuthProvider();

firebase.auth().onAuthStateChanged(user => {
  if(user) {
    if (user.email.includes("@ma.org") || user.email.includes("@branson.org")) {
         window.location = 'home.html'; //If User is logged in and valid, redirect to home page
    }
  }
});

document.getElementById("branson").onclick = function() {showGoogle()};
document.getElementById("ma").onclick = function() {showGoogle()};

function showGoogle() {
    firebase.auth().signInWithPopup(provider).then(function(result) {
        var user = result.user;
        if (user.email.includes("@ma.org") || user.email.includes("@branson.org")) {
            window.location.href = "/home.html";
        } else {
            //delete user and show error
            console.log("not valid email")
            alert("You must sign in with an email from a valid institution. Your login was not successful.");
            user.delete().then(function() {
            }).catch(function(error) {
                alert(error.message);
                close(); //error occured, abort
            })
        }
    }).catch(function(error) {
        // Handle Errors here.
        console.log(error)
        var errorCode = error.code;
        var errorMessage = error.message;
        alert(errorMessage);
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    });
}