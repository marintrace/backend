$(document).ready(function() {
  var date = new Date()
  $('#date').text((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear())

  $("#email").addClass('disabled')
  $("#email").html(`Loading...`);
  $("#status").addClass('disabled')
  $("#status").html(`Loading...`);

  getUserStatus(getData)

  async function getData(status) {
    $("#email").removeClass("disabled")
    $("#email").html(status.email)
    $("#status").removeClass("disabled")
    $("#status").html(status.criteria.join(', '))

    switch (status.color) {
      case "danger":
        $("#header").removeClass('bg-gradient-default')
        $("#header").addClass('bg-gradient-danger')
        $("#body").removeClass('bg-gradient-default')
        $("#body").addClass('bg-gradient-danger')
        $("#footer").removeClass('bg-gradient-default')
        $("#footer").addClass('bg-gradient-danger')
        break
      case "yellow":
        $("#header").removeClass('bg-gradient-default')
        $("#header").addClass('bg-gradient-warning')
        $("#body").removeClass('bg-gradient-default')
        $("#body").addClass('bg-gradient-warning')
        $("#footer").removeClass('bg-gradient-default')
        $("#footer").addClass('bg-gradient-warning')
        break
      case "success":
        $("#header").removeClass('bg-gradient-default')
        $("#header").addClass('bg-gradient-success')
        $("#body").removeClass('bg-gradient-default')
        $("#body").addClass('bg-gradient-success')
        $("#footer").removeClass('bg-gradient-default')
        $("#footer").addClass('bg-gradient-success')
        break
    }
  }

  getData()
});
