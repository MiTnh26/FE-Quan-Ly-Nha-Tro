import axiosInstance from "./axiosInstance"

const createRequest = body => axiosInstance.post('/requests/createRequest', body)
const getListRequest = (params) => {
  const queryString = new URLSearchParams(params).toString();
  return axiosInstance.get(`/requests/getListRequest?${queryString}`)
}
const changeRequestStatus = body => axiosInstance.put('/requests/changeRequestStatus', body)
const getListRequestByUser = () => axiosInstance.get("/requests/getListRequestByUser")

const RequestAPI = {
  createRequest,
  getListRequest,
  changeRequestStatus,
  getListRequestByUser
}

export default RequestAPI