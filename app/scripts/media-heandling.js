/* global Modernizr */
'use strict';
(function( $, window, document ) {


  // Create the defaults once
  var pluginName = 'media',
    defaults   = {};

  // The actual plugin constructor
  function Plugin( element, options ) {
    this.$elem    = $( element );
    this.settings = $.extend( {}, defaults, options );


    this.$play              = this.$elem.find( '.play' );
    this.$playOverlay       = this.$elem.find( '.play-overlay' );
    this.mediaElemContainer = element;

    this.$mediaElem                  = this.$elem.find( this.settings.mediaElem );
    this.mediaElem                   = this.$mediaElem[0];
    this.$volumeButton               = this.$elem.find( '.js_volume' );
    this.$fullscreen                 = this.$elem.find( '.js_fullscreen' );
    this.$totalTimeMinutes           = this.$elem.find( '.total-time .minutes' );
    this.$totalTimeSeconds           = this.$elem.find( '.total-time .seconds' );
    this.$spentTimeMinutes           = this.$elem.find( '.spent-time .minutes' );
    this.$spentTimeSeconds           = this.$elem.find( '.spent-time .seconds' );
    this.actualVolume                = this.mediaElem.volume;
    this.$progressBarContainer       = this.$elem.find( '.progress' );
    this.progressBarContainerWidth   = this.$progressBarContainer.width();
    this.$progressBar                = this.$elem.find( '.progress-bar' );
    this.$progressSrOnly             = this.$progressBar.find( '.sr-only' );
    this.$progressSrOnlyTextAddition = this.$progressSrOnly.data( 'text' );
    this.$volumeRange                = this.$elem.find( 'input[type=range]' );
    this.isFullscreen                = false;
    this.currentTimeInterval         = 0;
    this.updateProgressBarInterval   = 0;
    this.screenChangeEvents          = 'fullscreenchange webkitfullscreenchange mozfullscreenchange  MSFullscreenChange';


    this.init();
  }

  // Avoid Plugin.prototype conflicts
  $.extend( Plugin.prototype, {
    init:                   function() {
      this.$mediaElem.attr( 'controls', false );
      this.setmediaElemDuration();
      this.initVolume();
      this.mediaElemEventHandling();
      this.initRangeSlider();
    },
    mediaElemEventHandling: function() {
      var me = this;
      me.$play.on( 'click', function( e ) {
        e.preventDefault();
        me.handlePlayPauseFunctionality();
        me.togglePlayPause();
      } );

      if (!Modernizr.touch) {

        me.$playOverlay.on( 'click', function() {
          me.handlePlayPauseFunctionality();
          me.togglePlayPause();
        } );

        me.$mediaElem.on( 'click', function() {
          me.handlePlayPauseFunctionality();
        } );
      } else {
        me.$playOverlay.on( 'click', function() {
          if (me.mediaElem.currentTime > 0 && me.mediaElem.paused) {
            me.handlePlayPauseFunctionality();
            me.togglePlayPause();

          } else if (me.mediaElem.currentTime > 0 && !me.$elem.hasClass( 'state_touched' )) {
            me.$elem.addClass( 'state_touched' );

            setTimeout( function() {
              me.$elem.removeClass( 'state_touched' );
            }, 1000 );

          } else {
            me.handlePlayPauseFunctionality();
            me.togglePlayPause();
          }
        } );
      }


      me.$mediaElem.on( 'ended', function() {
        me.$elem.addClass( 'state_ended' );
        me.$elem.removeClass( 'state_playing' );
      } );

      me.$volumeButton.on( 'click', function( e ) {
        e.preventDefault();
        me.handleMuteState();
      } );

      me.$fullscreen.on( 'click', function( e ) {
        e.preventDefault();
        me.handleFullscreenActions();
      } );


      me.$progressBarContainer.on( 'click', function( e ) {
        var xPosition = 0;

        if (!me.isFullscreen) {
          var parentPosition = me.getElementPosition( e.currentTarget );
          xPosition          = e.clientX - parentPosition.x;
        } else {
          xPosition = e.clientX;
        }

        me.setProgressBarWidth( xPosition );
        var valuenow = (xPosition * 100 / me.progressBarContainerWidth).toFixed( 0 );
        me.$progressBar.attr( 'aria-valuenow', valuenow + '%' );

        me.setProgressBarSrValue( valuenow );

        me.mediaElem.currentTime = xPosition * me.mediaElem.duration / me.progressBarContainerWidth;

        me.setCurrentTime();
      } );

      $(document).on( me.screenChangeEvents, function() {
        //noinspection JSUnresolvedVariable
        me.isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;

        // update width to handle progress bar correctly
        me.progressBarContainerWidth = me.$progressBarContainer.width();

      } );
    },


    initRangeSlider: function() {
      var me = this;
      me.$volumeRange.rangeslider( {
        polyfill:   false,
        onSlide:    function( position, value ) {
          me.mediaElem.volume = value;

          if (value === 0) {
            me.$elem.removeClass( 'state_volume_low' );
            me.$elem.addClass( 'state_muted' );
          } else if (value <= 0.5) {
            me.$elem.removeClass( 'state_muted' );
            me.$elem.addClass( 'state_volume_low' );
          } else if (value > 0.5) {
            me.$elem.removeClass( 'state_muted state_volume_low' );
          }
        },
        onSlideEnd: function( position, value ) {
          me.actualVolume     = value;
          me.mediaElem.volume = me.actualVolume;
        }
      } );
    },

    initVolume:                   function() {
      var me = this;
      me.$volumeRange.val( me.mediaElem.volume ).change();
    },
    handlePlayPauseFunctionality: function() {
      var me = this;

      if (me.$elem.hasClass( 'state_ended' )) {
        me.$elem.removeClass( 'state_ended' );
        me.mediaElem.currentTime = 0;
        me.setProgressBarWidth( 0 );
      }

      me.$elem.toggleClass( 'state_playing' );

      if (me.mediaElem.currentTime > 0 && !me.mediaElem.paused) {
        clearInterval( me.currentTimeInterval );
        clearInterval( me.updateProgressBarInterval );
      } else {
        me.setCurrentTime();
        me.updateProgressBar();
      }
    },
    togglePlayPause:              function() {
      var me = this;


      if (me.mediaElem.currentTime > 0 && !me.mediaElem.paused) {
        me.mediaElem.pause();
      } else {
        me.mediaElem.play();
      }

    },
    getElementPosition:           function( element ) {
      //check wo in der Progress-Bar geklickt wurde
      var xPosition = 0;
      var yPosition = 0;

      while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
      }
      return {x: xPosition, y: yPosition};
    },

    updateProgressBar:    function() {
      var me = this;

      me.updateProgressBarInterval = setInterval( function() {
        var newBarWidth = Math.ceil( me.mediaElem.currentTime * me.$progressBarContainer.width() / me.mediaElem.duration );

        me.setProgressBarWidth( newBarWidth );

        // set aria-value
        var valuenow = (newBarWidth * 100 / me.progressBarContainerWidth).toFixed( 0 );
        me.$progressBar.attr( 'aria-valuenow', valuenow + '%' );
        me.setProgressBarSrValue( valuenow );
      }, 1000 );
    },
    setmediaElemDuration: function() {
      var me = this;
      // Set duration of mediaElem
      var i = setInterval( function() {
        if (me.mediaElem.readyState > 0) {
          var caluclatedTime = me.calculatemediaElemTimes( me.mediaElem.duration );
          // Put the minutes and seconds in the display
          me.$totalTimeMinutes.text( caluclatedTime[0] );
          me.$totalTimeSeconds.text( caluclatedTime[1] );
          clearInterval( i );
        }
      }, 1000 );
    },

    calculatemediaElemTimes: function( timeToCalc ) {
      var result = [];
      result.push( parseInt( timeToCalc / 60, 10 ) );

      var seconds = '00' + (timeToCalc % 60).toFixed( 0 );
      seconds     = seconds.substr( -2, seconds.length );

      result.push( seconds );
      return result;
    },

    setCurrentTime: function() {
      var me = this;
      // set spent time of mediaElem
      me.currentTimeInterval = setInterval( function() {
        var curTime        = me.mediaElem.currentTime;
        var caluclatedTime = me.calculatemediaElemTimes( curTime );
        // Put the minutes and seconds in the display
        me.$spentTimeMinutes.text( caluclatedTime[0] );
        me.$spentTimeSeconds.text( caluclatedTime[1] );
      }, 1000 );
    },

    handleFullscreenActions: function() {
      var me = this;

      var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if ($.isFunction( me.mediaElem.enterFullscreen )) {
        // default fullscreen
        if (!me.isFullscreen) {
          me.mediaElemContainer.requestFullscreen();
        } else {
          document.cancelFullScreen();
        }
      }
      else if( Modernizr.touch && /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream && me.mediaElem.webkitSupportsFullscreen ){
        // fullscreen for iOS only due to controls-layout and functionality
        // issues in android when using this function there
        if ( !me.isFullscreen ) {
          me.mediaElem.webkitEnterFullscreen();
        } else {
          document.webkitCancelFullScreen();
        }
      } else if ($.isFunction( me.mediaElem.webkitEnterFullscreen )) {
        if (!me.isFullscreen) {
          me.mediaElemContainer.webkitRequestFullScreen();
        } else {
          document.webkitCancelFullScreen();
        }
      } else if ($.isFunction( me.mediaElem.mozRequestFullScreen )) {
        if (!me.isFullscreen) {
          me.mediaElemContainer.mozRequestFullScreen();
        } else {
          document.mozCancelFullScreen();
        }
      } else if ($.isFunction( me.mediaElem.msRequestFullscreen )) {
        // fullscreen for IE
        if ( !me.isFullscreen ) {
          me.mediaElemContainer.msRequestFullscreen();
        } else {
          document.msExitFullscreen();
        }
      }
    },

    handleMuteState: function() {
      var me = this;

      // apply volume when unmuted again
      if (me.$mediaElem.prop( 'muted' )) {
        me.mediaElem.volume = me.actualVolume;
        me.$volumeRange.val( me.actualVolume ).change();
      } else {
        me.$volumeRange.val( 0 ).change();
      }
      me.$mediaElem.prop( 'muted', !me.$mediaElem.prop( 'muted' ) );
    },

    setProgressBarWidth:   function( width ) {
      this.$progressBar.width( width );
    },
    setProgressBarSrValue: function( position ) {
      this.$progressSrOnly.html( position + '% ' + this.$progressSrOnlyTextAddition );
    }
  } );

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function( options ) {
    return this.each( function() {
      if (!$.data( this, 'plugin_' + pluginName )) {
        $.data( this, 'plugin_' + pluginName, new Plugin( this, options ) );
      }
    } );
  };

})( jQuery, window, document );


$( function() {
  $( '.js_video-container' ).media( { mediaElem: 'video' } );
  $( '.js_audio-container' ).media( { mediaElem: 'audio' } );
} );
