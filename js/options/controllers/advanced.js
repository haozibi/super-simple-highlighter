/*
 * This file is part of Super Simple Highlighter.
 * 
 * Super Simple Highlighter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Super Simple Highlighter is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

// 'aboutControllers' module containing a single controller, named 'about'
angular.module('advancedControllers', []).controller('advanced', ["$scope", function ($scope) {
	class Controller {
		/**
		 * Creates an instance of Controller.
		 * @param {Object} scope - controller $scope
		 * @memberof Controller
		 */
		constructor(scope) {
			this.scope = scope

			for (const func of [
				this.onClickExport,
				this.onClickSync,
				this.onFilesChange
			]) {
				this.scope[func.name] = func.bind(this)
			}

			// TODO: move this to html
			document.querySelector('#files').addEventListener('change', this.onFilesChange)
		}

		/**
		 * @typedef {Object} Header
		 * @prop {string} magic
		 * @prop {number} version
		 */

		/**
		 * A file was selected for import
		 * 
		 * @memberof Controller
		 */
		onFilesChange() {
			// @ts-ignore
			const file = /** @type {DataTransfer} */ (event.target).files[0]
			const reader = new FileReader()

			// definitions have to be parsed before they're used
			let storageItems

			// Closure to capture the file information.
			reader.onload = () => {
				// newline delimited json
				const ldjson = /** @type {FileReader} */ (event.target).result
				const jsonObjects = ldjson.split('\n').filter(line => line.length > 0)

				// newline delimited json
				return new Promise((resolve, reject) => {
					// validate header

					/** @type {Header} */
					const header = JSON.parse(jsonObjects.shift())

					if (header.magic !== Controller.MAGIC || header.version !== 1) {
						reject({
							status: 403,
							message: "Invalid File"
						});
					} else {
						resolve()
					}
				}).then(() => {
					//     return new Promise(resolve => { chrome.runtime.getBackgroundPage(p => resolve(p)) })
					// }).then(({factory}) => {
					// the first line-delimited json object is the storage highlights object. 
					// Don't use them until the database loads successfully remainder is the database
					storageItems = JSON.parse(jsonObjects.shift());
					console.log("storageItems1:", storageItems)
					// load remainder, which is just the replicated stream
					return new DB().loadDB(jsonObjects.join('\n'))
				}).then(() => {
					console.log("storageItems2:", storageItems)
					// set associated styles. null items are removed (implying default should be used)
					return new ChromeHighlightStorage().setAll(storageItems)
				}).then(() => {
					location.reload();
				}).catch(function (err) {
					// error loading or replicating tmp db to main db
					alert(`Error importing backup\n\nStatus: ${err.status}\nMessage: ${err.message}`)
				})
			}

			// Read in the image file as a data URL.
			reader.readAsText(file, "utf-8");
			// reader.readAsDataURL(file);
		}

		onClickSync() {
			console.log("[highlighter] start sync");

			var email = "";
			chrome.identity.getProfileUserInfo(function (userInfo) {
				/* Use userInfo.email, or better (for privacy) userInfo.id
				   They will be empty if user is not signed in in Chrome */

				email = userInfo.email
				console.log(userInfo)
				if (email == "") {
					alert(`Error\n\nMessage:`, "email empty")
					return
				}

				// var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
				// isok = reg.test(email);
				// if (!isok) {
				// 	alert(`Error\n\nMessage:`, "email error")
				// 	return
				// }

				var baseURI = "http://127.0.0.1:9090/upload"
				var uri = baseURI + "?email=" + email

				console.log(email)

				/** @type {Header} */
				const header = {
					magic: Controller.MAGIC,
					version: 1,
				}

				// start with header
				let ldjson = JSON.stringify(header)

				new ChromeHighlightStorage().getAll({ defaults: false }).then(items => {
					// the first item (after header) is always the highlights object
					ldjson += `\n${JSON.stringify(items)}`

					// the remainder is the dumped database
					const stream = new window.memorystream();

					stream.on('data', chunk => {
						console.log("[export]2", chunk.toString())
						ldjson += `\n${chunk.toString()}`;
					})

					return new DB().dumpDB(stream)
				}).then(() => {

					var httpRequest = new XMLHttpRequest();//第一步：创建需要的对象
					httpRequest.open('POST', uri, true); //第二步：打开连接/***发送json格式文件必须设置请求头 ；如下 - */
					httpRequest.setRequestHeader("Content-type", "application/json");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）var obj = { name: 'zhansgan', age: 18 };
					httpRequest.send(ldjson);//发送请求 将json写入send中

					httpRequest.onreadystatechange = function () {//请求后的回调接口，可将请求成功后要执行的程序写在其中
						if (httpRequest.readyState == 4 && httpRequest.status == 200) {//验证请求是否发送成功
							var ldjson = httpRequest.responseText;//获取到服务端返回的数据
							console.log("resp:", ldjson);
							// const ldjson = /** @type {FileReader} */ (event.target).result

							let storageItems;
							
							const jsonObjects = ldjson.split('\n').filter(line => line.length > 0)

							// newline delimited json
							new Promise((resolve, reject) => {
								// validate header

								/** @type {Header} */
								const header = JSON.parse(jsonObjects.shift())

								if (header.magic !== Controller.MAGIC || header.version !== 1) {
									reject({
										status: 403,
										message: "Invalid File"
									});
								} else {
									resolve()
								}
							}).then(() => {
								//     return new Promise(resolve => { chrome.runtime.getBackgroundPage(p => resolve(p)) })
								// }).then(({factory}) => {
								// the first line-delimited json object is the storage highlights object. 
								// Don't use them until the database loads successfully remainder is the database
								storageItems = JSON.parse(jsonObjects.shift());
								console.log("storageItems1:", storageItems)
								// load remainder, which is just the replicated stream
								return new DB().loadDB(jsonObjects.join('\n'))
							}).then(() => {
								console.log("storageItems2:", storageItems)
								// set associated styles. null items are removed (implying default should be used)
								return new ChromeHighlightStorage().setAll(storageItems)
							}).then(() => {
								location.reload();
							}).catch(function (err) {
								// error loading or replicating tmp db to main db
								alert(`Error importing backup\n\nStatus: ${err.status}\nMessage: ${err.message}`)
							})
						}
					};
				})

				alert("okk");
			});


		}

		onClickExport() {
			/** @type {Header} */
			const header = {
				magic: Controller.MAGIC,
				version: 1,
			}

			// start with header
			let ldjson = JSON.stringify(header)

			return new ChromeHighlightStorage().getAll({ defaults: false }).then(items => {
				// the first item (after header) is always the highlights object
				ldjson += `\n${JSON.stringify(items)}`

				console.log("[export]", ldjson)

				// the remainder is the dumped database
				const stream = new window.memorystream();

				stream.on('data', chunk => {
					console.log("[export]2", chunk.toString())
					ldjson += `\n${chunk.toString()}`;
				})

				return new DB().dumpDB(stream)
			}).then(() => {
				// create a temporary anchor to navigate to data uri
				const elm = document.createElement("a")

				elm.download = `${chrome.i18n.getMessage("advanced_database_export_file_name")}.ldjson`
				elm.href = "data:text;base64," + Base64Utils.utf8_to_b64(ldjson, window)

				// a.href = "data:text/plain;charset=utf-8;," + encodeURIComponent(dumpedString);
				// a.href = "data:text;base64," + utf8_to_b64(dumpedString);
				// a.href = "data:text;base64," + utf8_to_b64(dumpedString);
				//window.btoa(dumpedString);

				// create & dispatch mouse event to hidden anchor
				const event = document.createEvent("MouseEvent")

				event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
				elm.dispatchEvent(event)
			})
		}
	} // end class

	// static properties

	Controller.MAGIC = 'Super Simple Highlighter Exported Database'

	// initialize
	new Controller($scope)
}])