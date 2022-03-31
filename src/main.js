import './style/index.less'
import SparkMD5 from 'spark-md5'
import { request } from './request'

function bootstrap() {
  initList()
    .then(() => {
      useUpload()
    })
}

bootstrap()

// 初始化列表
async function initList() {
  const { uploadList } = querySelectors()
  const result = await request.get('/file-list')
  if (result.code === 1) {
    result.data.forEach(item => {
      // 创建List Item
      const listItem = document.createElement('li')
      listItem.setAttribute('class', 'upload-list-item')
      listItem.innerText = item
      // 创建进度条
      const progressInner = document.createElement('div')
      progressInner.setAttribute('class', 'list-item-progress')
      progressInner.style.width = '100%'
      // 创建进度数字
      const progressNumber = document.createElement('span')
      progressNumber.setAttribute('class', 'upload-count')
      progressNumber.classList.add('is-success')
      progressNumber.innerText = '100%'

      listItem.appendChild(progressInner)
      listItem.appendChild(progressNumber)
      uploadList.append(listItem)
    })
  }
}

// 获取节点
function querySelectors() {
  const uploadBox = document.querySelector('.upload-box')
  const uploadInput = document.querySelector('.upload-input')
  const uploadList = document.querySelector('.upload-list')
  return {
    uploadBox,
    uploadInput,
    uploadList
  }
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

// 上传
async function upload(file, uploadList, uploadInput) {
  // 创建List Item
  const listItem = document.createElement('li')
  listItem.setAttribute('class', 'upload-list-item')
  // 创建进度条
  const progressInner = document.createElement('div')
  progressInner.setAttribute('class', 'list-item-progress')
  // 创建进度数字
  const progressNumber = document.createElement('span')
  progressNumber.setAttribute('class', 'upload-count')
  // 获取列表中的第一个元素
  const listFirChild = uploadList.querySelector('li:first-child')

  // 获取文件
  const { name, size } = file
  const [, suffix] = /\.([a-zA-Z0-9]+)$/.exec(name) // 获取文件后缀
  const HASH = await genHASH(file)
  listItem.innerText = name
  listItem.appendChild(progressInner)
  listItem.appendChild(progressNumber)
  if (listFirChild) {
    uploadList.insertBefore(listItem, listFirChild)
  } else {
    uploadList.appendChild(listItem)
  }

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
    progressNumber.innerText = `${complateIndex}%`
    if (complateIndex < num) return
    // 全部切片已上传，请求合并切片
    const params = {
      filename: name, // 文件原始名称
      hash: HASH
    }
    request.post('/merge', params).then(res => {
      if (+res.code === 1) {
        // 合并成功 上传完成
        uploadInput.value = ''
        progressInner.style.width = '100%'
        progressNumber.innerText = '100%'
        progressNumber.classList.add('is-success')
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
}

// 上传逻辑
function useUpload() {
  const { uploadBox, uploadInput, uploadList } = querySelectors()
  uploadBox.addEventListener('click', () => uploadInput.click())

  uploadInput.addEventListener('change', (e) => {
    for (const file of e.target.files) {
      upload(file, uploadList, uploadInput)
    }
  })
}