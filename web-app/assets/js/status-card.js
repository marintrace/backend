$(document).ready(function () {
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
        $("#email").removeClass("disabled");
        $("#email").html(status.name);
        if (status.entry) {
            $("#entry").html("<b>✅ Permitted to enter campus</b>");
        } else {
            if (userIsTilden) {
              $("#entry").html("<b>Contact your Head of School to see if you're permitted to enter campus</b>");
            } else {
              $("#entry").html("<b>❌ Not permitted to enter campus</b>");
            }
        }
        let entry_data = status[status.reason];
        if (status.reason === "location") {
            $("#reason").html("You are currently " + entry_data.location);
        } else {
            $("#reason").html(entry_data.criteria.join(', '));
        }
        $("#status").removeClass("disabled");
        $("#statusModal").removeClass('bg-gradient-default');
        $("#statusModal").removeClass('bg-success');
        $("#statusModal").removeClass('bg-danger');
        $("#statusModal").addClass('bg-' + entry_data.color);
    }
});
