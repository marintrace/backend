$(document).ready(function() {
    var jsoninput = $('#json');
    var submit = $('button[type="submit"]');
    var form = $('form');
    submit.click(function(e){
        e.preventDefault();
        
        //submit.prop("disabled", true);
        //submit.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report`);
		submit.addClass('disabled')
		submit.html(`Loading...`);
        
		var sum = 0
        $('input').each(function(e) {
            var id = $(this).attr('id')
            var checked = $(this).is(':checked')
            if (checked){
				sum++
			}
        })
		var checkboxes = {
			'num_symptoms':sum
		}
		console.log(checkboxes);
        
        reportSymptoms(checkboxes).then(function() {
            submit.removeClass("disabled")
			submit.html("Report")
        })
        
    });
});
