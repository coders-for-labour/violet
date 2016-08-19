"use strict";

$().ready(function() {
  $('.press').click(function(ev){
    $.getJSON('http://dev.rhizome.com/api/v1/app', function(data){
      console.log(data);
    });

  })
})

