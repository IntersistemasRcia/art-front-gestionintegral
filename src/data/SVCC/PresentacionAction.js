import axios from "axios";
import urlAPIEmpleador from "../../components/api/apiEmpleador";

export class PresentaicionActions {
	static #instance = axios.create({
		baseURL: `${urlAPIEmpleador}SVCC/Presentaciones/`,
	});

	static ultima() {
		this.#instance.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem("token");

				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
					return config;
				}
			},
			(error) => {
				return Promise.reject(error);
			}
		);
		return new Promise((resolve, eject) => {
			this.#instance
				.get(`Ultima`)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}

	static nueva(presentacion) {
		this.#instance.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem("token");

				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
					return config;
				}
			},
			(error) => {
				return Promise.reject(error);
			}
		);
		return new Promise((resolve, eject) => {
			this.#instance
				.post(`Nueva`, presentacion)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}

	static finaliza(presentacion) {
		this.#instance.interceptors.request.use(
			(config) => {
				const token = localStorage.getItem("token");

				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
					return config;
				}
			},
			(error) => {
				return Promise.reject(error);
			}
		);
		return new Promise((resolve, eject) => {
			this.#instance
				.put(`Finaliza`, presentacion)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}
}

export default PresentaicionActions;
