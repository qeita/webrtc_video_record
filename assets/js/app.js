(() => {
  
  /**
   * WebRTCによるカメラアクセス
   */
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  
  let isVideoRun = true
  let isLoadedMetaData = false
  let constraints = { audio: false, video: {facingMode: 'user'} }

  const playBtn = document.getElementById('play')
  const recordIcn = document.getElementById('record')
  const recordedVideo = document.getElementById('recorded')
  const downloadBtn = document.getElementById('download')
  let isRecording = false
  let mediaRecorder
  let recordedBlobs


  function start(){
    navigator.mediaDevices.getUserMedia( constraints )
      .then( mediaStrmSuccess )
      .catch( mediaStrmFailed )
  }

  function mediaStrmSuccess( stream ){
    window.stream = stream
    video.srcObject = stream

    // ウェブカムのサイズを取得し、canvasにも適用
    if(isLoadedMetaData) return
    isLoadedMetaData = true

    video.addEventListener('loadedmetadata', () => {
      video.width = video.videoWidth        // clmtrackrのvideo取得にあたりwidth属性に値指定
      video.height = video.videoHeight      // clmtrackrのvideo取得にあたりheight属性に値指定
      canvas.width = video.videoWidth  
      canvas.height = video.videoHeight

      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStrmFailed( e ){
    console.log( e )
  }

  function stop(){
    let stream = video.srcObject
    let tracks = stream.getTracks()

    tracks.forEach( (track) => {
      track.stop()
    })
    video.srcObject = null
  }

  function draw(){
    
    if(isVideoRun){
      ctx.drawImage(video, 0, 0)
    }
    requestAnimationFrame( draw )
  }

  start()


  /**
   * ストリームのコントロール
   */
  const stopBtn = document.getElementById('stop')
  const frontBtn = document.getElementById('front')
  const rearBtn = document.getElementById('rear')

  let ua = navigator.userAgent
  if(ua.indexOf('iPhone') < 0 && ua.indexOf('Android') < 0 && ua.indexOf('Mobile') < 0 && ua.indexOf('iPad') < 0){
    frontBtn.disabled = true
    rearBtn.disabled = true
  }

  stopBtn.addEventListener('click', () => {
    if(isVideoRun){
      stop()
      stopBtn.textContent = 'START'
    }else{
      start()
      stopBtn.textContent = 'STOP'
    }
    isVideoRun = !isVideoRun
  }, false)

  frontBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'user'
    setTimeout( () => {
      start()
    }, 500)
  }, false)

  rearBtn.addEventListener('click', () => {
    stop()
    constraints.video.facingMode = 'environment'
    setTimeout( () => {
      start()
    }, 500)
  }, false)


  /**
   * 動画録画
   */
  recordIcn.addEventListener('click', () => {
    if(isRecording){
      recordIcn.classList.remove('is-record')
      stopRecording()
    }else{
      recordIcn.classList.add('is-record')
      startRecording()
    }
    isRecording = !isRecording
  }, false)

  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault()
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a')
    a.style.display = 'none'
    a.download = 'test.webm'
    a.href = url
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url);
    }, 100);
  })

  playBtn.addEventListener('click', () => {
    const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'})
    recordedVideo.src = window.URL.createObjectURL(superBuffer)

    recordedVideo.addEventListener('loadedmetadata', () => {
      if(recordedVideo.duration === Infinity){
        recordedVideo.currentTime = 1e101
        recordedVideo.ontimeupdate = () => {
          recordedVideo.currentTime = 0
          recordedVideo.ontimeupdate = () => {
            delete recordedVideo.ontimeupdate
            recordedVideo.play()
          }
        }
      }
    })
  }, false)

  function startRecording(){
    recordedBlobs = []
    let options = {mimeType: 'video/webm;codecs=vp9'}
    if(!MediaRecorder.isTypeSupported(options.mimeType)){
      console.log(`${ options.mimeType } is not Supported`)
      options = {mimeType: 'video/webm;codecs=vp8'}
      if(!MediaRecorder.isTypeSupported(options.mimeType)){
        console.log(`${ options.mimeType } is not Supported`)
        options = {mimeType: 'video/webm'}
        if(!MediaRecorder.isTypeSupported(options.mimeType)){
          console.log(`${ options.mimeType } is not Supported`)
          options = {mimeType: ''}
        }
      }
    }
    try{
      mediaRecorder = new MediaRecorder(window.stream, options)
    }catch(e){
      console.error(`Exception while creating MediaRecorder: ${ e }`)
      alert(`Exception while creating MediaRecorder: ${ e }. mimeType: ${ options.mimeType }`)
      return
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options)
    mediaRecorder.onstop = handleStop
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.start( 10 )
    console.log('MediaRecorder started', mediaRecorder)
  }

  function stopRecording(){
    mediaRecorder.stop()
    console.log('Recorded Blobs: ', recordedBlobs)
  }

  function handleStop(e){
    console.log('Recorder stopped: ', e)
  }

  function handleDataAvailable(e){
    if(e.data && e.data.size > 0){
      recordedBlobs.push(e.data)
    }
  }



})()