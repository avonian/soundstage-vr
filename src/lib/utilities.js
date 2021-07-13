export default {
  preloadRequest: false,
  async preloadVideo(video) {
    var self = this;
    return new Promise((resolve, reject) => {

      self.preloadRequest = new XMLHttpRequest()
      self.preloadRequest.open('GET', video.url, true)
      self.preloadRequest.responseType = 'blob'

      self.preloadRequest.onload = function () {
        // Onload is triggered even on 404
        // so we need to check the status code
        if (this.status === 200) {
          var videoBlob = this.response
          video.url = URL.createObjectURL(videoBlob) // IE10+
          resolve(video.url)
        }
      }
      self.preloadRequest.onerror = function () {
        // Error
      }
      self.preloadRequest.send()
    })
  },
  showHideUI(hide = true) {
    var controls = document.body.querySelectorAll(".ui-hide");
    for(var el of controls) {
      if(hide) {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    }
  }
}