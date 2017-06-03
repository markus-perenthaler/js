// accordion script
$('.accordion .accordion_head').on('click', function (event) {
  event.preventDefault();
  if (!$(this).parent().hasClass('hide_others')) {
    $(this).next('.accordion_content').stop();
    $(this).next('.accordion_content').slideToggle('slow');
    $(this).toggleClass('open closed');
  } else {
    $(this).next('.accordion_content').stop();
    $(this).next('.accordion_content').slideToggle('slow');
    $(this).toggleClass('open closed');
    $(this).siblings('.open')
      .removeClass('open')
      .addClass('closed')
      .next('.accordion_content').slideUp('slow');
  }
});
$('.accordion .collpase-all').on('click', function (event) {
  event.preventDefault();

  if ($(this).hasClass('show-all')) {
    $(this).siblings('.closed')
      .removeClass('closed')
      .addClass('open')
      .next('.accordion_content').slideToggle('slow');
    $(this).html('Alle Einträge einklappen');
  }
  else {
    $(this).siblings('.open')
      .removeClass('open')
      .addClass('closed')
      .next('.accordion_content').slideUp('slow');
    $(this).html('Alle Einträge aufklappen');
  }

  $(this).toggleClass('show-all hide-all');

});




