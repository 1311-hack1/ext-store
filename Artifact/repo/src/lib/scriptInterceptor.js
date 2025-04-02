/*global chrome, google */
// Static implementations of required external scripts
const scripts = {
  uid2SecureSignal: {
    init: () => {
      console.log('🔐 Initializing UID2 Secure Signal');
      window.__uid2 = window.__uid2 || { 
        callbacks: [],
        advertising_token: null
      };
      window.getUid2AdvertisingToken = () => {
        console.log('📢 Getting UID2 advertising token:', window.__uid2.advertising_token);
        return window.__uid2.advertising_token;
      };
    }
  },
  uid2Sdk: {
    init: () => {
      console.log('🔄 Initializing UID2 SDK');
      window.__uid2 = {
        callbacks: [],
        advertising_token: null,
        refresh_token: null,
        baseUrl: null,
        init: function(config) {
          console.log('🚀 UID2 SDK init called with config:', config);
          this.baseUrl = config.baseUrl;
          this.callbacks.forEach(callback => callback('InitCompleted'));
        },
        setIdentity: function(identity) {
          console.log('🔑 Setting UID2 identity:', identity);
          this.advertising_token = identity.advertising_token;
          this.refresh_token = identity.refresh_token;
          localStorage.setItem('_GESPSK-uidapi.com', JSON.stringify({
            advertising_token: identity.advertising_token,
            refresh_token: identity.refresh_token
          }));
          this.callbacks.forEach(callback => callback('IdentityUpdated'));
        },
        isLoginRequired: function() {
          return !this.advertising_token;
        }
      };
      window.__uid2.callbacks.forEach(callback => callback('SdkLoaded'));
    }
  },
  gpt: {
    init: () => {
      console.log('📢 Initializing GPT');
      window.googletag = window.googletag || { cmd: [] };
      window.googletag.cmd = window.googletag.cmd || [];
      window.googletag.pubads = () => ({
        enableSingleRequest: () => {},
        enableServices: () => {}
      });
      window.googletag.enableServices = () => {};
    }
  },
  ima: {
    init: () => {
      console.log('🎬 Initializing IMA SDK');
      if (!window.google) window.google = {};
      
      // Create a real video element for ad playback
      let adVideoElement = null;

      // Helper function to fetch ad content through background script
      const fetchAdContent = async (url) => {
        return new Promise((resolve, reject) => {
          console.log('📡 Fetching ad content through background script');
          // Send message to background script
          chrome.runtime.sendMessage({
            type: 'FETCH_AD_CONTENT',
            url: url
          }, response => {
            if (response && response.success) {
              console.log('✅ Ad content fetched successfully');
              resolve(response.data);
            } else {
              console.error('❌ Failed to fetch ad content:', response?.error || 'Unknown error');
              reject(new Error(response?.error || 'Failed to fetch ad content'));
            }
          });
        });
      };
      
      window.google.ima = {
        AdDisplayContainer: class AdDisplayContainer {
          constructor(adContainer, video) {
            console.log('🎥 Creating AdDisplayContainer');
            this.adContainer = adContainer;
            this.video = video;
            this.initialize = () => {
              console.log('🎬 Initializing AdDisplayContainer');
              if (!adVideoElement) {
                adVideoElement = document.createElement('video');
                adVideoElement.style.position = 'absolute';
                adVideoElement.style.top = '0';
                adVideoElement.style.left = '0';
                adVideoElement.style.width = '100%';
                adVideoElement.style.height = '100%';
                adVideoElement.style.zIndex = '10';
                adVideoElement.playsInline = true;
                adVideoElement.controls = true; // Enable controls for testing
                this.adContainer.appendChild(adVideoElement);
              }
            };
          }
        },
        AdsLoader: class AdsLoader {
          constructor(adDisplayContainer) {
            console.log('📺 Creating AdsLoader');
            this.adDisplayContainer = adDisplayContainer;
            this.eventHandlers = new Map();
            this.addEventListener = (event, handler) => {
              console.log(`🎯 Adding event listener for: ${event}`);
              this.eventHandlers.set(event, handler);
            };
            this.requestAds = async (adsRequest) => {
              console.log('🔄 Requesting ads with:', adsRequest);
              
              try {
                // Use a test video if the ad tag is not accessible
                const testVideoUrl = 'https://storage.googleapis.com/gvabox/media/samples/stock.mp4';
                const adUrl = testVideoUrl; // Use test video for now

                const adsManager = {
                  init: (width, height, viewMode) => {
                    console.log('🎨 Initializing ads manager:', { width, height, viewMode });
                    adVideoElement.src = adUrl;
                    adVideoElement.load(); // Important for mobile browsers
                  },
                  start: () => {
                    console.log('▶️ Starting ad playback');
                    
                    // Trigger content pause
                    const pauseHandler = this.eventHandlers.get(window.google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED);
                    if (pauseHandler) {
                      console.log('⏸️ Content pause requested');
                      pauseHandler();
                    }

                    // Start ad playback
                    const playPromise = adVideoElement.play();
                    if (playPromise !== undefined) {
                      playPromise.then(() => {
                        console.log('🎥 Ad playback started');
                      }).catch(error => {
                        console.error('❌ Error playing ad:', error);
                        const errorHandler = this.eventHandlers.get(window.google.ima.AdErrorEvent.Type.AD_ERROR);
                        if (errorHandler) errorHandler({ getError: () => error });
                      });
                    }

                    // Set up event listeners
                    adVideoElement.onended = () => {
                      console.log('✅ Ad playback complete');
                      const completeHandler = this.eventHandlers.get(window.google.ima.AdEvent.Type.COMPLETE);
                      if (completeHandler) completeHandler();
                      
                      const resumeHandler = this.eventHandlers.get(window.google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED);
                      if (resumeHandler) {
                        console.log('▶️ Content resume requested');
                        resumeHandler();
                      }
                      
                      const allAdsHandler = this.eventHandlers.get(window.google.ima.AdEvent.Type.ALL_ADS_COMPLETED);
                      if (allAdsHandler) {
                        console.log('🏁 All ads completed');
                        allAdsHandler();
                      }
                      
                      // Clean up
                      if (adVideoElement && adVideoElement.parentNode) {
                        adVideoElement.parentNode.removeChild(adVideoElement);
                        adVideoElement = null;
                      }
                    };

                    // Add error handling
                    adVideoElement.onerror = (error) => {
                      console.error('❌ Video error:', error);
                      const errorHandler = this.eventHandlers.get(window.google.ima.AdErrorEvent.Type.AD_ERROR);
                      if (errorHandler) errorHandler({ getError: () => error });
                    };
                  },
                  addEventListener: (event, eventHandler) => {
                    console.log(`📝 Adding ads manager event listener for: ${event}`);
                    this.eventHandlers.set(event, eventHandler);
                  },
                  destroy: () => {
                    console.log('🗑️ Destroying ads manager');
                    if (adVideoElement) {
                      adVideoElement.pause();
                      adVideoElement.src = '';
                      adVideoElement.load();
                      if (adVideoElement.parentNode) {
                        adVideoElement.parentNode.removeChild(adVideoElement);
                      }
                      adVideoElement = null;
                    }
                  }
                };

                setTimeout(() => {
                  const adsManagerLoadedEvent = {
                    getAdsManager: () => {
                      console.log('📋 Getting ads manager instance');
                      return adsManager;
                    }
                  };

                  const handler = this.eventHandlers.get(window.google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED);
                  if (handler) {
                    console.log('🚀 Triggering ADS_MANAGER_LOADED event');
                    handler(adsManagerLoadedEvent);
                  }
                }, 100);

              } catch (error) {
                console.error('❌ Error in requestAds:', error);
                const errorHandler = this.eventHandlers.get(window.google.ima.AdErrorEvent.Type.AD_ERROR);
                if (errorHandler) errorHandler({ getError: () => error });
              }
            };
          }
        },
        AdsManagerLoadedEvent: {
          Type: { ADS_MANAGER_LOADED: 'adsManagerLoaded' }
        },
        AdEvent: {
          Type: {
            CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
            CONTENT_RESUME_REQUESTED: 'contentResumeRequested',
            ALL_ADS_COMPLETED: 'allAdsCompleted',
            STARTED: 'started',
            COMPLETE: 'complete',
            SKIPPED: 'skipped'
          }
        },
        AdErrorEvent: {
          Type: { AD_ERROR: 'adError' }
        },
        AdsRenderingSettings: class AdsRenderingSettings {
          constructor() {
            this.restoreCustomPlaybackStateOnAdBreakComplete = true;
          }
        },
        AdsRequest: class AdsRequest {
          constructor() {
            this.adTagUrl = '';
            this.linearAdSlotWidth = 0;
            this.linearAdSlotHeight = 0;
            this.nonLinearAdSlotWidth = 0;
            this.nonLinearAdSlotHeight = 0;
          }
        },
        ViewMode: {
          NORMAL: 'normal'
        }
      };
    }
  }
};

// Function to initialize a script
export function injectScript(scriptName) {
  console.log(`🔄 Injecting script: ${scriptName}`);
  const script = scripts[scriptName];
  if (!script) {
    console.error(`❌ No implementation found for script: ${scriptName}`);
    return;
  }
  script.init();
}

// Export script map for reference
export const scriptMap = {
  'https://cdn.integ.uidapi.com/uid2SecureSignal.js': 'uid2SecureSignal',
  'https://cdn.integ.uidapi.com/uid2-sdk-3.9.0.js': 'uid2Sdk',
  'https://securepubads.g.doubleclick.net/tag/js/gpt.js': 'gpt',
  'https://imasdk.googleapis.com/js/sdkloader/ima3.js': 'ima'
}; 