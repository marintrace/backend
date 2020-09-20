document.getElementById("logout").onclick = function() {logout()};

function logout() {
    document.location.href = "/web/oauth/logout";
}


$(document).ready(function() {
  //check if marked current user active
  var currentUserEmail = "blorsch@ma.org"
  if (window.localStorage.getItem(currentUserEmail+"_active") != "true") {
    markUserAsActive().then(function() {
      window.localStorage.setItem(currentUserEmail+"_active", 'true')
    });
  }
});
