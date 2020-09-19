document.getElementById("branson").onclick = function() {

};
document.getElementById("ma").onclick = function() {

};

window.onload = async () => {

  //show spinner
  $('#branson').addClass('disabled')
  $('#branson').html(`Loading...`);
  $('#ma').addClass('disabled')
  $('#ma').html(`Loading...`);

  await configureClient();

  const isAuthenticated = false; //idk how this will change

  $("#branson").removeClass("disabled")
  $("#branson").html("Login with branson.org")
  $("#ma").removeClass("disabled")
  $("#ma").html("Login with ma.org")

  if (isAuthenticated) {
    document.location.href = "/home.html";
    return
  }

  //set as active - idk when we will want to run this
  /*markUserAsActive().then(function() {
    $(document).ready(function() {
      $("#branson").removeClass("disabled")
      $("#branson").html("Login with branson.org")
      $("#ma").removeClass("disabled")
      $("#ma").html("Login with ma.org")
    });
    // Use replaceState to redirect the user away and remove the querystring parameters
    document.location.href = "/home.html";
  });*/
}
