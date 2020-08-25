//https://sliptree.github.io/bootstrap-tokenfield/

jQuery(function(){

  var source = ['red','blue','green','yellow','violet','brown','purple','black','neon'];

  $('#tokenfield').tokenfield({
  autocomplete: {
    source: source,
    delay: 100
  },
  showAutocompleteOnFocus: true
}).on('tokenfield:createtoken', function (event) {
  //make sure token doesn't already exist and is a valid
  var exists = true;
  $.each(source, function(index, token) {
    if (token === event.attrs.value)
      exists = false;
  });
  if (exists === true)
    event.preventDefault();
  else {
    var existingTokens = $(this).tokenfield('getTokens');
    $.each(existingTokens, function(index, token) {
      if (token.value === event.attrs.value )
        event.preventDefault();
    });
  }
});
});
