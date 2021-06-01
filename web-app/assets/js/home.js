//positive test
$(document).ready(function() {

    //check local storage firsts
    if (window.localStorage.getItem('agreed') != "true") {
      $('#policyModal').modal({backdrop: 'static', keyboard: false})
    }

    $("#acceptButton").click(function(){
      $('#policyModal').modal('hide');
      window.localStorage.setItem('agreed', 'true')
    });

    $("#reportSymptoms").click(function(){
      const lastReported = new Date(localStorage.getItem("lastReport"))
      if (lastReported == null || !(isToday(lastReported))) {
        $('#symptomsModal').modal('show')
      } else {
        //already reported show error
        alert("You have already submitted your questionnaire today. If you need to make a change, please contact your school.")
      }
    })

    $("#positiveButton").click(function(){
        //$(this).prop("disabled", true);
        //$(this).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report`);
		$(this).addClass('disabled')
		$(this).html(`Loading...`);

        reportTest('positive').then(function() {
            $(document).ready(function() {
				$("#positiveButton").removeClass("disabled")
				$("#positiveButton").html("Report")
                //$("#positiveButton").find('span').removeClass("spinner-border spinner-border-sm")
                //$("#positiveButton").prop("disabled", false);
            });
        })
    });

    $("#negativeButton").click(function(){
        //$(this).prop("disabled", true);
        //$(this).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report`);
		$(this).addClass('disabled')
		$(this).html(`Loading...`);

        reportTest('negative').then(function() {
            $(document).ready(function() {
				$("#negativeButton").removeClass("disabled")
				$("#negativeButton").html("Report")
                //$("#negativeButton").find('span').removeClass("spinner-border spinner-border-sm")
                //$("#negativeButton").prop("disabled", false);
            });
        })
    });

    $("#reportContacts").click(function(){
        //$(this).prop("disabled", true);
        //$(this).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report contacts »`);
		$(this).addClass('disabled')
		$(this).html(`Loading...`);

        //get contacts
        getContacts().then(function() {
            $(document).ready(function() {
				$("#reportContacts").removeClass("disabled"), $("#reportContacts").html("Report contacts »"), null != localStorage.getItem("users") && ($('#contactsModal').modal('show'))

            });
        });
    });
});
