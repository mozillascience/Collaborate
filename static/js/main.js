(function(window, document, undefined){

  $(document).ready(function() {

    $('#join').click(function(){
      $.ajax({
        url: $(this).data('href'),
        type:'GET',
        success: function(msg){
          if($('#join-project').size() > 0 ){
            $('#join-project').show();
            $('#join').hide();
          } else {
            window.location.reload();
          }
        },
        error: function(xhr,status,error) {
          console.log(xhr);
        }
      })
    });


    $('#submit-project').click(function(){
      var text = $('#helptext').val();
      $.ajax({
        url: $(this).data('href'),
        type:'POST',
        data: {
          text: text
        },
        success: function(msg){
          window.location.reload();
        },
        error: function(xhr,status,error) {
          console.log(xhr);
        }
      });
    })

  });

})(this, document);