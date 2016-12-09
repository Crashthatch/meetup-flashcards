
let members = [];
let memberShown = null;
let nextMemberToShow = null;
let access_token = null;

function showNextPhoto(){
  if( !nextMemberToShow ){ //For first run.
    memberShown = members[Math.floor(Math.random()*members.length)];
  }
  else{
    memberShown = nextMemberToShow;
  }
  $('#photo').attr('src', memberShown['photo']);
  $('.answer').hide()

  //Pre-load the next image, ready for once this one is done with.
  do{
    nextMemberToShow = members[Math.floor(Math.random()*members.length)];
  } while( nextMemberToShow == memberShown && members.length > 1) //Do not select the same member twice in a row.

  (new Image()).src = nextMemberToShow['photo'];
}

function revealName(){
  $('#attendeeName').html(memberShown.name);
  $('.answer').fadeIn();
}

function buttonHandler(){
  if( $('.answer').is(":visible") ){
    showNextPhoto();
  }
  else{
    revealName();
  }
}

function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function listEvents(){
  $('.flashcard').hide();
  //Get the list of events that this user has RSVP'd to:
  $.ajax("https://api.meetup.com/2/events?offset=0&format=json&limited_events=False&rsvp=yes&photo-host=public&page=20&fields=&order=time&desc=false&status=upcoming&access_token="+access_token)
    .then(function(response){
      $('#events').show();
      if( response.results.length >= 1 ){
        for( let key in response.results){
          const event = response.results[key];
          const eventItem = $('.eventItem.master').clone().removeClass('master');
          eventItem.find('.name').html(event.name);
          eventItem.find('.group').html(event.group.name);

          const eventTime = new Date(event.time);
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          eventItem.find('.date').html(eventTime.getDate() +" "+months[eventTime.getMonth()] );
          eventItem.attr('data-event-id', event.id);
          eventItem.on('click', selectEvent);
          $('#eventsList').append(eventItem);
        }
      }
      else{
        $('#eventsList').html("No Events were found. Have you RSVP'd yes to any meetups?");
      }
    }, function(err){
      console.error("Could not connect to meetup's API. Maybe the token expired.");
      $('#login').show();
    });
}

function selectEvent(event){ //"event" parameter means a JS event, not a meetup.
  $('#events').hide();
  $('.answer').hide();
  $('.flashcard').show();
  const eventId = $(event.currentTarget).attr('data-event-id');

  //Make a request to Meetup's API:
  $.ajax("https://api.meetup.com/2/rsvps?offset=0&format=json&event_id="+eventId+"&photo-host=public&page=100&fields=&order=event&desc=false&access_token="+access_token)
    .then( function(response){
      for( let key in response.results){
        const m = response.results[key];
        //TODO: Check member is attending (rsvp'd yes).
        //TODO: Check photo contains a face.
        //TODO: Page through all members, not just the first 100.
        if( m.member && m.member.name && m.member_photo && m.member_photo.highres_link ){
          members.push({name: toTitleCase(m.member.name),
            photo: m.member_photo.highres_link});
        }
      }
      showNextPhoto();
    })
}

$( function(){
  //Set the login URL
  let client_id = ( window.location.hostname == "localhost" ) ? "e8jtad7j3sgr1m19tfoqhiep9q" : "mdketodiouiqs72nrd4g21dj2v";
  $('#login a').attr('href', 'https://secure.meetup.com/oauth2/authorize?client_id='+client_id+'&response_type=token&redirect_uri='+encodeURIComponent(window.location.href.replace(location.hash,"")));

  //Get Meetup access_token from URL.
  if( !window.location.hash ){
    //Start the Oauth process:
    $('#events').hide();
    $('.flashcard').hide();
  }
  else{
    //There is a hash fragment. Get the access token from it:
    $('#login').hide();
    try{
      access_token = window.location.hash.match(/access_token=([0-9a-f]*)/)[1];
    }
    catch( e ){
      console.error("Hash didn't contain an access token!");
      $('#login').show();
      return;
    }

    listEvents();

    $('#photo').on('click',buttonHandler);
    $('.answer').on('click',buttonHandler);
  }

})