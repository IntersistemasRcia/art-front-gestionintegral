import axios from "axios";
import urlAPIEmpleador from "../../components/api/apiEmpleador";

export class TrabajadorAction {
	static #instance = axios.create({
		baseURL: `${urlAPIEmpleador}SVCC/Trabajadores/`,
	});

	static todos(params = "") {
		if (params !== "") params = `?${params}`;
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
				.get(`${params}`)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}

	static agrega(record) {
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
				.post(``, record)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}

	static modifica(record) {
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
				.put(`${record.interno}`, record)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}

	static borra(record) {
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
				.delete(`${record.interno}`)
				.then((response) => {
					resolve(response);
				})
				.catch((error) => {
					resolve(error.response);
				});
		});
	}
}

export default TrabajadorAction;
