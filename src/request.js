/*
 * @Descripttion: your project
 * @version: 0.0.0
 * @Author: Minyoung
 * @Date: 2021-11-19 23:29:51
 * @LastEditors: Minyoung
 * @LastEditTime: 2022-03-31 22:14:49
 */
import axios from 'axios'

export const request = axios.create({
  baseURL: 'http://localhost:9528',
  // baseURL: 'http://192.168.100.8:9528',
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.response.use(
  response => response.data,
  err => {
    // alert('出错了')
    throw Error(err)
  }
)