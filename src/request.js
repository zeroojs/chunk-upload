import axios from 'axios'

export const request = axios.create({
  baseURL: 'http://localhost:9528',
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.response.use(
  response => response.data,
  err => {
    throw Error(err)
    alert('出错了')
  }
)