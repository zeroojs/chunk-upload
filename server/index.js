/*
 * @Descripttion: your project
 * @version: 0.0.0
 * @Author: Minyoung
 * @Date: 2021-11-20 13:14:13
 * @LastEditors: Minyoung
 * @LastEditTime: 2022-01-30 10:24:33
 */
const fs = require('fs')
const path = require('path')
const app = require('express')()
const cors = require('cors')
const multer = require('multer')
const { json: parseJSON, urlencoded: parseUrlencoded } = require('body-parser')

const resolve = p => path.resolve(__dirname, p)
const PORT = 9528

// const uploadMid = multer({ dest: resolve('./resource/') })
const uploadMid = multer()
app.use(parseUrlencoded({ extended: false })) // 解析 application/x-www-form-urlencoded 格式的请求
app.use(parseJSON()) // 解析 application/json 格式的请求
app.use(cors())

// 查询hash列表
app.get('/chunks', (req, res) => {
  const files = fs.readdirSync(resolve('./resource'))
  res.send({
    code: 1,
    data: files
  })
})

// 上传
app.post('/upload', uploadMid.single('file'), (req, res) => {
  const file = req.file
  const filename = req.body.filename
  // console.log('filename', filename)
  // const [, suffix] = /\.([a-zA-Z0-9]+)$/.exec(file.originalname)
  // const stream = file.stream
  fs.writeFileSync(resolve(`./resource/${filename}`), file.buffer)
  res.send({ code: 1 })
})

// 排序文件
function sortFiles(files = []) {
  const getFileIndex = file => {
    const [, index] = /_(\S*)\./.exec(file)
    return parseInt(index)
  }
  const len = files.length
  let minIndex, temp
  for (let i = 0; i < len - 1; i++) {
      minIndex = i
      for (let j = i + 1; j < len; j++) {
          if (getFileIndex(files[j]) < getFileIndex(files[minIndex])) {     //寻找最小的数
              minIndex = j                //将最小数的索引保存
          }
      }
      temp = files[i]
      files[i] = files[minIndex]
      files[minIndex] = temp
  }
  return files
}

// 合并
function mergeFile(filename = '', hash = '') {
  let files = fs.readdirSync(resolve('./resource'))
  files = files.filter(file => file.indexOf(hash) !== -1)
  const filesBuffer = []
  sortFiles(files)
  files.forEach((item, index) => {
    const filePath = resolve(`./resource/${item}`)
    const file = fs.readFileSync(filePath)
    filesBuffer.push(file)
    fs.unlinkSync(filePath)
  })
  const buffer = Buffer.concat(filesBuffer)
  const savePath = /mp4|mov/i.test(filename) ?
  resolve(`./resource/videos/${filename}`)
  :
  resolve(`./resource/${filename}`)
  // fs.writeFileSync(resolve(`./resource/${filename}`), buffer)
  fs.writeFileSync(savePath, buffer)
}
app.post('/merge', (req, res) => {
  const { filename, hash } = req.body
  mergeFile(filename, hash)
  res.send({ code: 1, filename })
})

app.listen(PORT, () => {
  console.log(`服务器已启动：http://localhost:${PORT}`)
})