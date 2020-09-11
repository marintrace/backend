//positive test
$(document).ready(function() {
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
				$("#reportContacts").removeClass("disabled"), $("#reportContacts").html("Report contacts »"), null != localStorage.getItem("users") && (window.location.href = "/report-contacts.html")
				
            });
        });
    });
});
