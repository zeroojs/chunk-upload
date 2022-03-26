import './style/index.less'
import SparkMD5 from 'spark-md5'
import { request } from './request'

function bootstrap() {
  useUpload()
  uploadContuine()
}

bootstrap()

// 获取节点
function querySelectors() {
  const btnBox = document.querySelector('.btn')
  const uploadBox = document.querySelector('.upload-box')
  const uploadInput = document.querySelector('.upload-input')
  const progress = document.querySelector('.progress')
  const progressInner = progress.querySelector('.progress-inner')
  return {
    btnBox,
    uploadBox,
    uploadInput,
    progress,
    progressInner
  }
}

// 继续上传
function uploadContuine() {
  const { btnBox, uploadInput, progressInner, uploadBox } = querySelectors()
  btnBox.addEventListener('click', () => {
    console.log(uploadInput.files)
    uploadInput.value = ''
    progressInner.style.width = '0'
    uploadBox.querySelector('span').innerText = '点我上传'
    uploadInput.click()
  })
}

// 根据文件内容和后缀生成唯一hash
function genHASH(file) {
  const fileReader = new FileReader()
  return new Promise(resolve => {
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = function() {
      const buffer = this.result
      const HASH = new SparkMD5().append(buffer).end()
      resolve(HASH)
    }
  })
}

// 上传逻辑
function useUpload() {
  const { uploadBox, uploadInput, progressInner, btnBox } = querySelectors()
  btnBox.style.display = 'none'
  uploadBox.addEventListener('click', () => uploadInput.click())

  uploadInput.addEventListener('change', async (e) => {
    progressInner.style.width = '0'
    btnBox.style.display = 'none'
    // 获取文件
    const [file] = e.target.files
    const { name, size } = file
    const [, suffix] = /\.([a-zA-Z0-9]+)$/.exec(name) // 获取文件后缀
    const HASH = await genHASH(file)

    // 切片
    const chunks = [] // 存放切片
    const max = 100 // 最多一百片
    let chuknSize = 1024 // 额定切片大小 1kb
    let num = Math.ceil(size / chuknSize)// 实际切片数量
    if (num > max) { // 实际大小超过额定大小哦
      num = max
      chuknSize = size / max
    }

    let index = 0
    while(index < num) {
      const filename = `${HASH}_${index + 1}.${suffix}`
      chunks.push({
        file: file.slice(index * chuknSize, (index + 1) * chuknSize),
        filename
      })
      index++
    }

    // 切片上传成功处理
    let complateIndex = 0
    const complate = () => {
      complateIndex++
      // 进度条
      progressInner.style.width = `${complateIndex}%`
      uploadBox.querySelector('span').innerText = '上传中'
      if (complateIndex < num) return
      console.log('请求合并切片')
      // 全部切片已上传，请求合并切片
      const params = {
        filename: name, // 文件原始名称
        hash: HASH
      }
      request.post('/merge', params).then(res => {
        if (+res.code === 1) {
          // 合并成功 上传完成
          uploadInput.value = ''
          uploadBox.querySelector('span').innerText = '文件已上传'
          console.log('文件已上传')
          progressInner.style.width = '100%'
          btnBox.style.display = 'block'
        }
      })
    }

    // 切片上传
    chunks.forEach(chunk => {
      const form = new FormData()
      form.append('file', chunk.file)
      form.append('filename', chunk.filename)
      // 发送表单到服务器
      request.post('/upload', form).then(res => {
        if (+res.code === 1) { // 上传成功
          complate()
        }
      })
    })
  })
}