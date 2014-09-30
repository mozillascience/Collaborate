(function(window, document, undefined){

  $(document).ready(function() {

    $('#join').click(function(){
      console.log($(this).data('href'));
      $.ajax({
        url: $(this).data('href'),
        type:'POST',
        success: function(msg){
          window.location.reload();
        },
        error: function(xhr,status,error) {
          console.log(xhr);
        }
      })
    })

  });

})(this, document);