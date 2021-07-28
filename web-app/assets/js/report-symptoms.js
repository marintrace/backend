$(document).ready(function() {
  $('#contact').change(function() { //if vaccinated, show/hide symptoms based on contact
    if (userVaccinated && $(this).is(':checked')) {
      $("#symptomQuestions").show()
    } else if (userVaccinated && !$(this).is(':checked')) {
      $("#symptomQuestions").hide()
      $('#symptomQuestions input:checkbox').removeAttr('checked'); //reset symptoms
    }
  })

  var jsoninput = $('#json');
  var submit = $('button[type="submit"]');
  var form = $('form');
  submit.click(function(e) {
    e.preventDefault();

    //submit.prop("disabled", true);
    //submit.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Report`);
    submit.addClass('disabled')
    submit.html(`Loading...`);

    var sum = 0
    var travel = false
    var contact = false
    $('input').each(function(e) {
      var id = $(this).attr('id')
      var checked = $(this).is(':checked')
      if (checked) {
        switch (id) {
          case 'travel':
            travel = true;
            break;
          case 'contact':
            contact = true;
            break;
          default:
            sum++;
        }
      }
    })

    var checkboxes = {
      'num_symptoms': sum,
      'commercial_flight': travel,
      'proximity': contact
    }

    reportSymptoms(checkboxes).then(function() {
      submit.removeClass("disabled")
      submit.html("Report")
    })

  });
});
