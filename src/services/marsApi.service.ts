import axios, { AxiosResponse, AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "https://api.nasa.gov/mars-photos/api/v1",
  params: {
    api_key: process.env.NASA_API_KEY,
  },
  timeout: 150000,
});

export default {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return new Promise((resolve, reject) => {
      api
        .get<T>(url, config)
        .then((response: AxiosResponse<T>) => {
          const limitRemaining = response.headers["x-ratelimit-remaining"];
          console.log("RateLimit Remaining", limitRemaining + "/2000");

          resolve(response);
        })
        .catch((error) => reject(error));
    });
  },
};
