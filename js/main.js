
let members = [];
let memberShown = null;
let access_token = null;

function showNextPhoto(){
  memberShown = members[Math.floor(Math.random()*members.length)];
  $('#photo').attr('src', memberShown['photo']);
  $('#name').hide()
}

function revealName(){
  $('#name').html(memberShown.name).show();
}

function buttonHandler(){
  if( $('#name').is(":visible") ){
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
      for( let key in response.results){
        const event = response.results[key];
        console.log(event);
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
    });
}

function selectEvent(event){ //"event" parameter means a JS event, not a meetup.
  $('#events').hide();
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
  //Get Meetup access_token from URL.
  if( !window.location.hash ){
    //Start the Oauth process:
    $('#events').hide()
    $('.flashcard').hide();
    $('#login a').attr('href', 'https://secure.meetup.com/oauth2/authorize?client_id=mdketodiouiqs72nrd4g21dj2v&response_type=token&redirect_uri='+encodeURIComponent(window.location.href) );
  }
  else{
    //There is a hash fragment. Get the access token from it:
    $('#login').hide();
    access_token = window.location.hash.match(/access_token=([0-9a-f]*)/)[1];

    listEvents();

    $('#photo').on('click',buttonHandler);
    $('#next').on('click',buttonHandler);
  }

})