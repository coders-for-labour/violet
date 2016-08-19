"use strict";

$().ready(function() {
  $.getJSON('/api/v1/auth', function(user){
    console.log(user);
    if ( !user ) {
      $('#do-authenticate').removeClass('hide');
    } else {
      $('#welcome').removeClass('hide');
    }
  });

  $('#do-authenticate').click(function(ev){

  })

  $('#do-block').click(function(){
    $.getJSON('/api/v1/twitter/block', function(results){
      console.log(results);
    });
  });
  $('#do-get-tweets').click(function(){
    $.getJSON('/api/v1/twitter/statuses', function(results){
      console.log(results);
    });
  });
})

