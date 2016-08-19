"use strict";

$().ready(function() {
  $.getJSON('/api/v1/auth', function(user){
    if ( !user ) {
      $('.press').removeClass('hide');
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
})

