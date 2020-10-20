$(document).ready(function() {
  var date = new Date()
  $('#date').text((date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear())

  $("#email").addClass('disabled')
  $("#email").html(`Loading...`);
  $("#status").addClass('disabled')
  $("#status").html(`Loading...`);

  $('#statusModal').on('shown.bs.modal', function (e) {
    getUserStatus(getData)
  });

  async function getData(status) {
    $("#email").removeClass("disabled")
    $("#email").html(status.name)
    $("#status").removeClass("disabled")
    $("#status").html(status.criteria.join(', '))

    switch (status.color) {
      case "danger":
        $("#statusModal").removeClass('bg-gradient-default')
        $("#statusModal").addClass('bg-gradient-danger')
        break
      case "yellow":
        $("#statusModal").removeClass('bg-gradient-default')
        $("#statusModal").addClass('bg-gradient-warning')
        break
      case "success":
        $("#statusModal").removeClass('bg-gradient-default')
        $("#statusModal").addClass('bg-gradient-success')
        break
    }
  }

  getData()
});
