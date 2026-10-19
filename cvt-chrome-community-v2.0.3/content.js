(function() {
  "use strict";
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var browserPolyfill$1 = { exports: {} };
  var browserPolyfill = browserPolyfill$1.exports;
  var hasRequiredBrowserPolyfill;
  function requireBrowserPolyfill() {
    if (hasRequiredBrowserPolyfill) return browserPolyfill$1.exports;
    hasRequiredBrowserPolyfill = 1;
    (function(module, exports$1) {
      (function(global, factory) {
        {
          factory(module);
        }
      })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : browserPolyfill, function(module2) {
        if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
          throw new Error("This script should only be loaded in a browser extension.");
        }
        if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
          const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
          const wrapAPIs = (extensionAPIs) => {
            const apiMetadata = {
              "alarms": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "clearAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "bookmarks": {
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getChildren": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getRecent": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getSubTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTree": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeTree": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "browserAction": {
                "disable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "enable": {
                  "minArgs": 0,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "getBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "openPopup": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setBadgeBackgroundColor": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setBadgeText": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "browsingData": {
                "remove": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "removeCache": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCookies": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeDownloads": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFormData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeHistory": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeLocalStorage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePasswords": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removePluginData": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "settings": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "commands": {
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "contextMenus": {
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "cookies": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAllCookieStores": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "devtools": {
                "inspectedWindow": {
                  "eval": {
                    "minArgs": 1,
                    "maxArgs": 2,
                    "singleCallbackArg": false
                  }
                },
                "panels": {
                  "create": {
                    "minArgs": 3,
                    "maxArgs": 3,
                    "singleCallbackArg": true
                  },
                  "elements": {
                    "createSidebarPane": {
                      "minArgs": 1,
                      "maxArgs": 1
                    }
                  }
                }
              },
              "downloads": {
                "cancel": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "download": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "erase": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFileIcon": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "open": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "pause": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeFile": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "resume": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "extension": {
                "isAllowedFileSchemeAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "isAllowedIncognitoAccess": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "history": {
                "addUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "deleteRange": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "deleteUrl": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getVisits": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "search": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "i18n": {
                "detectLanguage": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAcceptLanguages": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "identity": {
                "launchWebAuthFlow": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "idle": {
                "queryState": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "management": {
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getSelf": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "setEnabled": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "uninstallSelf": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "notifications": {
                "clear": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPermissionLevel": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              },
              "pageAction": {
                "getPopup": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getTitle": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "hide": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setIcon": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "setPopup": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "setTitle": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                },
                "show": {
                  "minArgs": 1,
                  "maxArgs": 1,
                  "fallbackToNoCallback": true
                }
              },
              "permissions": {
                "contains": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "request": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "runtime": {
                "getBackgroundPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getPlatformInfo": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "openOptionsPage": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "requestUpdateCheck": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "sendMessage": {
                  "minArgs": 1,
                  "maxArgs": 3
                },
                "sendNativeMessage": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "setUninstallURL": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "sessions": {
                "getDevices": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getRecentlyClosed": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "restore": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "storage": {
                "local": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                },
                "managed": {
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  }
                },
                "sync": {
                  "clear": {
                    "minArgs": 0,
                    "maxArgs": 0
                  },
                  "get": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "getBytesInUse": {
                    "minArgs": 0,
                    "maxArgs": 1
                  },
                  "remove": {
                    "minArgs": 1,
                    "maxArgs": 1
                  },
                  "set": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              },
              "tabs": {
                "captureVisibleTab": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "create": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "detectLanguage": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "discard": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "duplicate": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "executeScript": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "getZoom": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getZoomSettings": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goBack": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "goForward": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "highlight": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "insertCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "move": {
                  "minArgs": 2,
                  "maxArgs": 2
                },
                "query": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "reload": {
                  "minArgs": 0,
                  "maxArgs": 2
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "removeCSS": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "sendMessage": {
                  "minArgs": 2,
                  "maxArgs": 3
                },
                "setZoom": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "setZoomSettings": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "update": {
                  "minArgs": 1,
                  "maxArgs": 2
                }
              },
              "topSites": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "webNavigation": {
                "getAllFrames": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "getFrame": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "webRequest": {
                "handlerBehaviorChanged": {
                  "minArgs": 0,
                  "maxArgs": 0
                }
              },
              "windows": {
                "create": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "get": {
                  "minArgs": 1,
                  "maxArgs": 2
                },
                "getAll": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getCurrent": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getLastFocused": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "update": {
                  "minArgs": 2,
                  "maxArgs": 2
                }
              }
            };
            if (Object.keys(apiMetadata).length === 0) {
              throw new Error("api-metadata.json has not been included in browser-polyfill");
            }
            class DefaultWeakMap extends WeakMap {
              constructor(createItem, items = void 0) {
                super(items);
                this.createItem = createItem;
              }
              get(key) {
                if (!this.has(key)) {
                  this.set(key, this.createItem(key));
                }
                return super.get(key);
              }
            }
            const isThenable = (value) => {
              return value && typeof value === "object" && typeof value.then === "function";
            };
            const makeCallback = (promise, metadata) => {
              return (...callbackArgs) => {
                if (extensionAPIs.runtime.lastError) {
                  promise.reject(new Error(extensionAPIs.runtime.lastError.message));
                } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                  promise.resolve(callbackArgs[0]);
                } else {
                  promise.resolve(callbackArgs);
                }
              };
            };
            const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
            const wrapAsyncFunction = (name, metadata) => {
              return function asyncFunctionWrapper(target, ...args) {
                if (args.length < metadata.minArgs) {
                  throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
                }
                if (args.length > metadata.maxArgs) {
                  throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
                }
                return new Promise((resolve, reject) => {
                  if (metadata.fallbackToNoCallback) {
                    try {
                      target[name](...args, makeCallback({
                        resolve,
                        reject
                      }, metadata));
                    } catch (cbError) {
                      console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                      target[name](...args);
                      metadata.fallbackToNoCallback = false;
                      metadata.noCallback = true;
                      resolve();
                    }
                  } else if (metadata.noCallback) {
                    target[name](...args);
                    resolve();
                  } else {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  }
                });
              };
            };
            const wrapMethod = (target, method, wrapper) => {
              return new Proxy(method, {
                apply(targetMethod, thisObj, args) {
                  return wrapper.call(thisObj, target, ...args);
                }
              });
            };
            let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
            const wrapObject = (target, wrappers = {}, metadata = {}) => {
              let cache = /* @__PURE__ */ Object.create(null);
              let handlers = {
                has(proxyTarget2, prop) {
                  return prop in target || prop in cache;
                },
                get(proxyTarget2, prop, receiver) {
                  if (prop in cache) {
                    return cache[prop];
                  }
                  if (!(prop in target)) {
                    return void 0;
                  }
                  let value = target[prop];
                  if (typeof value === "function") {
                    if (typeof wrappers[prop] === "function") {
                      value = wrapMethod(target, target[prop], wrappers[prop]);
                    } else if (hasOwnProperty(metadata, prop)) {
                      let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                      value = wrapMethod(target, target[prop], wrapper);
                    } else {
                      value = value.bind(target);
                    }
                  } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                    value = wrapObject(value, wrappers[prop], metadata[prop]);
                  } else if (hasOwnProperty(metadata, "*")) {
                    value = wrapObject(value, wrappers[prop], metadata["*"]);
                  } else {
                    Object.defineProperty(cache, prop, {
                      configurable: true,
                      enumerable: true,
                      get() {
                        return target[prop];
                      },
                      set(value2) {
                        target[prop] = value2;
                      }
                    });
                    return value;
                  }
                  cache[prop] = value;
                  return value;
                },
                set(proxyTarget2, prop, value, receiver) {
                  if (prop in cache) {
                    cache[prop] = value;
                  } else {
                    target[prop] = value;
                  }
                  return true;
                },
                defineProperty(proxyTarget2, prop, desc) {
                  return Reflect.defineProperty(cache, prop, desc);
                },
                deleteProperty(proxyTarget2, prop) {
                  return Reflect.deleteProperty(cache, prop);
                }
              };
              let proxyTarget = Object.create(target);
              return new Proxy(proxyTarget, handlers);
            };
            const wrapEvent = (wrapperMap) => ({
              addListener(target, listener, ...args) {
                target.addListener(wrapperMap.get(listener), ...args);
              },
              hasListener(target, listener) {
                return target.hasListener(wrapperMap.get(listener));
              },
              removeListener(target, listener) {
                target.removeListener(wrapperMap.get(listener));
              }
            });
            const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onRequestFinished(req) {
                const wrappedReq = wrapObject(req, {}, {
                  getContent: {
                    minArgs: 0,
                    maxArgs: 0
                  }
                });
                listener(wrappedReq);
              };
            });
            const onMessageWrappers = new DefaultWeakMap((listener) => {
              if (typeof listener !== "function") {
                return listener;
              }
              return function onMessage(message, sender, sendResponse) {
                let didCallSendResponse = false;
                let wrappedSendResponse;
                let sendResponsePromise = new Promise((resolve) => {
                  wrappedSendResponse = function(response) {
                    didCallSendResponse = true;
                    resolve(response);
                  };
                });
                let result;
                try {
                  result = listener(message, sender, wrappedSendResponse);
                } catch (err) {
                  result = Promise.reject(err);
                }
                const isResultThenable = result !== true && isThenable(result);
                if (result !== true && !isResultThenable && !didCallSendResponse) {
                  return false;
                }
                const sendPromisedResult = (promise) => {
                  promise.then((msg) => {
                    sendResponse(msg);
                  }, (error) => {
                    let message2;
                    if (error && (error instanceof Error || typeof error.message === "string")) {
                      message2 = error.message;
                    } else {
                      message2 = "An unexpected error occurred";
                    }
                    sendResponse({
                      __mozWebExtensionPolyfillReject__: true,
                      message: message2
                    });
                  }).catch((err) => {
                    console.error("Failed to send onMessage rejected reply", err);
                  });
                };
                if (isResultThenable) {
                  sendPromisedResult(result);
                } else {
                  sendPromisedResult(sendResponsePromise);
                }
                return true;
              };
            });
            const wrappedSendMessageCallback = ({
              reject,
              resolve
            }, reply) => {
              if (extensionAPIs.runtime.lastError) {
                if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                  resolve();
                } else {
                  reject(new Error(extensionAPIs.runtime.lastError.message));
                }
              } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
                reject(new Error(reply.message));
              } else {
                resolve(reply);
              }
            };
            const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                const wrappedCb = wrappedSendMessageCallback.bind(null, {
                  resolve,
                  reject
                });
                args.push(wrappedCb);
                apiNamespaceObj.sendMessage(...args);
              });
            };
            const staticWrappers = {
              devtools: {
                network: {
                  onRequestFinished: wrapEvent(onRequestFinishedWrappers)
                }
              },
              runtime: {
                onMessage: wrapEvent(onMessageWrappers),
                onMessageExternal: wrapEvent(onMessageWrappers),
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 1,
                  maxArgs: 3
                })
              },
              tabs: {
                sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                  minArgs: 2,
                  maxArgs: 3
                })
              }
            };
            const settingMetadata = {
              clear: {
                minArgs: 1,
                maxArgs: 1
              },
              get: {
                minArgs: 1,
                maxArgs: 1
              },
              set: {
                minArgs: 1,
                maxArgs: 1
              }
            };
            apiMetadata.privacy = {
              network: {
                "*": settingMetadata
              },
              services: {
                "*": settingMetadata
              },
              websites: {
                "*": settingMetadata
              }
            };
            return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
          };
          module2.exports = wrapAPIs(chrome);
        } else {
          module2.exports = globalThis.browser;
        }
      });
    })(browserPolyfill$1);
    return browserPolyfill$1.exports;
  }
  var browserPolyfillExports = requireBrowserPolyfill();
  const browser = /* @__PURE__ */ getDefaultExportFromCjs(browserPolyfillExports);
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function randomDelay(min = 200, max = 600) {
    return wait(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  let debugLoggingEnabled = false;
  function setDebugLogging(enabled) {
    debugLoggingEnabled = enabled;
  }
  function log(message, ...args) {
    if (!debugLoggingEnabled) return;
    console.log(`[Civit Bulk] ${message}`, ...args);
  }
  const ALL_REACTIONS = ["👍", "❤️", "😂", "😢"];
  const STATE = {
    selected: /* @__PURE__ */ new Set(),
    bulkModeEnabled: false,
    useCollections: true,
    reactionMode: 0,
    processing: false,
    currentIndex: 0,
    totalImages: 0,
    selectedCollectionId: null,
    defaultBuzzAmount: 10,
    selectedCollectionIds: [],
    randomModeEnabled: false,
    randomCount: 30
  };
  function getActiveReactions() {
    switch (STATE.reactionMode) {
      case 0:
        return [];
      // No reactions
      case 1:
        return [ALL_REACTIONS[1]];
      // Only Heart ❤️
      case 2:
        return [ALL_REACTIONS[0], ALL_REACTIONS[1]];
      // Thumbs 👍 and Heart ❤️
      case 4:
      default:
        return [...ALL_REACTIONS];
    }
  }
  function findImageCards() {
    const cards = [];
    const seenIds = /* @__PURE__ */ new Set();
    const searchRoot = document.querySelector('[class*="MasonryContainer"]') ?? document.querySelector("main") ?? document.body;
    const links = searchRoot.querySelectorAll('a[href^="/images/"]');
    for (const link of links) {
      if (!link.querySelector("img, video")) continue;
      const match = link.href.match(/\/images\/(\d+)/);
      const imageId = match ? match[1] : null;
      if (!imageId || seenIds.has(imageId)) continue;
      const container = findCardContainer(link);
      if (!container) continue;
      if (container.classList.contains("cvt-collected-hidden")) continue;
      seenIds.add(imageId);
      cards.push({ element: container, imageId, link });
    }
    log(`Found ${cards.length} image/video cards`);
    return cards;
  }
  function findCardContainer(link) {
    let container = null;
    let el = link.parentElement;
    let depth = 0;
    while (el && depth < 12) {
      const cls = el.className || "";
      if (cls.includes("relative") && cls.includes("flex") && cls.includes("overflow-hidden") && (cls.includes("rounded-md") || cls.includes("rounded"))) {
        container = el;
        break;
      }
      if (cls.includes("overflow-hidden") && el.querySelector("img, video")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.width < window.innerWidth * 0.95) {
          container = el;
          break;
        }
      }
      el = el.parentElement;
      depth++;
    }
    if (!container) {
      const parent = link.parentElement;
      if (parent?.querySelector("img, video")) container = parent;
    }
    return container;
  }
  function findPositionedParent(card) {
    const media = card.link.querySelector("img, video");
    if (!media) return card.link;
    let parent = media.parentElement;
    let depth = 0;
    while (parent && depth < 10) {
      const style = window.getComputedStyle(parent);
      if (style.position !== "static") break;
      parent = parent.parentElement;
      depth++;
    }
    if (!parent || depth >= 10) {
      parent = card.link;
    }
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === "static") {
      parent.style.position = "relative";
    }
    return parent;
  }
  function createCheckboxOverlay(card) {
    card.element.dataset.cvtCardId = card.imageId;
    const existing = card.element.querySelector(".cvt-overlay-cluster");
    if (existing) return existing;
    const media = card.link.querySelector("img, video");
    if (!media) return null;
    const parent = findPositionedParent(card);
    const cluster = document.createElement("div");
    cluster.className = "cvt-overlay-cluster";
    if (STATE.bulkModeEnabled) cluster.classList.add("cvt-cluster-visible");
    cluster.dataset.imageId = card.imageId;
    const checkbox = document.createElement("button");
    checkbox.className = "cvt-overlay-cluster-btn cvt-checkbox-overlay";
    checkbox.dataset.imageId = card.imageId;
    checkbox.title = "Select image";
    checkbox.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(card.imageId, card.element);
    });
    cluster.appendChild(checkbox);
    const collDot = document.createElement("button");
    collDot.className = "cvt-overlay-cluster-btn cvt-collection-dot";
    collDot.title = "Toggle collection include/exclude";
    const hasCollections = STATE.selectedCollectionIds.length > 0;
    const isIncluded = getImageCollectionState(card.imageId);
    updateCollDotState(collDot, isIncluded, hasCollections);
    collDot.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (STATE.selectedCollectionIds.length === 0) return;
      const current = getImageCollectionState(card.imageId);
      collectionOverrides.set(card.imageId, !current);
      updateCollDotState(collDot, !current, STATE.selectedCollectionIds.length > 0);
    });
    cluster.appendChild(collDot);
    parent.appendChild(cluster);
    return cluster;
  }
  function toggleSelection(imageId, cardElement) {
    if (STATE.selected.has(imageId)) {
      STATE.selected.delete(imageId);
    } else {
      STATE.selected.add(imageId);
    }
    updateCheckboxState(imageId, cardElement);
    updateToolbarUI();
  }
  function updateCheckboxState(imageId, cardElement) {
    const checkbox = cardElement.querySelector(".cvt-checkbox-overlay");
    if (!checkbox) return;
    const isSelected = STATE.selected.has(imageId);
    checkbox.classList.toggle("cvt-checked", isSelected);
    checkbox.classList.toggle("cvt-active", isSelected);
    cardElement.classList.toggle("cvt-card-selected", isSelected);
  }
  function updateClusterVisibility() {
    document.querySelectorAll(".cvt-overlay-cluster").forEach((cluster) => {
      cluster.classList.toggle("cvt-cluster-visible", STATE.bulkModeEnabled);
    });
  }
  const buzzOverrides = /* @__PURE__ */ new Map();
  const collectionOverrides = /* @__PURE__ */ new Map();
  function getImageCollectionState(imageId) {
    if (collectionOverrides.has(imageId)) {
      return collectionOverrides.get(imageId);
    }
    return STATE.selectedCollectionIds.length > 0;
  }
  function refreshAllCollectionDots() {
    const hasCollections = STATE.selectedCollectionIds.length > 0;
    document.querySelectorAll(".cvt-collection-dot").forEach((dot) => {
      const cluster = dot.closest(".cvt-overlay-cluster");
      const imageId = cluster?.dataset.imageId;
      if (!imageId) return;
      const isIncluded = getImageCollectionState(imageId);
      updateCollDotState(dot, isIncluded, hasCollections);
    });
  }
  function updateCollDotState(btn, included, hasCollections) {
    if (!hasCollections) {
      btn.innerHTML = "📂";
      btn.classList.remove("cvt-active");
      btn.classList.remove("cvt-disabled");
      btn.classList.add("cvt-no-collection");
      btn.title = "No collections selected";
      return;
    }
    btn.classList.remove("cvt-no-collection");
    btn.classList.remove("cvt-disabled");
    btn.classList.toggle("cvt-active", included);
    btn.innerHTML = included ? "📁" : "🚫";
    btn.title = included ? "Will add to collection (click to exclude)" : "Excluded from collection (click to include)";
  }
  let bulkObserver = null;
  function startBulkObserver() {
    if (bulkObserver) return;
    bulkObserver = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        setTimeout(() => installCheckboxes(), 300);
      }
    });
    bulkObserver.observe(document.body, { childList: true, subtree: true });
  }
  function stopBulkObserver() {
    if (bulkObserver) {
      bulkObserver.disconnect();
      bulkObserver = null;
    }
  }
  // Right-click anywhere on a card toggles its selection while bulk mode is on.
  // Shift+Right-click falls through to the normal browser context menu.
  function handleBulkContextMenu(e) {
    if (!STATE.bulkModeEnabled || e.shiftKey) return;
    const cardEl = e.target.closest?.("[data-cvt-card-id]");
    if (!cardEl) return;
    e.preventDefault();
    e.stopPropagation();
    toggleSelection(cardEl.dataset.cvtCardId, cardEl);
  }
  function toggleBulkMode() {
    STATE.bulkModeEnabled = !STATE.bulkModeEnabled;
    if (STATE.bulkModeEnabled) {
      installCheckboxes();
      startBulkObserver();
      window.addEventListener("contextmenu", handleBulkContextMenu, true);
    } else {
      window.removeEventListener("contextmenu", handleBulkContextMenu, true);
      stopBulkObserver();
      removeCheckboxes();
    }
    updateClusterVisibility();
    updateToolbarUI();
  }
  function installCheckboxes() {
    const cards = findImageCards();
    if (cards.length === 0) {
      log("⚠️ No image cards found! Make sure you are on a Civitai image grid page.");
      return;
    }
    cards.forEach((card) => {
      const overlay = createCheckboxOverlay(card);
      if (overlay) {
        updateCheckboxState(card.imageId, card.element);
      }
    });
  }
  function removeCheckboxes() {
    document.querySelectorAll(".cvt-overlay-cluster").forEach((el) => el.remove());
    document.querySelectorAll("[data-cvt-card-id]").forEach((el) => {
      delete el.dataset.cvtCardId;
    });
    document.querySelectorAll(".cvt-card-selected").forEach((el) => {
      el.classList.remove("cvt-card-selected");
    });
  }
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
  }
  function selectVisible() {
    const cards = findImageCards();
    cards.filter((card) => isInViewport(card.element)).forEach((card) => {
      STATE.selected.add(card.imageId);
      updateCheckboxState(card.imageId, card.element);
    });
    updateToolbarUI();
  }
  function clearSelection() {
    STATE.selected.clear();
    document.querySelectorAll(".cvt-checkbox-overlay").forEach((el) => {
      el.classList.remove("cvt-checked", "cvt-active");
    });
    document.querySelectorAll(".cvt-card-selected").forEach((el) => {
      el.classList.remove("cvt-card-selected");
    });
    updateToolbarUI();
  }
  const EMOJI_TO_REACTION = {
    "👍": "Like",
    "❤️": "Heart",
    "😂": "Laugh",
    "😢": "Cry"
  };
  const REACTION_TO_EMOJI = {
    Like: "👍",
    Heart: "❤️",
    Laugh: "😂",
    Cry: "😢"
  };
  async function ensureReactions(cardElement, imageId) {
    const emojis = getActiveReactions();
    const reactions = emojis.map((e) => EMOJI_TO_REACTION[e]).filter((r) => !!r);
    return ensureReactionsViaDom(cardElement, reactions);
  }
  async function ensureReactionsViaDom(cardElement, reactions) {
    const result = { toggled: [], skipped: [], failed: [] };
    for (const reaction of reactions) {
      const emoji = REACTION_TO_EMOJI[reaction];
      try {
        if (isReactionActive(cardElement, emoji)) {
          result.skipped.push(reaction);
          continue;
        }
        const clicked = await clickReactionButton(cardElement, emoji);
        if (clicked) {
          result.toggled.push(reaction);
        } else {
          result.failed.push(reaction);
        }
      } catch (error) {
        log(`❌ Error applying reaction ${emoji}:`, error);
        result.failed.push(reaction);
      }
    }
    return result;
  }
  function isReactionActive(cardElement, emoji) {
    const btn = findReactionButton(cardElement, emoji);
    if (!btn) return false;
    const dataVariant = btn.getAttribute("data-variant");
    if (dataVariant === "light") return true;
    if (btn.getAttribute("aria-pressed") === "true") return true;
    if (btn.dataset.active === "true") return true;
    if (btn.classList.contains("active")) return true;
    if (dataVariant === "filled") return true;
    return false;
  }
  function findReactionButton(cardElement, emoji) {
    const searchRoots = [
      cardElement,
      cardElement.parentElement,
      cardElement.parentElement?.parentElement
    ].filter((el) => el != null);
    const reactionName = Object.entries(EMOJI_TO_REACTION).find(
      ([e]) => e === emoji
    )?.[1];
    for (const root of searchRoots) {
      const buttons = Array.from(root.querySelectorAll("button"));
      const byText = buttons.find((btn) => btn.innerText.includes(emoji));
      if (byText) return byText;
      if (reactionName) {
        const byLabel = buttons.find(
          (btn) => btn.getAttribute("aria-label")?.toLowerCase().includes(reactionName.toLowerCase())
        );
        if (byLabel) return byLabel;
      }
      const byTitle = buttons.find(
        (btn) => btn.title?.includes(emoji) || btn.title?.toLowerCase().includes(reactionName?.toLowerCase() ?? "")
      );
      if (byTitle) return byTitle;
    }
    return null;
  }
  async function clickReactionButton(cardElement, emoji) {
    const btn = findReactionButton(cardElement, emoji);
    if (!btn) {
      log(`⚠️ Reaction button not found for ${emoji}`);
      return false;
    }
    btn.click();
    await randomDelay(150, 250);
    log(`✅ Clicked reaction ${emoji}`);
    return true;
  }
  class ApiError extends Error {
    constructor(message, statusCode, endpoint) {
      super(message);
      this.statusCode = statusCode;
      this.endpoint = endpoint;
      this.name = "ApiError";
    }
  }
  class RateLimitError extends ApiError {
    constructor(endpoint, retryAfter = 1e3) {
      super("Rate limit exceeded", 429, endpoint);
      this.name = "RateLimitError";
      this.retryAfter = retryAfter;
    }
  }
  class AuthError extends ApiError {
    constructor(endpoint) {
      super("Authentication required", 401, endpoint);
      this.name = "AuthError";
    }
  }
  class RateLimiter {
    constructor(maxRequests = 5, windowMs = 1e3) {
      this.maxRequests = maxRequests;
      this.windowMs = windowMs;
      this.queue = [];
      this.timestamps = [];
      this.processing = false;
    }
    async acquire() {
      return new Promise((resolve) => {
        this.queue.push({ resolve });
        this.processQueue();
      });
    }
    reset() {
      this.queue = [];
      this.timestamps = [];
      this.processing = false;
    }
    processQueue() {
      if (this.processing) return;
      this.processing = true;
      const process = () => {
        if (this.queue.length === 0) {
          this.processing = false;
          return;
        }
        const now = Date.now();
        this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
        if (this.timestamps.length < this.maxRequests) {
          this.timestamps.push(now);
          const item = this.queue.shift();
          item?.resolve();
          setTimeout(process, 0);
        } else {
          const waitTime = this.timestamps[0] + this.windowMs - now;
          setTimeout(process, Math.max(waitTime, 10));
        }
      };
      process();
    }
  }
  const BASE_URL = "https://civitai.red";
  const REST_API = `${BASE_URL}/api/v1`;
  const TRPC_API = `${BASE_URL}/api/trpc`;
  const MAX_RETRIES = 3;
  const RETRY_BASE_DELAY = 1e3;
  const rateLimiter = new RateLimiter(5, 1e3);
  async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    await rateLimiter.acquire();
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        if (response.status === 401 || response.status === 403) {
          throw new AuthError(url);
        }
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("retry-after") || "1", 10) * 1e3;
          if (attempt < retries) {
            await sleep(retryAfter || RETRY_BASE_DELAY * Math.pow(2, attempt));
            continue;
          }
          throw new RateLimitError(url, retryAfter);
        }
        if (response.status >= 500 && attempt < retries) {
          await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt));
          continue;
        }
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (attempt < retries) {
          await sleep(RETRY_BASE_DELAY * Math.pow(2, attempt));
          continue;
        }
        throw new ApiError(
          error instanceof Error ? error.message : "Network error",
          0,
          url
        );
      }
    }
    throw new ApiError("Max retries exceeded", 0, url);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function getImages(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.username) searchParams.set("username", params.username);
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.page) searchParams.set("page", String(params.page));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.period) searchParams.set("period", params.period);
    if (params.cursor) searchParams.set("cursor", params.cursor);
    if (params.nsfw !== void 0) searchParams.set("nsfw", String(params.nsfw));
    const url = `${REST_API}/images?${searchParams.toString()}`;
    const response = await fetchWithRetry(url);
    return response.json();
  }
  function getTrpcHeaders() {
    return {
      "Content-Type": "application/json"
    };
  }
  async function trpcQuery(procedure, input) {
    const encodedInput = encodeURIComponent(JSON.stringify({ json: input }));
    const url = `${TRPC_API}/${procedure}?input=${encodedInput}`;
    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: getTrpcHeaders(),
      credentials: "include"
    });
    const data = await response.json();
    return data.result?.data?.json ?? data.result?.data ?? data;
  }
  async function trpcMutation(procedure, input) {
    const url = `${TRPC_API}/${procedure}`;
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: getTrpcHeaders(),
      credentials: "include",
      body: JSON.stringify({ json: input })
    });
    const data = await response.json();
    return data.result?.data?.json ?? data.result?.data ?? data;
  }
  async function getCollections() {
    return trpcQuery("collection.getAllUser", {});
  }
  async function addImageToCollections(imageId, collectionIds) {
    if (collectionIds.length === 0) return;
    await trpcMutation("collection.saveItem", {
      imageId,
      collections: collectionIds.map((collectionId) => ({ collectionId }))
    });
    if (COLLECTED.ids) {
      COLLECTED.ids.add(String(imageId));
      scheduleCollectedScan();
    }
  }
  // ---------- Hide images already in one of your collections (page-session only) ----------
  // State lives only in memory: it survives Civitai's in-app navigation but is gone on
  // reload or tab close. Nothing is sent to Civitai — this is purely cosmetic.
  const COLLECTED = {
    enabled: false,
    ids: null,        // Set<string> of image IDs in any of your collections
    loading: false,
    observer: null,
    scanTimer: null,
    hiddenIds: /* @__PURE__ */ new Set()
  };
  function ensureCollectedStyle() {
    if (document.getElementById("cvt-collected-style")) return;
    const style = document.createElement("style");
    style.id = "cvt-collected-style";
    style.textContent = ".cvt-collected-hidden{display:none !important}";
    document.head.appendChild(style);
  }
  async function fetchCollectedImageIds() {
    const all = await refreshCollections();
    const collections = all.filter((c) => c.type === "Image" || c.type === "Video");
    const ids = /* @__PURE__ */ new Set();
    // Collections are fetched in parallel; pages within one collection are sequential
    // because each page's cursor comes from the previous response. rateLimiter caps at 5/s.
    await Promise.all(
      collections.map(async (c) => {
        let cursor;
        let pages = 0;
        do {
          const input = { collectionId: c.id, limit: 100 };
          if (cursor) input.cursor = cursor;
          const res = await trpcQuery("collection.getAllCollectionItems", input);
          for (const item of res?.collectionItems ?? []) {
            if (item?.type === "image" && item.data?.id != null) ids.add(String(item.data.id));
          }
          cursor = res?.nextCursor;
          pages++;
        } while (cursor && pages < 1e3);
        log(`Collection "${c.name}": scanned ${pages} page(s)`);
      })
    );
    log(`Collected-image index built: ${ids.size} images across ${collections.length} collections`);
    return ids;
  }
  function isCollectionPage() {
    // Never hide on collection pages — every image there is collected by definition.
    return location.pathname.startsWith("/collections");
  }
  function scanAndHideCollected() {
    COLLECTED.scanTimer = null;
    if (!COLLECTED.enabled || !COLLECTED.ids) return;
    if (isCollectionPage()) {
      document.querySelectorAll(".cvt-collected-hidden").forEach((el) => el.classList.remove("cvt-collected-hidden"));
      return;
    }
    const root = document.querySelector('[class*="MasonryContainer"]') ?? document.querySelector("main") ?? document.body;
    // Cheap pass: only resolve the card container for links whose ID matches.
    for (const link of root.querySelectorAll('a[href^="/images/"]')) {
      const match = link.getAttribute("href").match(/^\/images\/(\d+)/);
      if (!match || !COLLECTED.ids.has(match[1])) continue;
      if (!link.querySelector("img, video")) continue;
      const container = findCardContainer(link);
      if (!container || container.classList.contains("cvt-collected-hidden")) continue;
      container.classList.add("cvt-collected-hidden");
      if (STATE.selected.has(match[1])) toggleSelection(match[1], container);
      COLLECTED.hiddenIds.add(match[1]);
    }
    updateHideCollectedButton();
  }
  function scheduleCollectedScan() {
    if (!COLLECTED.enabled || COLLECTED.scanTimer) return;
    COLLECTED.scanTimer = setTimeout(scanAndHideCollected, 200);
  }
  async function toggleHideCollected() {
    if (COLLECTED.loading) return;
    if (COLLECTED.enabled) {
      COLLECTED.enabled = false;
      COLLECTED.observer?.disconnect();
      COLLECTED.observer = null;
      clearTimeout(COLLECTED.scanTimer);
      COLLECTED.scanTimer = null;
      document.querySelectorAll(".cvt-collected-hidden").forEach((el) => el.classList.remove("cvt-collected-hidden"));
      COLLECTED.hiddenIds.clear();
      updateHideCollectedButton();
      return;
    }
    COLLECTED.loading = true;
    updateHideCollectedButton();
    try {
      // Re-fetched on every enable so removals made elsewhere are picked up.
      COLLECTED.ids = await fetchCollectedImageIds();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`❌ Failed to load collection contents: ${msg}`);
      alert(`Couldn't load your collections: ${msg}`);
      return;
    } finally {
      COLLECTED.loading = false;
      updateHideCollectedButton();
    }
    ensureCollectedStyle();
    COLLECTED.enabled = true;
    // Civitai's feed is virtualized: cards are destroyed and recreated while scrolling,
    // so new nodes have to be re-checked continuously.
    COLLECTED.observer = new MutationObserver(scheduleCollectedScan);
    COLLECTED.observer.observe(document.body, { childList: true, subtree: true });
    scanAndHideCollected();
  }
  function updateHideCollectedButton() {
    const btn = document.getElementById("cvt-hide-collected-btn");
    if (!btn) return;
    btn.disabled = COLLECTED.loading;
    btn.classList.toggle("cvt-btn-primary", COLLECTED.enabled);
    btn.classList.toggle("cvt-btn-secondary", !COLLECTED.enabled);
    if (COLLECTED.loading) btn.textContent = "⏳ Scanning collections…";
    else if (COLLECTED.enabled) btn.textContent = `👁 Show Collected (${COLLECTED.hiddenIds.size} hidden)`;
    else btn.textContent = "🙈 Hide Collected";
  }
  async function removeImageFromCollection(collectionId, imageId) {
    // Verified against Civitai source: itemId is the image ID (looked up in the Image table).
    // Removing an image that isn't in the collection is a silent no-op server-side.
    await trpcMutation("collection.removeFromCollection", { collectionId, itemId: imageId });
  }
  async function hideImageOnCivitai(imageId) {
    // hidden: true makes this a "set", not a toggle, so already-hidden images stay hidden.
    await trpcMutation("hiddenPreferences.toggleHidden", {
      kind: "image",
      data: [{ id: imageId }],
      hidden: true
    });
  }
  async function getChatUsers() {
    return trpcQuery("chat.getAllByUser", {});
  }
  const DEFAULT_SETTINGS = {
    theme: "auto",
    apiKey: null,
    defaultCollections: [],
    toolbarVisible: true,
    defaultReactionMode: 0,
    defaultBuzzAmount: 0,
    trackingInterval: 30,
    debugLogging: false
  };
  async function getSettings() {
    const data = await browser.storage.sync.get("settings");
    return { ...DEFAULT_SETTINGS, ...data.settings };
  }
  async function updateSettings(partial) {
    const current = await getSettings();
    const updated = { ...current, ...partial };
    await browser.storage.sync.set({ settings: updated });
    return updated;
  }
  async function getTrackedUsers() {
    const data = await browser.storage.local.get("trackedUsers");
    return (data.trackedUsers || []).filter((u) => Boolean(u.username));
  }
  async function addTrackedUser(username) {
    const users = await getTrackedUsers();
    const existing = users.find((u) => u.username === username);
    if (existing) return existing;
    const newUser = {
      username,
      lastImageId: null,
      knownImageIds: [],
      lastCheck: 0,
      lastVisit: 0,
      newCount: 0,
      trackingEnabled: false
      // off by default — user must opt in
    };
    users.push(newUser);
    await browser.storage.local.set({ trackedUsers: users });
    return newUser;
  }
  async function removeTrackedUser(username) {
    const users = await getTrackedUsers();
    const filtered = users.filter((u) => u.username && u.username !== username);
    await browser.storage.local.set({ trackedUsers: filtered });
  }
  async function updateTrackedUser(username, update) {
    const users = await getTrackedUsers();
    const index = users.findIndex((u) => u.username === username);
    if (index === -1) return null;
    users[index] = { ...users[index], ...update };
    await browser.storage.local.set({ trackedUsers: users });
    return users[index];
  }
  async function toggleUserFavorite(username) {
    const users = await getTrackedUsers();
    const index = users.findIndex((u) => u.username === username);
    if (index === -1) return false;
    users[index] = { ...users[index], favorite: !users[index].favorite };
    await browser.storage.local.set({ trackedUsers: users });
    return users[index].favorite ?? false;
  }
  async function toggleUserTracking(username) {
    const users = await getTrackedUsers();
    const index = users.findIndex((u) => u.username === username);
    if (index === -1) return false;
    const newValue = !(users[index].trackingEnabled ?? true);
    users[index] = { ...users[index], trackingEnabled: newValue };
    await browser.storage.local.set({ trackedUsers: users });
    return newValue;
  }
  async function getTempCollections() {
    const data = await browser.storage.local.get("tempCollections");
    return data.tempCollections || [];
  }
  async function addToTempCollection(collectionId, item) {
    const collections = await getTempCollections();
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return null;
    collection.items.push(item);
    await browser.storage.local.set({ tempCollections: collections });
    return collection;
  }
  let cachedCollections = [];
  let cacheTimestamp = 0;
  const CACHE_TTL_MS = 5 * 60 * 1e3;
  async function fetchAndCacheCollections() {
    log("Fetching collections from API...");
    const collections = await getCollections();
    cachedCollections = collections;
    cacheTimestamp = Date.now();
    log(`Cached ${collections.length} collections`);
    return collections;
  }
  async function getAvailableCollections() {
    const isStale = Date.now() - cacheTimestamp > CACHE_TTL_MS;
    if (cachedCollections.length === 0 || isStale) {
      return fetchAndCacheCollections();
    }
    return cachedCollections;
  }
  async function refreshCollections() {
    return fetchAndCacheCollections();
  }
  async function getDefaultCollections() {
    const settings = await getSettings();
    return settings.defaultCollections.map(Number).filter((n) => !isNaN(n));
  }
  async function setDefaultCollections(ids) {
    await updateSettings({ defaultCollections: ids.map(String) });
    log(`Default collections updated: ${ids.join(", ")}`);
  }
  async function saveToCollections(imageId) {
    if (!getImageCollectionState(imageId)) {
      log(`Image ${imageId}: excluded from collections`);
      return;
    }
    const targetIds = STATE.selectedCollectionIds;
    if (targetIds.length === 0) {
      log(`Image ${imageId}: no target collections configured`);
      return;
    }
    const numericId = parseInt(imageId, 10);
    if (isNaN(numericId)) {
      log(`Image ${imageId}: invalid numeric ID, skipping collection save`);
      return;
    }
    try {
      await addImageToCollections(numericId, targetIds);
      log(`✅ Added image ${imageId} to collections [${targetIds.join(", ")}]`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`❌ Failed to add image ${imageId} to collections: ${msg}`);
      return false;
    }
  }
  function calculateBuzz(input) {
    return Math.floor(input / 10) * 10;
  }
  function calculateClicks(amount) {
    return Math.floor(amount / 10);
  }
  async function sendBuzzToCard(cardElement, amount = 10, onProgress) {
    const roundedAmount = calculateBuzz(amount);
    const clicks = calculateClicks(roundedAmount);
    if (clicks <= 0) return;
    for (let i = 0; i < clicks; i++) {
      await sendSingleBuzzClick(cardElement);
      if (i < clicks - 1) await randomDelay(200, 350);
    }
  }
  async function sendSingleBuzzClick(cardElement) {
    const buzzIconSvg = cardElement.querySelector('button[aria-haspopup="dialog"] svg.tabler-icon-bolt') || cardElement.querySelector('button[aria-haspopup] svg[class*="bolt"]') || cardElement.querySelector('button svg[class*="bolt"]')?.closest("button") || cardElement.querySelector('[class*="TipBuzz"] button') || cardElement.querySelector('button[aria-label*=" buzz" i], button[aria-label*="tip" i]') || cardElement.querySelector('[class*="tip-buzz"] button, [class*="buzz"] button[aria-haspopup]');
    if (!buzzIconSvg) {
      log("⚠️ Buzz icon SVG not found in card");
      return;
    }
    const buttonElement = buzzIconSvg.closest("button") || (buzzIconSvg instanceof HTMLButtonElement ? buzzIconSvg : null);
    if (!buttonElement) {
      log("⚠️ Could not find buzz button element");
      return;
    }
    buttonElement.scrollIntoView({ block: "center" });
    await randomDelay(50, 100);
    // Snapshot popovers already visible so a stale/closing one from the previous
    // tip can never be mistaken for the new one (prevents double-sends).
    const stalePopovers = new Set(getVisiblePopoverCandidates());
    buttonElement.click();
    buttonElement.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await randomDelay(50, 100);
    buttonElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    buttonElement.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    buttonElement.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const popover = await waitForBuzzPopover(stalePopovers);
    if (!popover) {
      log("⚠️ Buzz popover did not appear");
      return;
    }
    const sendButton = popover.querySelector("button svg.tabler-icon-send") || popover.querySelector('button[type="submit"]') || popover.querySelector("button:last-of-type") || Array.from(popover.querySelectorAll("button")).find((btn) => {
      const text = btn.textContent?.toLowerCase() || "";
      return text.includes("send") || text.includes("tip") || text.includes("confirm");
    });
    if (!sendButton) {
      log("⚠️ Send button not found in buzz popover");
      return;
    }
    const sendButtonParent = sendButton.closest("button") || (sendButton instanceof HTMLButtonElement ? sendButton : null);
    if (sendButtonParent) {
      sendButtonParent.click();
      log("✅ Buzz sent (10⚡)");
      await randomDelay(200, 300);
    }
  }
  function isElementVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
  }
  function getBuzzPopoverCandidates() {
    return [
      // Hashed class (may still work, keep as first try)
      document.querySelector('.mantine-Popover-dropdown [class*="InteractiveTipBuzz"]'),
      // Mantine popover containing a lightning bolt icon (buzz popover)
      ...Array.from(document.querySelectorAll(".mantine-Popover-dropdown")).filter(
        (el) => el.querySelector('svg.tabler-icon-bolt, svg.tabler-icon-send, [class*="bolt"], [class*="send"]')
      ),
      // Any visible dialog/popover with a send button
      ...Array.from(document.querySelectorAll('[role="dialog"], [data-popover]')).filter(
        (el) => el.querySelector('button svg, button[type="submit"]')
      )
    ].filter(Boolean);
  }
  function getVisiblePopoverCandidates() {
    return getBuzzPopoverCandidates().filter(isElementVisible);
  }
  function waitForBuzzPopover(exclude = new Set()) {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 60;
      const checkPopover = () => {
        attempts++;
        const popover = getVisiblePopoverCandidates().find((el) => !exclude.has(el));
        if (popover) {
          resolve(popover);
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(checkPopover, 100);
        } else {
          resolve(null);
        }
      };
      checkPopover();
    });
  }
  async function startMassAction() {
    if (STATE.processing) return;
    if (STATE.selected.size === 0) return;
    const selectedIds = Array.from(STATE.selected);
    STATE.processing = true;
    STATE.totalImages = selectedIds.length;
    STATE.currentIndex = 0;
    updateToolbarUI();
    let successCount = 0;
    let failCount = 0;
    // Collection saves are pure API calls — launch them all now. The shared
    // rateLimiter (5 req/s) throttles them; no scrolling/hovering required.
    const collectionJobs = /* @__PURE__ */ new Map();
    if (STATE.selectedCollectionIds.length > 0) {
      for (const imageId of selectedIds) {
        if (getImageCollectionState(imageId)) {
          collectionJobs.set(imageId, saveToCollections(imageId));
        }
      }
    }
    // One DOM scan up front instead of one per image.
    const cardMap = new Map(findImageCards().map((c) => [c.imageId, c]));
    for (const imageId of selectedIds) {
      let ok = true;
      const buzzAmount = (buzzOverrides.get(imageId) ?? 0) + STATE.defaultBuzzAmount;
      const needsDom = STATE.reactionMode !== 0 || calculateClicks(calculateBuzz(buzzAmount)) > 0;
      if (needsDom) {
        try {
          await processImageDom(imageId, cardMap, buzzAmount);
        } catch (error) {
          ok = false;
          log(`❌ Error processing image ${imageId}, skipping:`, error);
        }
      }
      const collectionResult = await (collectionJobs.get(imageId) ?? Promise.resolve(true));
      if (collectionResult === false) ok = false;
      if (ok) successCount++;
      else failCount++;
      STATE.currentIndex++;
      updateToolbarUI();
      log(`${ok ? "✅" : "⚠️"} Finished image ${imageId} (${STATE.currentIndex}/${STATE.totalImages})`);
      if (needsDom) await randomDelay(150, 300);
    }
    clearSelection();
    STATE.processing = false;
    STATE.currentIndex = 0;
    updateToolbarUI();
    const summary = failCount > 0 ? `Processing complete! ${successCount} succeeded, ${failCount} failed.` : `Processing complete! ${STATE.totalImages} images processed.`;
    log(`✅ ${summary}`);
    alert(summary);
  }
  async function startBulkHide() {
    if (STATE.processing) return;
    if (STATE.selected.size === 0) return;
    const selectedIds = Array.from(STATE.selected);
    const confirmed = confirm(
      `Hide ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"} on Civitai?\n\nCivitai has no bulk unhide — each image would have to be unhidden individually.`
    );
    if (!confirmed) return;
    STATE.processing = true;
    STATE.totalImages = selectedIds.length;
    STATE.currentIndex = 0;
    updateToolbarUI();
    const failedIds = [];
    // All requests launched at once; the shared rateLimiter caps them at 5/s.
    await Promise.all(
      selectedIds.map(async (imageId) => {
        const numericId = parseInt(imageId, 10);
        try {
          if (isNaN(numericId)) throw new Error("invalid numeric ID");
          await hideImageOnCivitai(numericId);
          markCardHidden(imageId);
          log(`🙈 Hid image ${imageId}`);
        } catch (error) {
          failedIds.push(imageId);
          log(`❌ Failed to hide image ${imageId}:`, error);
        } finally {
          STATE.currentIndex++;
          updateToolbarUI();
        }
      })
    );
    clearSelection();
    // Leave failures selected so they can be retried with one click.
    for (const imageId of failedIds) {
      const el = document.querySelector(`[data-cvt-card-id="${CSS.escape(imageId)}"]`);
      if (el) toggleSelection(imageId, el);
    }
    STATE.processing = false;
    STATE.currentIndex = 0;
    updateToolbarUI();
    const okCount = selectedIds.length - failedIds.length;
    const summary = failedIds.length > 0 ? `Hidden ${okCount} image(s). ${failedIds.length} failed and are still selected.` : `Hidden ${okCount} image(s).`;
    log(`✅ ${summary}`);
    alert(summary);
  }
  function getCollectionIdFromPage() {
    const match = location.pathname.match(/^\/collections\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
  async function startBulkRemove() {
    if (STATE.processing) return;
    if (STATE.selected.size === 0) return;
    // Target: the collection you're viewing, otherwise the collections checked in the Bulk panel.
    const pageCollectionId = getCollectionIdFromPage();
    const targetIds = pageCollectionId != null ? [pageCollectionId] : [...STATE.selectedCollectionIds];
    if (targetIds.length === 0) {
      alert("No collection selected. Open the collection's page, or check one or more collections in the ⚙ Bulk panel.");
      return;
    }
    let names;
    try {
      const all = await getAvailableCollections();
      names = targetIds.map((id) => all.find((c) => c.id === id)?.name ?? `#${id}`);
    } catch {
      names = targetIds.map((id) => `#${id}`);
    }
    const selectedIds = Array.from(STATE.selected);
    const confirmed = confirm(
      `Remove ${selectedIds.length} image${selectedIds.length === 1 ? "" : "s"} from:\n\n  • ${names.join("\n  • ")}\n\nThis is permanent. Re-adding means saving them again.`
    );
    if (!confirmed) return;
    STATE.processing = true;
    STATE.totalImages = selectedIds.length;
    STATE.currentIndex = 0;
    updateToolbarUI();
    const failedIds = [];
    await Promise.all(
      selectedIds.map(async (imageId) => {
        const numericId = parseInt(imageId, 10);
        try {
          if (isNaN(numericId)) throw new Error("invalid numeric ID");
          // One request per collection per image; all go through the 5/s rateLimiter.
          for (const collectionId of targetIds) {
            await removeImageFromCollection(collectionId, numericId);
          }
          markCardDimmed(imageId, "Removed from collection — will disappear on reload");
          // Image may still be in another collection, but erring toward showing it is harmless.
          COLLECTED.ids?.delete(imageId);
          log(`➖ Removed image ${imageId} from [${targetIds.join(", ")}]`);
        } catch (error) {
          failedIds.push(imageId);
          log(`❌ Failed to remove image ${imageId}:`, error);
        } finally {
          STATE.currentIndex++;
          updateToolbarUI();
        }
      })
    );
    clearSelection();
    for (const imageId of failedIds) {
      const el = document.querySelector(`[data-cvt-card-id="${CSS.escape(imageId)}"]`);
      if (el) toggleSelection(imageId, el);
    }
    STATE.processing = false;
    STATE.currentIndex = 0;
    updateToolbarUI();
    const okCount = selectedIds.length - failedIds.length;
    const summary = failedIds.length > 0 ? `Removed ${okCount} image(s). ${failedIds.length} failed and are still selected.` : `Removed ${okCount} image(s).`;
    log(`✅ ${summary}`);
    alert(summary);
  }
  function markCardDimmed(imageId, title) {
    const el = document.querySelector(`[data-cvt-card-id="${CSS.escape(imageId)}"]`);
    if (!el) return;
    el.style.opacity = "0.2";
    el.style.filter = "grayscale(1)";
    el.title = title;
  }
  // Civitai's own feed won't drop these until its hidden-preferences cache refreshes
  // (page reload), so dim them in place. Removing them would leave holes in the masonry layout.
  function markCardHidden(imageId) {
    const el = document.querySelector(`[data-cvt-card-id="${CSS.escape(imageId)}"]`);
    if (!el) return;
    el.style.opacity = "0.2";
    el.style.filter = "grayscale(1)";
    el.title = "Hidden — will disappear on reload";
  }
  async function processImageDom(imageId, cardMap, buzzAmount) {
    let card = cardMap.get(imageId);
    if (!card || !card.element.isConnected) {
      // Card may have been re-rendered by the page; rescan once.
      card = findImageCards().find((c) => c.imageId === imageId);
      if (card) cardMap.set(imageId, card);
    }
    if (!card) {
      throw new Error(`Card not found for image ${imageId}`);
    }
    card.element.classList.add("civit-processing");
    const numericId = parseInt(imageId, 10);
    try {
      card.element.scrollIntoView({ block: "center" });
      await randomDelay(100, 200);
      card.element.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      card.element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      await randomDelay(100, 150);
      if (STATE.reactionMode !== 0) {
        try {
          const result = await ensureReactions(
            card.element,
            isNaN(numericId) ? void 0 : numericId
          );
          emitProgress(imageId, "reactions", true);
          log(`Reactions: ${result.toggled.length} toggled, ${result.skipped.length} skipped, ${result.failed.length} failed`);
        } catch (error) {
          emitProgress(imageId, "reactions", false, String(error));
          log(`⚠️ Reactions failed for ${imageId}:`, error);
        }
      }
      if (buzzAmount > 0) {
        try {
          await sendBuzzToCard(card.element, buzzAmount);
          emitProgress(imageId, "buzz", true);
        } catch (error) {
          emitProgress(imageId, "buzz", false, String(error));
          log(`⚠️ Buzz failed for ${imageId}:`, error);
        }
      }
    } finally {
      card.element.classList.remove("civit-processing");
    }
  }
  function emitProgress(imageId, phase, success, error) {
  }
  async function addItem(collectionId, item) {
    const fullItem = {
      ...item,
      addedAt: Date.now()
    };
    const result = await addToTempCollection(collectionId, fullItem);
    if (result) {
      log(`➕ Added item to collection: ${item.authorName}`);
    }
  }
  async function getAll() {
    return getTempCollections();
  }
  function showFeedback(el, message) {
    const fb = document.createElement("span");
    fb.className = "cvt-temp-feedback";
    fb.textContent = message;
    el.appendChild(fb);
    setTimeout(() => fb.remove(), 1500);
  }
  function captureCurrentPage() {
    const url = window.location.href;
    const path = window.location.pathname;
    let contentType = "image";
    if (path.includes("/models/")) contentType = "model";
    else if (path.includes("/posts/") || path.includes("/articles/")) contentType = "post";
    let authorName = "Unknown";
    let authorProfileUrl = "";
    const userLink = document.querySelector(
      'a[href*="/user/"]:not([href*="/user/undefined"])'
    );
    if (userLink) {
      const rawHref = userLink.getAttribute("href") || "";
      const nameFromHref = rawHref.split("/user/")[1]?.split("/")[0]?.split("?")[0] || "";
      authorName = nameFromHref.trim() || "Unknown";
      authorProfileUrl = `https://civitai.red/user/${authorName}`;
    }
    let uploadInfo = "";
    const timeEl = document.querySelector("time");
    if (timeEl) {
      uploadInfo = timeEl.textContent?.trim() || "";
    }
    if (!uploadInfo) {
      const allEls = Array.from(document.querySelectorAll("span, abbr, time"));
      const uploadEl = allEls.find((el) => {
        const text = el.innerText?.trim() || el.textContent?.trim() || "";
        return text.length > 0 && text.length < 40 && /\d+\s*(month|week|day|year|hour|minute|ago)/i.test(text);
      });
      if (uploadEl) uploadInfo = uploadEl.innerText?.trim() || uploadEl.textContent?.trim() || "";
    }
    return { contentUrl: url, authorName, authorProfileUrl, contentType, uploadInfo };
  }
  async function showPageAddDropdown(anchor) {
    document.querySelector(".cvt-temp-page-dropdown")?.remove();
    const collections = await getAll();
    if (collections.length === 0) {
      alert("Create a Temp Collection first — open the Temp Collections panel");
      return;
    }
    const dropdown = document.createElement("div");
    dropdown.className = "cvt-quickjump-dropdown cvt-temp-page-dropdown";
    dropdown.style.cssText = "display:block;position:absolute;right:0;left:auto;top:calc(100% + 4px);z-index:2147483647;min-width:180px";
    dropdown.innerHTML = collections.map((c) => `<div class="cvt-quickjump-item" data-id="${c.id}" style="cursor:pointer">📁 ${escapeForDropdown(c.name)} <span style="font-size:10px;opacity:.6">(${c.items.length})</span></div>`).join("");
    anchor.style.position = "relative";
    anchor.appendChild(dropdown);
    dropdown.querySelectorAll(".cvt-quickjump-item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        const collectionId = item.dataset.id;
        const captured = captureCurrentPage();
        if (captured) {
          await addItem(collectionId, captured);
          showFeedback(anchor, "✅ Added!");
        }
        dropdown.remove();
      });
    });
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== anchor) {
        dropdown.remove();
        document.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => document.addEventListener("click", closeHandler, true), 0);
  }
  function escapeForDropdown(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  async function checkUserForNewContent(user) {
    const response = await getImages({
      username: user.username,
      sort: "Newest",
      limit: 10
    });
    const now = Date.now();
    const fetchedIds = response.items.map((img) => img.id);
    if (!fetchedIds.length) {
      const updated2 = await updateTrackedUser(user.username, { lastCheck: now, newCount: 0 });
      return updated2 ?? { ...user, lastCheck: now, newCount: 0 };
    }
    const existingIds = user.knownImageIds ?? [];
    let newCount = 0;
    if (existingIds.length > 0) {
      const existingSet = new Set(existingIds);
      newCount = fetchedIds.filter((id) => !existingSet.has(id)).length;
      if (newCount > 10) newCount = 10;
    }
    const updated = await updateTrackedUser(user.username, {
      lastImageId: fetchedIds[0] ?? null,
      knownImageIds: fetchedIds,
      lastCheck: now,
      newCount
    });
    return updated ?? { ...user, lastImageId: fetchedIds[0] ?? null, knownImageIds: fetchedIds, lastCheck: now, newCount };
  }
  async function checkUserByUsername(username) {
    const users = await getTrackedUsers();
    const user = users.find((u) => u.username === username);
    if (!user) return null;
    return checkUserForNewContent(user);
  }
  async function checkAllUsers() {
    const users = await getTrackedUsers();
    const results = [];
    for (const user of users) {
      if (user.trackingEnabled === false) {
        results.push(user);
        continue;
      }
      try {
        const updated = await checkUserForNewContent(user);
        results.push(updated);
      } catch {
        results.push(user);
      }
    }
    return results;
  }
  async function importFromChat() {
    const chatUsers = await getChatUsers();
    const seen = /* @__PURE__ */ new Map();
    for (const u of chatUsers) {
      const nested = u.chatMembers?.[0]?.user ?? u.otherUser ?? null;
      const username = u.username ?? nested?.username;
      if (!username) continue;
      if (seen.has(username)) continue;
      seen.set(username, {
        username,
        userId: u.id ?? nested?.id,
        avatarUrl: u.image ?? nested?.image
      });
    }
    return Array.from(seen.values());
  }
  async function addUserByUsername(username) {
    const user = await addTrackedUser(username);
    return checkUserForNewContent(user);
  }
  let currentFilter = "favorites";
  let searchQuery = "";
  let addImportExpanded = false;
  const selectedUsernames = /* @__PURE__ */ new Set();
  function openUserManagerModal() {
    document.querySelector("#cvt-um-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "cvt-um-overlay";
    overlay.className = "cvt-modal-overlay cvt-um-overlay";
    overlay.innerHTML = buildModalHTML();
    document.body.appendChild(overlay);
    currentFilter = "favorites";
    searchQuery = "";
    addImportExpanded = false;
    selectedUsernames.clear();
    bindModalEvents(overlay);
    renderUsers(overlay);
  }
  function closeUserManagerModal() {
    document.querySelector("#cvt-um-overlay")?.remove();
  }
  function buildModalHTML() {
    return `
    <div class="cvt-um-modal">
      <!-- Header -->
      <div class="cvt-um-modal-header">
        <span class="cvt-modal-title">👥 User Manager</span>
        <div class="cvt-um-header-actions">
          <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-um-check-all" title="Check all users for new content">🔄 Check All</button>
          <button class="cvt-btn cvt-btn-ghost cvt-btn-icon cvt-btn-sm" id="cvt-um-close" title="Close">✕</button>
        </div>
      </div>

      <!-- Action Bar (visible when ≥1 user selected) -->
      <div class="cvt-um-action-bar" id="cvt-um-action-bar" style="display:none">
        <span id="cvt-um-selected-count">0 selected</span>
        <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-um-copy-mentions" title="Copy @mentions to clipboard">📋 Copy Mentions</button>
        <button class="cvt-btn cvt-btn-danger cvt-btn-sm" id="cvt-um-delete-selected" title="Delete selected users">🗑 Delete Selected</button>
      </div>

      <!-- Collapsible Add / Import Section -->
      <div class="cvt-um-add-section">
        <button class="cvt-btn cvt-btn-ghost cvt-btn-sm cvt-um-add-toggle" id="cvt-um-add-toggle">
          <span id="cvt-um-add-arrow">▶</span> Add / Import
        </button>
        <div class="cvt-um-add-body" id="cvt-um-add-body" style="display:none">
          <div class="cvt-um-add-row">
            <input type="text" class="cvt-input" id="cvt-um-add-input" placeholder="Username to track…" />
            <button class="cvt-btn cvt-btn-primary cvt-btn-sm" id="cvt-um-add-btn">Add</button>
          </div>
          <div class="cvt-um-import-row">
            <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-um-import-chat">💬 Import from Chat</button>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="cvt-um-tabs" id="cvt-um-tabs">
        <button class="cvt-um-tab" data-filter="all">All <span class="cvt-badge cvt-badge-neutral" id="cvt-um-count-all">0</span></button>
        <button class="cvt-um-tab cvt-um-tab-active" data-filter="favorites">⭐ Favorites <span class="cvt-badge cvt-badge-neutral" id="cvt-um-count-favorites">0</span></button>
        <button class="cvt-um-tab" data-filter="recent">🕐 Recent <span class="cvt-badge cvt-badge-neutral" id="cvt-um-count-recent">0</span></button>
        <button class="cvt-um-tab" data-filter="never">🚫 Never Visited <span class="cvt-badge cvt-badge-neutral" id="cvt-um-count-never">0</span></button>
        <button class="cvt-um-tab" data-filter="tracked">🔔 Tracked <span class="cvt-badge cvt-badge-neutral" id="cvt-um-count-tracked">0</span></button>
      </div>

      <!-- Search Bar -->
      <div class="cvt-um-search">
        <input type="text" class="cvt-input" id="cvt-um-search-input" placeholder="Search users…" />
      </div>

      <!-- User List -->
      <div class="cvt-um-grid" id="cvt-um-grid"></div>

    </div>
  `;
  }
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1e3;
  function relativeTime(timestamp) {
    if (timestamp === 0) return "Never";
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }
  function filterUsers(users, filter) {
    const now = Date.now();
    switch (filter) {
      case "favorites":
        return users.filter((u) => u.favorite === true);
      case "recent":
        return users.filter((u) => (u.lastVisit ?? 0) > 0 && now - (u.lastVisit ?? 0) < TWENTY_FOUR_HOURS).sort((a, b) => (b.lastVisit ?? 0) - (a.lastVisit ?? 0));
      case "never":
        return users.filter((u) => !(u.lastVisit ?? 0));
      case "tracked":
        return users.filter((u) => u.trackingEnabled !== false && u.newCount > 0);
      default:
        return users;
    }
  }
  function countForFilter(users, filter) {
    return filterUsers(users, filter).length;
  }
  async function renderUsers(overlay) {
    const allUsers = await getTrackedUsers();
    const grid = overlay.querySelector("#cvt-um-grid");
    if (!grid) return;
    const tabs = ["all", "favorites", "recent", "never", "tracked"];
    for (const tab of tabs) {
      const badge = overlay.querySelector(`#cvt-um-count-${tab}`);
      if (badge) badge.textContent = String(countForFilter(allUsers, tab));
    }
    let users = filterUsers(allUsers, currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter((u) => u.username.toLowerCase().includes(q));
    }
    if (users.length === 0) {
      grid.innerHTML = `<div class="cvt-um-empty">No users match the current filter.</div>`;
      updateActionBar(overlay);
      return;
    }
    grid.innerHTML = users.map((u) => {
      const isTracked = u.trackingEnabled ?? true;
      const trackingIcon = isTracked ? "🔔" : "🔕";
      const trackingTitle = isTracked ? "Pause tracking" : "Resume tracking";
      const isChecked = selectedUsernames.has(u.username);
      const lastVisit = u.lastVisit ?? 0;
      const visitLabel = lastVisit > 0 ? `Visited ${relativeTime(lastVisit)}` : "Never visited";
      return `
      <div class="cvt-um-row" data-username="${u.username}">
        <div class="cvt-um-row-controls">
          <button class="cvt-um-row-btn cvt-um-tracking-toggle" data-tracking="${u.username}" title="${trackingTitle}">${trackingIcon}</button>
          <button class="cvt-um-row-btn cvt-um-star ${u.favorite ? "cvt-um-star-active" : ""}" data-star="${u.username}" title="${u.favorite ? "Unstar" : "Star"}">${u.favorite ? "★" : "☆"}</button>
          <input type="checkbox" class="cvt-um-row-checkbox" data-select="${u.username}" ${isChecked ? "checked" : ""} />
        </div>
        <div class="cvt-um-row-body">
          <a class="cvt-um-row-name" href="https://civitai.red/user/${u.username}/images" target="_blank" data-visit="${u.username}">${u.username}</a>
          <div class="cvt-um-row-sub">
            <span class="cvt-um-row-visit">${visitLabel}</span>
            ${u.trackingEnabled !== false && u.newCount > 0 ? `<span class="cvt-badge cvt-badge-danger cvt-um-new-badge">+${u.newCount >= 10 ? "10+" : u.newCount} new</span>` : ""}
          </div>
        </div>
        <div class="cvt-um-row-actions">
          <button class="cvt-um-row-btn cvt-um-check-user" data-check="${u.username}" title="Check for new content">🔄</button>
          <button class="cvt-um-row-btn cvt-um-remove" data-remove="${u.username}" title="Remove">✕</button>
        </div>
      </div>`;
    }).join("");
    bindRowEvents(overlay, grid);
    updateActionBar(overlay);
  }
  function updateActionBar(overlay) {
    const bar = overlay.querySelector("#cvt-um-action-bar");
    const countEl = overlay.querySelector("#cvt-um-selected-count");
    if (!bar) return;
    if (selectedUsernames.size > 0) {
      bar.style.display = "flex";
      if (countEl) countEl.textContent = `${selectedUsernames.size} selected`;
    } else {
      bar.style.display = "none";
    }
  }
  function bindRowEvents(overlay, grid) {
    grid.querySelectorAll(".cvt-um-tracking-toggle").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const username = btn.dataset.tracking;
        if (username) {
          await toggleUserTracking(username);
          renderUsers(overlay);
        }
      });
    });
    grid.querySelectorAll(".cvt-um-star").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const username = btn.dataset.star;
        if (username) {
          await toggleUserFavorite(username);
          renderUsers(overlay);
        }
      });
    });
    grid.querySelectorAll(".cvt-um-row-checkbox").forEach((cb) => {
      cb.addEventListener("change", () => {
        const username = cb.dataset.select;
        if (!username) return;
        if (cb.checked) selectedUsernames.add(username);
        else selectedUsernames.delete(username);
        updateActionBar(overlay);
      });
    });
    grid.querySelectorAll(".cvt-um-remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const username = btn.dataset.remove;
        if (username) {
          selectedUsernames.delete(username);
          await removeTrackedUser(username);
          renderUsers(overlay);
        }
      });
    });
    grid.querySelectorAll(".cvt-um-check-user").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const username = btn.dataset.check;
        if (!username) return;
        btn.disabled = true;
        btn.textContent = "⏳";
        try {
          await checkUserByUsername(username);
          renderUsers(overlay);
        } finally {
          btn.disabled = false;
          btn.textContent = "🔄";
        }
      });
    });
    grid.querySelectorAll("a[data-visit]").forEach((link) => {
      link.addEventListener("click", async () => {
        const username = link.dataset.visit;
        if (username) {
          await updateTrackedUser(username, { lastVisit: Date.now() });
          setTimeout(() => renderUsers(overlay), 500);
        }
      });
    });
  }
  function bindModalEvents(overlay) {
    overlay.querySelector("#cvt-um-close")?.addEventListener("click", closeUserManagerModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeUserManagerModal();
    });
    const onEsc = (e) => {
      if (e.key === "Escape") {
        closeUserManagerModal();
        document.removeEventListener("keydown", onEsc);
      }
    };
    document.addEventListener("keydown", onEsc);
    overlay.querySelector("#cvt-um-add-toggle")?.addEventListener("click", () => {
      addImportExpanded = !addImportExpanded;
      const body = overlay.querySelector("#cvt-um-add-body");
      const arrow = overlay.querySelector("#cvt-um-add-arrow");
      if (body) body.style.display = addImportExpanded ? "block" : "none";
      if (arrow) arrow.textContent = addImportExpanded ? "▼" : "▶";
    });
    overlay.querySelector("#cvt-um-add-btn")?.addEventListener("click", async () => {
      const input = overlay.querySelector("#cvt-um-add-input");
      const username = input.value.trim();
      if (!username) return;
      input.disabled = true;
      try {
        await addUserByUsername(username);
        input.value = "";
        renderUsers(overlay);
      } catch {
      } finally {
        input.disabled = false;
      }
    });
    overlay.querySelector("#cvt-um-add-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        overlay.querySelector("#cvt-um-add-btn")?.click();
      }
    });
    overlay.querySelector("#cvt-um-check-all")?.addEventListener("click", async () => {
      const btn = overlay.querySelector("#cvt-um-check-all");
      btn.disabled = true;
      btn.textContent = "🔄 Checking…";
      try {
        await checkAllUsers();
        renderUsers(overlay);
      } finally {
        btn.disabled = false;
        btn.textContent = "🔄 Check All";
      }
    });
    overlay.querySelector("#cvt-um-import-chat")?.addEventListener("click", async () => {
      const btn = overlay.querySelector("#cvt-um-import-chat");
      btn.disabled = true;
      btn.textContent = "Loading…";
      try {
        const contacts = await importFromChat();
        showChatImportModal(contacts, overlay);
      } catch {
      } finally {
        btn.disabled = false;
        btn.textContent = "💬 Import from Chat";
      }
    });
    overlay.querySelector("#cvt-um-tabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      overlay.querySelectorAll(".cvt-um-tab").forEach((t) => t.classList.remove("cvt-um-tab-active"));
      btn.classList.add("cvt-um-tab-active");
      renderUsers(overlay);
    });
    overlay.querySelector("#cvt-um-search-input")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderUsers(overlay);
    });
    overlay.querySelector("#cvt-um-copy-mentions")?.addEventListener("click", () => {
      if (selectedUsernames.size === 0) return;
      const mentions = Array.from(selectedUsernames).map((u) => `@${u}`).join(", ");
      navigator.clipboard.writeText(mentions);
    });
    overlay.querySelector("#cvt-um-delete-selected")?.addEventListener("click", async () => {
      if (selectedUsernames.size === 0) return;
      const toDelete = Array.from(selectedUsernames);
      for (const username of toDelete) {
        await removeTrackedUser(username);
      }
      selectedUsernames.clear();
      renderUsers(overlay);
    });
  }
  function showChatImportModal(contacts, parentOverlay) {
    const seen = /* @__PURE__ */ new Set();
    const unique = contacts.filter((c) => {
      if (seen.has(c.username)) return false;
      seen.add(c.username);
      return true;
    });
    contacts = unique;
    document.querySelector("#cvt-um-chat-modal")?.remove();
    const chatOverlay = document.createElement("div");
    chatOverlay.id = "cvt-um-chat-modal";
    chatOverlay.className = "cvt-modal-overlay";
    chatOverlay.style.zIndex = "calc(var(--cvt-z-modal) + 1)";
    const selected = /* @__PURE__ */ new Set();
    chatOverlay.innerHTML = `
    <div class="cvt-modal">
      <div class="cvt-modal-header">
        <span class="cvt-modal-title">Import from Chat</span>
        <button class="cvt-btn cvt-btn-ghost cvt-btn-icon cvt-btn-xs" id="cvt-um-chat-close">✕</button>
      </div>
      <div class="cvt-modal-body" style="max-height:300px;overflow-y:auto">
        ${contacts.length === 0 ? '<div style="color:var(--cvt-text-muted)">No chat contacts found.</div>' : contacts.map(
      (c) => `
          <label style="display:flex;align-items:center;gap:var(--cvt-space-sm);padding:var(--cvt-space-xs) 0;cursor:pointer">
            <input type="checkbox" value="${c.username}" class="cvt-um-chat-cb" />
            <span>${c.username}</span>
          </label>
        `
    ).join("")}
      </div>
      <div class="cvt-modal-footer">
        <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-um-chat-select-all">Select All</button>
        <button class="cvt-btn cvt-btn-primary cvt-btn-sm" id="cvt-um-chat-import-btn">Import Selected</button>
      </div>
    </div>
  `;
    document.body.appendChild(chatOverlay);
    chatOverlay.querySelector("#cvt-um-chat-close")?.addEventListener("click", () => chatOverlay.remove());
    chatOverlay.addEventListener("click", (e) => {
      if (e.target === chatOverlay) chatOverlay.remove();
    });
    chatOverlay.querySelector("#cvt-um-chat-select-all")?.addEventListener("click", () => {
      chatOverlay.querySelectorAll(".cvt-um-chat-cb").forEach((cb) => {
        cb.checked = true;
        selected.add(cb.value);
      });
    });
    chatOverlay.querySelectorAll(".cvt-um-chat-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) selected.add(cb.value);
        else selected.delete(cb.value);
      });
    });
    chatOverlay.querySelector("#cvt-um-chat-import-btn")?.addEventListener("click", async () => {
      const btn = chatOverlay.querySelector("#cvt-um-chat-import-btn");
      btn.disabled = true;
      btn.textContent = "Importing…";
      for (const username of selected) {
        try {
          await addUserByUsername(username);
        } catch {
        }
      }
      chatOverlay.remove();
      renderUsers(parentOverlay);
    });
  }
  const ID = {
    toolbar: "cvt-toolbar",
    bulkToggle: "cvt-bulk-toggle",
    bulkDropdownBtn: "cvt-bulk-dropdown-btn",
    bulkDropdown: "cvt-bulk-dropdown",
    selectVisibleBtn: "cvt-select-visible",
    clearBtn: "cvt-clear-btn",
    reactionSelect: "cvt-reaction-select",
    buzzAmount: "cvt-buzz-amount",
    actionBtn: "cvt-action-btn",
    hideBtn: "cvt-hide-btn",
    removeBtn: "cvt-remove-btn",
    status: "cvt-status",
    quickjumpInput: "cvt-quickjump-input",
    quickjumpDropdown: "cvt-quickjump-dropdown",
    bulkSection: "cvt-bulk-section",
    randomCheckbox: "cvt-random-checkbox"
  };
  let quickjumpUsers = [];
  let quickjumpFiltered = [];
  let quickjumpIndex = -1;
  let quickjumpOpen = false;
  function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.id = ID.toolbar;
    toolbar.className = "cvt-toolbar cvt-animate-slide-down";
    toolbar.style.display = "none";
    toolbar.innerHTML = `
    <!-- Logo -->
    <div class="cvt-toolbar-section">
      <span class="cvt-toolbar-title">⚡ CVT</span>
    </div>

    <div class="cvt-toolbar-divider"></div>

    <!-- Bulk Dropdown Trigger -->
    <div class="cvt-toolbar-section" style="position:relative">
      <label class="cvt-toggle" title="Toggle bulk selection mode">
        <input type="checkbox" class="cvt-toggle-input" id="${ID.bulkToggle}">
        <div class="cvt-toggle-track"><div class="cvt-toggle-thumb"></div></div>
      </label>
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="${ID.bulkDropdownBtn}" title="Bulk settings">⚙ Bulk ▼</button>

      <!-- Bulk Dropdown Panel -->
      <div id="${ID.bulkDropdown}" class="cvt-bulk-dropdown" style="display:none">
        <!-- Select / Clear -->
        <div class="cvt-bulk-dropdown-row">
          <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="${ID.selectVisibleBtn}" disabled>Select Visible</button>
          <button class="cvt-btn cvt-btn-ghost cvt-btn-sm" id="${ID.clearBtn}" disabled>Clear</button>
          <button class="cvt-btn cvt-btn-ghost cvt-btn-sm" id="cvt-exclude-all-btn" title="Exclude all visible images from collections">🚫 Exclude All</button>
        </div>

        ${""}

        <!-- Inline Collection Checkboxes -->
        <div class="cvt-bulk-dropdown-divider"></div>
        <div class="cvt-bulk-dropdown-row" style="justify-content:space-between;align-items:center">
          <span class="cvt-toggle-label">📁 Collections</span>
          <button class="cvt-btn cvt-btn-ghost cvt-btn-icon cvt-btn-xs" id="cvt-inline-collections-refresh" title="Refresh collections">🔄</button>
        </div>
        <div id="cvt-inline-collections-list" style="max-height:150px;overflow-y:auto;padding:2px 4px">
          <div class="cvt-picker-loading" style="font-size:12px;color:#888">Loading collections…</div>
        </div>

        ${""}
      </div>
    </div>

    <!-- Action Button + Status (visible when bulk is on) -->
    <div class="cvt-toolbar-section" id="${ID.bulkSection}" style="display:none">
      <button class="cvt-btn cvt-btn-primary cvt-btn-sm" id="${ID.actionBtn}" disabled>Process Selected</button>
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="${ID.hideBtn}" title="Hide selected images on Civitai" disabled>🙈 Hide Selected</button>
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="${ID.removeBtn}" title="Remove selected images from the collection you're viewing, or from the collections checked in the Bulk panel" disabled>➖ Remove from Collection</button>
      <span class="cvt-toolbar-status" id="${ID.status}">0 selected</span>
    </div>

    <!-- Spacer -->
    <div class="cvt-toolbar-section-end"></div>

    <!-- Right-side buttons (always visible) -->
    <div class="cvt-toolbar-section">
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-hide-collected-btn" title="Temporarily hide images that are already in any of your collections (this page session only)">🙈 Hide Collected</button>
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-add-page-btn" title="Add current page to a temp collection">➕ Add Page</button>
      <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-user-manager-btn" title="Manage tracked users">👥 Users</button>
    </div>

    <!-- Quickjump -->
    <div class="cvt-toolbar-section" style="position:relative">
      <input type="text" class="cvt-input" id="${ID.quickjumpInput}"
        placeholder="Jump to user…" style="width:160px"
        autocomplete="off" />
      <div id="${ID.quickjumpDropdown}" class="cvt-quickjump-dropdown" style="display:none"></div>
    </div>
  `;
    document.body.prepend(toolbar);
    document.body.classList.add("cvt-toolbar-active");
    bindToolbarEvents();
    loadQuickjumpUsers();
    setTimeout(() => {
      const tb = document.getElementById(ID.toolbar);
      if (tb) {
        const h = tb.getBoundingClientRect().height || 48;
        pushSiteHeaderDown(h);
      }
    }, 200);
    getSettings().then((settings) => {
      STATE.reactionMode = settings.defaultReactionMode;
      const reactionSelect = document.getElementById(ID.reactionSelect);
      if (reactionSelect) reactionSelect.value = String(settings.defaultReactionMode);
      STATE.defaultBuzzAmount = settings.defaultBuzzAmount;
      const buzzInput = document.getElementById(ID.buzzAmount);
      if (buzzInput) buzzInput.value = String(settings.defaultBuzzAmount);
    });
    getDefaultCollections().then((savedIds) => {
      if (savedIds.length > 0) {
        STATE.selectedCollectionIds = savedIds;
        STATE.selectedCollectionId = savedIds[0];
        STATE.useCollections = true;
        refreshAllCollectionDots();
      }
    });
    return toolbar;
  }
  function bindToolbarEvents(pro) {
    const $ = (id) => document.getElementById(id);
    $(ID.bulkToggle)?.addEventListener("change", () => {
      toggleBulkMode();
      updateToolbarUI();
    });
    $(ID.selectVisibleBtn)?.addEventListener("click", selectVisible);
    $(ID.clearBtn)?.addEventListener("click", clearSelection);
    $("cvt-exclude-all-btn")?.addEventListener("click", () => {
      const cards = findImageCards();
      const btn = document.getElementById("cvt-exclude-all-btn");
      const allExcluded = cards.length > 0 && cards.every(
        (card) => collectionOverrides.get(card.imageId) === false
      );
      const newState = allExcluded;
      for (const card of cards) {
        collectionOverrides.set(card.imageId, newState);
      }
      refreshAllCollectionDots();
      if (btn) {
        if (newState) {
          btn.textContent = "🚫 Exclude All";
          btn.title = "Exclude all visible images from collections";
        } else {
          btn.textContent = "📁 Include All";
          btn.title = "Include all visible images in collections";
        }
      }
    });
    $("cvt-inline-collections-refresh")?.addEventListener("click", () => {
      loadInlineCollections(true);
    });
    $("cvt-user-manager-btn")?.addEventListener("click", () => {
      openUserManagerModal();
    });
    $("cvt-hide-collected-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleHideCollected();
    });
    $("cvt-add-page-btn")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = document.getElementById("cvt-add-page-btn");
      if (btn) await showPageAddDropdown(btn);
    });
    $(ID.bulkDropdownBtn)?.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = $(ID.bulkDropdown);
      if (dropdown) {
        const wasHidden = dropdown.style.display === "none";
        dropdown.style.display = wasHidden ? "block" : "none";
        if (wasHidden) loadInlineCollections(false);
      }
    });
    document.addEventListener("click", (e) => {
      const dropdown = $(ID.bulkDropdown);
      const btn = $(ID.bulkDropdownBtn);
      if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
    $(ID.actionBtn)?.addEventListener("click", startMassAction);
    $(ID.hideBtn)?.addEventListener("click", startBulkHide);
    $(ID.removeBtn)?.addEventListener("click", startBulkRemove);
    const qjInput = $(ID.quickjumpInput);
    if (qjInput) {
      qjInput.addEventListener("input", onQuickjumpInput);
      qjInput.addEventListener("keydown", onQuickjumpKeydown);
      qjInput.addEventListener("focus", async () => {
        await loadQuickjumpUsers();
        if (quickjumpUsers.length > 0) openQuickjump();
      });
    }
    document.addEventListener("click", (e) => {
      const dropdown = $(ID.quickjumpDropdown);
      const input = $(ID.quickjumpInput);
      if (dropdown && input && !dropdown.contains(e.target) && !input.contains(e.target)) {
        closeQuickjump();
      }
    });
  }
  function updateToolbarUI() {
    const $ = (id) => document.getElementById(id);
    const bulkToggle = $(ID.bulkToggle);
    if (bulkToggle) bulkToggle.checked = STATE.bulkModeEnabled;
    const bulkSection = $(ID.bulkSection);
    if (bulkSection) bulkSection.style.display = STATE.bulkModeEnabled ? "flex" : "none";
    const bulkDropdownBtn = $(ID.bulkDropdownBtn);
    if (bulkDropdownBtn) {
      bulkDropdownBtn.textContent = STATE.bulkModeEnabled ? "⚙ Bulk ▲" : "⚙ Bulk ▼";
    }
    const selectVisibleBtn = $(ID.selectVisibleBtn);
    const clearBtn = $(ID.clearBtn);
    const actionBtn = $(ID.actionBtn);
    const hasSelection = STATE.selected.size > 0;
    if (selectVisibleBtn) {
      selectVisibleBtn.disabled = !STATE.bulkModeEnabled || STATE.processing;
      const visibleCount = findImageCards().length;
      selectVisibleBtn.textContent = `👁 Visible (${visibleCount})`;
    }
    if (clearBtn) clearBtn.disabled = !hasSelection || STATE.processing;
    if (actionBtn) {
      actionBtn.disabled = !hasSelection && true || STATE.processing;
      actionBtn.textContent = "Process Selected";
    }
    const hideBtn = $(ID.hideBtn);
    if (hideBtn) hideBtn.disabled = !hasSelection || STATE.processing;
    const removeBtn = $(ID.removeBtn);
    if (removeBtn) removeBtn.disabled = !hasSelection || STATE.processing;
    const randomCb = $(ID.randomCheckbox);
    if (randomCb) randomCb.checked = STATE.randomModeEnabled;
    const status = $(ID.status);
    if (status) {
      if (STATE.processing) {
        status.innerHTML = `<span class="cvt-spinner cvt-spinner-sm"></span> ${STATE.currentIndex}/${STATE.totalImages}`;
      } else {
        const count = STATE.selected.size;
        if (count > 0 && STATE.defaultBuzzAmount > 0) {
          status.textContent = `${count} selected · ${count * STATE.defaultBuzzAmount} ⚡`;
        } else {
          status.textContent = `${count} selected`;
        }
      }
    }
  }
  function pushSiteHeaderDown(toolbarHeight) {
    const siteHeader = document.querySelector(
      '[class*="mantine-Header"], header[class*="header"], .header-root, header'
    );
    if (siteHeader) {
      const pos = getComputedStyle(siteHeader).position;
      if (pos === "fixed" || pos === "sticky") {
        siteHeader.style.top = `${toolbarHeight}px`;
      }
    }
  }
  function showToolbar() {
    const toolbar = document.getElementById(ID.toolbar);
    if (toolbar) {
      toolbar.style.display = "flex";
      document.body.classList.add("cvt-toolbar-active");
      const h = toolbar.getBoundingClientRect().height || 48;
      pushSiteHeaderDown(h);
    }
  }
  function hideToolbar() {
    const toolbar = document.getElementById(ID.toolbar);
    if (toolbar) {
      toolbar.style.display = "none";
      document.body.classList.remove("cvt-toolbar-active");
      const siteHeader = document.querySelector('[class*="mantine-Header"], header[class*="header"], .header-root, header');
      if (siteHeader) siteHeader.style.top = "";
    }
  }
  function toggleToolbarVisibility(visible) {
    if (visible) showToolbar();
    else hideToolbar();
  }
  async function loadInlineCollections(forceRefresh) {
    const listEl = document.getElementById("cvt-inline-collections-list");
    if (!listEl) return;
    listEl.innerHTML = '<div class="cvt-picker-loading" style="font-size:12px;color:#888">Loading collections…</div>';
    try {
      const allCollections = forceRefresh ? await refreshCollections() : await getAvailableCollections();
      const collections = allCollections.filter((c) => c.type === "Image" || c.type === "Video");
      renderInlineCollections(listEl, collections);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      listEl.innerHTML = `<div style="font-size:12px;color:#f66;padding:4px">Failed to load: ${msg}</div>`;
    }
  }
  function renderInlineCollections(listEl, collections) {
    if (collections.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:#888;padding:4px">No collections found.</div>';
      return;
    }
    listEl.innerHTML = collections.map((c) => {
      const checked = STATE.selectedCollectionIds.includes(c.id) ? " checked" : "";
      const mode = (c.mode || "").toLowerCase();
      let badge = "";
      if (mode === "public") badge = '<span class="cvt-badge cvt-badge-success" style="font-size:10px">🟢</span>';
      else if (mode === "private") badge = '<span class="cvt-badge cvt-badge-warning" style="font-size:10px">🔒</span>';
      const escaped = escapeHtmlInline(c.name);
      return `<label style="display:flex;align-items:center;gap:6px;padding:2px 0;cursor:pointer;font-size:12px" data-collection-id="${c.id}">
      <input type="checkbox" class="cvt-inline-collection-cb" value="${c.id}"${checked} style="accent-color:var(--cvt-primary);width:14px;height:14px" />
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escaped}</span>
      ${badge}
    </label>`;
    }).join("");
    listEl.querySelectorAll(".cvt-inline-collection-cb").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        e.stopPropagation();
        const input = e.target;
        const id = parseInt(input.value, 10);
        if (input.checked) {
          if (!STATE.selectedCollectionIds.includes(id)) {
            STATE.selectedCollectionIds.push(id);
          }
        } else {
          STATE.selectedCollectionIds = STATE.selectedCollectionIds.filter((x) => x !== id);
        }
        STATE.selectedCollectionId = STATE.selectedCollectionIds.length > 0 ? STATE.selectedCollectionIds[0] : null;
        STATE.useCollections = STATE.selectedCollectionIds.length > 0;
        refreshAllCollectionDots();
        setDefaultCollections(STATE.selectedCollectionIds);
      });
    });
  }
  function escapeHtmlInline(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  async function loadQuickjumpUsers() {
    try {
      quickjumpUsers = await getTrackedUsers();
      quickjumpFiltered = [...quickjumpUsers];
    } catch {
      quickjumpUsers = [];
      quickjumpFiltered = [];
    }
  }
  function openQuickjump() {
    quickjumpOpen = true;
    quickjumpIndex = -1;
    renderQuickjumpDropdown();
    const dropdown = document.getElementById(ID.quickjumpDropdown);
    if (dropdown) dropdown.style.display = "block";
  }
  function closeQuickjump() {
    quickjumpOpen = false;
    quickjumpIndex = -1;
    const dropdown = document.getElementById(ID.quickjumpDropdown);
    if (dropdown) dropdown.style.display = "none";
  }
  function onQuickjumpInput() {
    const input = document.getElementById(ID.quickjumpInput);
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    quickjumpFiltered = query ? quickjumpUsers.filter((u) => u.username.toLowerCase().includes(query)) : [...quickjumpUsers];
    quickjumpIndex = -1;
    if (!quickjumpOpen) openQuickjump();
    else renderQuickjumpDropdown();
  }
  function onQuickjumpKeydown(e) {
    if (!quickjumpOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        openQuickjump();
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        quickjumpIndex = Math.min(quickjumpIndex + 1, quickjumpFiltered.length - 1);
        renderQuickjumpDropdown();
        break;
      case "ArrowUp":
        e.preventDefault();
        quickjumpIndex = Math.max(quickjumpIndex - 1, -1);
        renderQuickjumpDropdown();
        break;
      case "Enter":
        e.preventDefault();
        if (quickjumpIndex >= 0 && quickjumpIndex < quickjumpFiltered.length) {
          jumpToUser(quickjumpFiltered[quickjumpIndex].username);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeQuickjump();
        break;
    }
  }
  function renderQuickjumpDropdown() {
    const dropdown = document.getElementById(ID.quickjumpDropdown);
    if (!dropdown) return;
    if (quickjumpFiltered.length === 0) {
      dropdown.innerHTML = '<div class="cvt-quickjump-empty">No users found</div>';
      return;
    }
    dropdown.innerHTML = quickjumpFiltered.map((user, i) => {
      const active = i === quickjumpIndex ? "cvt-quickjump-item-active" : "";
      const badge = user.newCount > 0 ? `<span class="cvt-badge cvt-badge-primary">${user.newCount}</span>` : "";
      return `<div class="cvt-quickjump-item ${active}" data-username="${user.username}">
      <span class="cvt-quickjump-name">${user.username}</span>
      ${badge}
      <button class="cvt-quickjump-copy" data-copy="${user.username}" title="Copy username">📋</button>
    </div>`;
    }).join("");
    dropdown.querySelectorAll(".cvt-quickjump-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const target = e.target;
        if (target.classList.contains("cvt-quickjump-copy") || target.closest(".cvt-quickjump-copy")) {
          e.stopPropagation();
          const username2 = target.dataset.copy || target.closest(".cvt-quickjump-copy")?.dataset.copy;
          if (username2) copyUsername(username2, target.closest(".cvt-quickjump-item"));
          return;
        }
        const username = item.dataset.username;
        if (username) jumpToUser(username);
      });
    });
  }
  function jumpToUser(username) {
    window.location.href = `https://civitai.red/user/${username}/images`;
    closeQuickjump();
  }
  function copyUsername(username, itemEl) {
    navigator.clipboard.writeText(username).then(() => {
      if (itemEl) {
        const nameEl = itemEl.querySelector(".cvt-quickjump-name");
        if (nameEl) {
          const original = nameEl.textContent;
          nameEl.textContent = "Copied!";
          setTimeout(() => {
            nameEl.textContent = original;
          }, 1200);
        }
      }
    });
  }
  function extractUsernameFromText(text) {
    const atMatch = text.match(/@([A-Za-z0-9_-]+)/);
    if (atMatch) return atMatch[1];
    return null;
  }
  function extractUsernameFromHref(element) {
    const href = element.getAttribute("href") || "";
    const match = href.match(/^\/user\/([^/?#]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  function extractUsernameFromAvatarAlt(element) {
    const imgs = Array.from(element.querySelectorAll("img"));
    const avatarImg = imgs.find((img) => img.alt && (img.alt.endsWith("'s Avatar") || img.alt.endsWith("’s Avatar") || img.alt.endsWith("s Avatar")));
    if (!avatarImg) return null;
    const match = avatarImg.alt.match(/^(.+?)['\u2018\u2019]s Avatar$/);
    return match ? match[1] : null;
  }
  function extractUsernameFromLink(element) {
    const userLink = element.querySelector('a[href*="/user/"]');
    if (!userLink) return null;
    const match = userLink.href.match(/\/user\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  function detectNotificationType(text) {
    const lower = text.toLowerCase();
    if (lower.includes("tip") || lower.includes("buzz")) return "tip";
    if (lower.includes("comment")) return "comment";
    if (lower.includes("react")) return "reaction";
    if (lower.includes("follow")) return "follow";
    return "unknown";
  }
  function parseNotification(element) {
    const text = element.textContent || "";
    const parent = element.parentElement || element;
    const username = extractUsernameFromHref(element) || // href="/user/USERNAME"
    extractUsernameFromAvatarAlt(element) || // alt="USERNAME's Avatar" (in element)
    extractUsernameFromAvatarAlt(parent) || // alt="USERNAME's Avatar" (in parent)
    extractUsernameFromLink(element) || // child <a href="/user/...">
    extractUsernameFromLink(parent) || // user link in parent container
    extractUsernameFromText(text) || // @username in element text
    extractUsernameFromText(parent.textContent || "");
    if (!username) return null;
    const parentText = parent.textContent || "";
    let type = detectNotificationType(text);
    if (type === "unknown" && parentText) {
      type = detectNotificationType(parentText);
    }
    return { username, type };
  }
  const PROCESSED_ATTR = "data-cvt-notif-processed";
  function injectNotificationLinks(el) {
    if (el.hasAttribute(PROCESSED_ATTR)) return;
    const info = parseNotification(el);
    if (!info) {
      el.setAttribute(PROCESSED_ATTR, "skip");
      return;
    }
    const avatarImg = el.querySelector("img");
    if (!avatarImg) {
      el.setAttribute(PROCESSED_ATTR, "skip");
      return;
    }
    el.setAttribute(PROCESSED_ATTR, "1");
    avatarImg.style.cursor = "pointer";
    avatarImg.title = `View @${info.username}'s profile`;
    avatarImg.setAttribute("data-cvt-avatar-btn", "1");
    avatarImg.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(
        `https://civitai.red/user/${encodeURIComponent(info.username)}`,
        "_blank"
      );
    });
    log(`Injected avatar profile link for @${info.username} (${info.type})`);
  }
  function scanAndInjectNotificationLinks() {
    const anchors = document.querySelectorAll('a[class*="NotificationList_listItem"]');
    const containers = document.querySelectorAll('[class*="NotificationList_listItem"]:not(a)');
    for (const el of anchors) {
      injectNotificationLinks(el);
    }
    for (const el of containers) {
      injectNotificationLinks(el);
    }
  }
  function initNotificationOverlay() {
    scanAndInjectNotificationLinks();
    log("Notification helper initialized (one-time scan)");
  }
  function init() {
    log("Initializing Civitai Tools extension...");
    if (!window.location.hostname.includes("civitai.red")) {
      log("Not on Civitai, skipping initialization");
      return;
    }
    createToolbar();
    browser.storage.sync.get(["toolbarVisible"]).then((result) => {
      const visible = result.toolbarVisible !== false;
      toggleToolbarVisibility(visible);
    });
    browser.storage.sync.get("settings").then((r) => {
      const s = r.settings;
      setDebugLogging(s?.debugLogging === true);
    });
    browser.storage.sync.get("settings").then((r) => {
      const s = r.settings;
      if (s?.theme && s.theme !== "auto") {
        document.documentElement.setAttribute("data-theme", s.theme);
        const toolbar = document.getElementById("cvt-toolbar");
        if (toolbar) toolbar.setAttribute("data-theme", s.theme);
      } else {
        document.documentElement.removeAttribute("data-theme");
        const toolbar = document.getElementById("cvt-toolbar");
        if (toolbar) {
          const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          toolbar.setAttribute("data-theme", isDark ? "dark" : "light");
        }
      }
    });
    const profileMatch = window.location.pathname.match(/^\/user\/([^/]+)/);
    if (profileMatch) {
      const username = decodeURIComponent(profileMatch[1]);
      getTrackedUsers().then(async (users) => {
        const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
          await updateTrackedUser(user.username, { lastVisit: Date.now() });
          if (!user.knownImageIds?.length) {
            await checkUserForNewContent(user);
          }
        }
      }).catch(() => {
      });
    }
    initNotificationOverlay();
    browser.runtime.onMessage.addListener((message) => {
      const msg = message;
      if (msg.action === "setTheme") {
        const toolbar = document.getElementById("cvt-toolbar");
        if (msg.theme && msg.theme !== "auto") {
          document.documentElement.setAttribute("data-theme", msg.theme);
          if (toolbar) toolbar.setAttribute("data-theme", msg.theme);
        } else {
          document.documentElement.removeAttribute("data-theme");
          if (toolbar) {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            toolbar.setAttribute("data-theme", isDark ? "dark" : "light");
          }
        }
        return Promise.resolve({ success: true });
      } else if (msg.action === "toggleToolbar") {
        toggleToolbarVisibility(msg.visible ?? false);
        return Promise.resolve({ success: true });
      } else if (msg.action === "getToolbarState") {
        const toolbar = document.getElementById("cvt-toolbar");
        const isVisible = toolbar !== null && toolbar.style.display !== "none";
        return Promise.resolve({ visible: isVisible });
      } else if (msg.action === "importChatUsers") {
        return importFromChat().then((users) => ({ success: true, users })).catch((err) => ({ success: false, error: String(err) }));
      } else if (msg.action === "setDebugLogging") {
        setDebugLogging(msg.enabled === true);
        return Promise.resolve({ success: true });
      } else if (msg.action === "checkUserUpdates") {
        return checkAllUsers().then((users) => ({ success: true, users })).catch((err) => ({ success: false, error: String(err) }));
      }
      return void 0;
    });
    log("Extension initialized successfully!");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
