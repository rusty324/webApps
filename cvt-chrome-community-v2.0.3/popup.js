"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/webextension-polyfill/dist/browser-polyfill.js
  var require_browser_polyfill = __commonJS({
    "node_modules/webextension-polyfill/dist/browser-polyfill.js"(exports, module) {
      (function(global, factory) {
        if (typeof define === "function" && define.amd) {
          define("webextension-polyfill", ["module"], factory);
        } else if (typeof exports !== "undefined") {
          factory(module);
        } else {
          var mod = {
            exports: {}
          };
          factory(mod);
          global.browser = mod.exports;
        }
      })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports, function(module2) {
        "use strict";
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
    }
  });

  // src/popup/index.ts
  var import_webextension_polyfill2 = __toESM(require_browser_polyfill(), 1);

  // src/common/storage.ts
  var import_webextension_polyfill = __toESM(require_browser_polyfill(), 1);
  var CURRENT_SCHEMA_VERSION = 1;
  var DEFAULT_SETTINGS = {
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
    const data = await import_webextension_polyfill.default.storage.sync.get("settings");
    return { ...DEFAULT_SETTINGS, ...data.settings };
  }
  async function updateSettings(partial) {
    const current = await getSettings();
    const updated = { ...current, ...partial };
    await import_webextension_polyfill.default.storage.sync.set({ settings: updated });
    return updated;
  }
  async function resetSettings() {
    await import_webextension_polyfill.default.storage.sync.set({ settings: DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS };
  }
  async function getTrackedUsers() {
    const data = await import_webextension_polyfill.default.storage.local.get("trackedUsers");
    return (data.trackedUsers || []).filter((u) => Boolean(u.username));
  }
  async function getTempCollections() {
    const data = await import_webextension_polyfill.default.storage.local.get("tempCollections");
    return data.tempCollections || [];
  }
  async function createTempCollection(name) {
    const collections = await getTempCollections();
    const collection = {
      id: crypto.randomUUID(),
      name,
      items: [],
      createdAt: Date.now()
    };
    collections.push(collection);
    await import_webextension_polyfill.default.storage.local.set({ tempCollections: collections });
    return collection;
  }
  async function deleteTempCollection(id) {
    const collections = await getTempCollections();
    const filtered = collections.filter((c) => c.id !== id);
    await import_webextension_polyfill.default.storage.local.set({ tempCollections: filtered });
  }
  async function exportData() {
    const [settings, trackedUsers, tempCollections] = await Promise.all([
      getSettings(),
      getTrackedUsers(),
      getTempCollections()
    ]);
    const exportPayload = {
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: Date.now(),
      settings,
      trackedUsers,
      tempCollections
    };
    return JSON.stringify(exportPayload, null, 2);
  }
  async function importData(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.settings) {
      throw new Error("Invalid export data format");
    }
    await Promise.all([
      import_webextension_polyfill.default.storage.sync.set({ settings: data.settings }),
      import_webextension_polyfill.default.storage.local.set({
        trackedUsers: data.trackedUsers || [],
        tempCollections: data.tempCollections || [],
        schemaVersion: CURRENT_SCHEMA_VERSION
      })
    ]);
  }

  // src/popup/index.ts
  var currentSettings;
  var currentTab = "dashboard";
  function applyTheme(theme) {
    const html = document.documentElement;
    html.classList.add("cvt-theme-transitioning");
    if (theme === "auto") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", theme);
    }
    setTimeout(() => html.classList.remove("cvt-theme-transitioning"), 350);
  }
  function showToast(message, type = "success") {
    const existing = document.querySelector(".cvt-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `cvt-toast cvt-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2e3);
  }
  function initTabs() {
    const tabBar = document.getElementById("tab-bar");
    tabBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".cvt-tab");
      if (!btn) return;
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  }
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".cvt-tab").forEach((el) => {
      el.classList.toggle("cvt-tab-active", el.dataset.tab === tab);
    });
    document.querySelectorAll(".cvt-tab-panel").forEach((el) => {
      el.classList.toggle("cvt-tab-panel-active", el.id === `panel-${tab}`);
    });
    import_webextension_polyfill2.default.storage.local.set({ lastPopupTab: tab });
    renderTabContent(tab);
  }
  async function renderTabContent(tab) {
    switch (tab) {
      case "dashboard":
        await renderDashboard();
        break;
      case "collections":
        await renderCollections();
        break;
      case "settings":
        renderSettingsTab();
        break;
      case "about":
        renderAbout();
        break;
    }
  }
  async function renderDashboard() {
    const panel = document.getElementById("panel-dashboard");
    const [settings, users, collections] = await Promise.all([
      getSettings(),
      getTrackedUsers(),
      getTempCollections()
    ]);
    currentSettings = settings;
    const features = [];
    if (settings.toolbarVisible) features.push("Toolbar");
    if (settings.apiKey) features.push("API Key Set");
    if (settings.defaultCollections.length > 0) features.push(`${settings.defaultCollections.length} Default Collections`);
    const backupBanner = users.length > 0 ? `
    <div class="cvt-popup-section cvt-backup-banner" id="cvt-backup-banner">
      <div style="display:flex; align-items:center; gap:var(--cvt-space-sm); flex-wrap:wrap;">
        <span style="font-size:1.1em;">\u{1F4BE}</span>
        <span style="flex:1; font-size:var(--cvt-text-sm); color:var(--cvt-text-secondary);">
          Back up your data before updating \u2014 <strong style="color:var(--cvt-text);">your tracked users won't survive a reinstall.</strong>
        </span>
        <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="cvt-banner-export-btn">\u{1F4E4} Export</button>
        <button class="cvt-btn cvt-btn-ghost cvt-btn-sm" id="cvt-banner-dismiss-btn" title="Dismiss" style="padding:2px 6px;">\xD7</button>
      </div>
    </div>
  ` : "";
    panel.innerHTML = `
    ${backupBanner}
    <div class="cvt-popup-section">
      <div class="cvt-stats">
        <div class="cvt-stat">
          <div class="cvt-stat-value">${users.length}</div>
          <div class="cvt-stat-label">Tracked Users</div>
        </div>
        <div class="cvt-stat">
          <div class="cvt-stat-value">${collections.length}</div>
          <div class="cvt-stat-label">Temp Collections</div>
        </div>
      </div>
    </div>
    <div class="cvt-popup-section">
      <div class="cvt-popup-section-title">Toolbar</div>
      <div class="cvt-field-row">
        <span style="font-size: var(--cvt-text-sm); color: var(--cvt-text-secondary);">Show on page</span>
        <label class="cvt-toggle">
          <input type="checkbox" class="cvt-toggle-input" id="toolbar-toggle" ${settings.toolbarVisible ? "checked" : ""}>
          <div class="cvt-toggle-track"><div class="cvt-toggle-thumb"></div></div>
        </label>
      </div>
    </div>
    <div class="cvt-popup-section">
      <div class="cvt-popup-section-title">Active Features</div>
      <div style="display: flex; flex-wrap: wrap; gap: var(--cvt-space-xs);">
        ${features.length > 0 ? features.map((f) => `<span class="cvt-badge cvt-badge-success">${f}</span>`).join("") : '<span class="cvt-badge cvt-badge-neutral">None active</span>'}
        <span class="cvt-badge cvt-badge-primary">Theme: ${settings.theme}</span>
        <span class="cvt-badge cvt-badge-primary">Reaction: ${settings.defaultReactionMode}x</span>
      </div>
    </div>
    <div class="cvt-popup-section">
      <div class="cvt-popup-section-title">Quick Links</div>
      <div class="cvt-quick-links">
        <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" data-goto="collections">\u{1F4CB} Collections</button>
        <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" data-goto="settings">\u2699\uFE0F Settings</button>
      </div>
    </div>
  `;
    const toggle = document.getElementById("toolbar-toggle");
    toggle.addEventListener("change", async () => {
      await updateSettings({ toolbarVisible: toggle.checked });
      try {
        const tabs = await import_webextension_polyfill2.default.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await import_webextension_polyfill2.default.tabs.sendMessage(tabs[0].id, {
            action: "toggleToolbar",
            visible: toggle.checked
          });
        }
      } catch {
      }
      showToast(toggle.checked ? "Toolbar shown" : "Toolbar hidden");
    });
    panel.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.goto));
    });
    const bannerExportBtn = document.getElementById("cvt-banner-export-btn");
    const bannerDismissBtn = document.getElementById("cvt-banner-dismiss-btn");
    const banner = document.getElementById("cvt-backup-banner");
    bannerExportBtn?.addEventListener("click", async () => {
      const json = await exportData();
      downloadJson(json, "civitai-extension-backup.json");
      showToast("All data exported \u2705");
    });
    bannerDismissBtn?.addEventListener("click", () => {
      if (banner) banner.style.display = "none";
    });
  }
  async function renderCollections() {
    const panel = document.getElementById("panel-collections");
    const collections = await getTempCollections();
    panel.innerHTML = `
    <div class="cvt-popup-section">
      <div class="cvt-popup-section-title">Temp Collections (${collections.length})</div>
      <div style="display: flex; gap: var(--cvt-space-xs); margin-bottom: var(--cvt-space-md);">
        <input type="text" class="cvt-input" id="new-collection-input" placeholder="Collection name..." style="flex:1;">
        <button class="cvt-btn cvt-btn-primary cvt-btn-sm" id="create-collection-btn">Create</button>
      </div>
      <div id="collections-list">
        ${collections.length === 0 ? '<div class="cvt-empty-state">No temp collections yet.<br>Create one above or add items from image overlays.</div>' : collections.map((c) => renderCollectionItem(c)).join("")}
      </div>

    </div>
  `;
    const input = document.getElementById("new-collection-input");
    const createBtn = document.getElementById("create-collection-btn");
    const doCreate = async () => {
      const name = input.value.trim();
      if (!name) return;
      await createTempCollection(name);
      input.value = "";
      showToast(`Created "${name}"`);
      await renderCollections();
    };
    createBtn.addEventListener("click", doCreate);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doCreate();
    });
    panel.querySelectorAll("[data-toggle-collection]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggleCollection;
        const items = document.getElementById(`collection-items-${id}`);
        if (items) items.classList.toggle("cvt-expanded");
      });
    });
    panel.querySelectorAll("[data-copy-collection]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.copyCollection;
        const collection = collections.find((c) => c.id === id);
        if (!collection) return;
        const text = collection.items.map((item) => {
          const parts = [
            (item.contentUrl || "").trim()
          ];
          const upload = (item.uploadInfo || "").trim();
          if (upload) parts.push(upload);
          const name = (item.authorName || "").trim();
          if (name) parts.push(name);
          const profile = (item.authorProfileUrl || "").trim();
          if (profile) parts.push(profile);
          return parts.join(" | ");
        }).join("\n");
        await navigator.clipboard.writeText(text || "Empty collection");
        showToast("Copied to clipboard");
      });
    });
    panel.querySelectorAll("[data-delete-collection]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteCollection;
        await deleteTempCollection(id);
        showToast("Collection deleted");
        await renderCollections();
      });
    });
  }
  function renderCollectionItem(collection) {
    const itemCount = collection.items.length;
    return `
    <div class="cvt-list-item" style="flex-direction: column; align-items: stretch;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div class="cvt-list-item-info" style="cursor:pointer;" data-toggle-collection="${collection.id}">
          <span class="cvt-truncate" style="flex:1; font-weight: var(--cvt-weight-medium);">${collection.name}</span>
          <span class="cvt-badge cvt-badge-neutral">${itemCount} item${itemCount !== 1 ? "s" : ""}</span>
        </div>
        <div class="cvt-list-item-actions">
          <button class="cvt-btn cvt-btn-ghost cvt-btn-xs" data-copy-collection="${collection.id}" title="Copy as text">\u{1F4CB}</button>
          <button class="cvt-btn cvt-btn-danger cvt-btn-xs" data-delete-collection="${collection.id}" title="Delete">\u2715</button>
        </div>
      </div>
      <div class="cvt-collection-items" id="collection-items-${collection.id}">
        ${itemCount === 0 ? '<div style="color: var(--cvt-text-muted); padding: var(--cvt-space-xs);">Empty</div>' : collection.items.map((item) => `
            <div class="cvt-collection-item">
              <span class="cvt-truncate">${item.authorName} \u2014 ${item.contentType}</span>
              <a href="${item.contentUrl}" target="_blank" style="color: var(--cvt-primary); font-size: var(--cvt-text-xs);">Open</a>
            </div>
          `).join("")}
      </div>
    </div>
  `;
  }
  function renderSettingsTab() {
    const panel = document.getElementById("panel-settings");
    const s = currentSettings;
    panel.innerHTML = `
    <div class="cvt-popup-section">
      <!-- Theme -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">Appearance</div>
        <div class="cvt-field">
          <label class="cvt-label">Theme</label>
          <div class="cvt-radio-group">
            <label class="cvt-radio-option"><input type="radio" name="theme" value="light" ${s.theme === "light" ? "checked" : ""}> Light</label>
            <label class="cvt-radio-option"><input type="radio" name="theme" value="dark" ${s.theme === "dark" ? "checked" : ""}> Dark</label>
            <label class="cvt-radio-option"><input type="radio" name="theme" value="auto" ${s.theme === "auto" ? "checked" : ""}> Auto</label>
          </div>
        </div>
      </div>

      <!-- API Key -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">API</div>
        <div class="cvt-field">
          <label class="cvt-label">API Key</label>
          <div class="cvt-input-wrapper">
            <input type="password" class="cvt-input" id="api-key-input" value="${s.apiKey || ""}" placeholder="Enter API key...">
            <button class="cvt-input-toggle-vis" id="api-key-toggle" type="button">\u{1F441}</button>
          </div>
          <div class="cvt-field-hint">Optional. Required for some Pro features.</div>
        </div>
      </div>

      <!-- Reaction & Buzz -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">Reactions & Buzz</div>
        <div class="cvt-field">
          <label class="cvt-label">Default Reaction Mode</label>
          <div class="cvt-radio-group">
            <label class="cvt-radio-option"><input type="radio" name="reactionMode" value="0" ${s.defaultReactionMode === 0 ? "checked" : ""}> None</label>
            <label class="cvt-radio-option"><input type="radio" name="reactionMode" value="1" ${s.defaultReactionMode === 1 ? "checked" : ""}> 1x</label>
            <label class="cvt-radio-option"><input type="radio" name="reactionMode" value="2" ${s.defaultReactionMode === 2 ? "checked" : ""}> 2x</label>
            <label class="cvt-radio-option"><input type="radio" name="reactionMode" value="4" ${s.defaultReactionMode === 4 ? "checked" : ""}> 4x</label>
          </div>
        </div>
        <div class="cvt-field cvt-pro-only">
          <label class="cvt-label">Default Buzz Amount</label>
          <input type="number" class="cvt-input" id="buzz-amount-input" value="${s.defaultBuzzAmount}" min="0" max="1000" style="width: 100px;">
        </div>

      </div>

      <!-- Tracking -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">User Tracking</div>
        <div class="cvt-field">
          <label class="cvt-label">Check Interval</label>
          <select class="cvt-select" id="tracking-interval-select" style="width: auto;">
            <option value="15" ${s.trackingInterval === 15 ? "selected" : ""}>15 minutes</option>
            <option value="30" ${s.trackingInterval === 30 ? "selected" : ""}>30 minutes</option>
            <option value="60" ${s.trackingInterval === 60 ? "selected" : ""}>1 hour</option>
            <option value="120" ${s.trackingInterval === 120 ? "selected" : ""}>2 hours</option>
          </select>
        </div>
      </div>

      <!-- Developer -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">Developer</div>
        <div class="cvt-field">
          <label class="cvt-toggle-row">
            <span class="cvt-label">Debug Logging</span>
            <span class="cvt-label-hint">Log extension activity to browser console</span>
            <input type="checkbox" class="cvt-toggle" id="debug-logging-toggle" ${s.debugLogging ? "checked" : ""}>
          </label>
        </div>
      </div>

      <!-- Data -->
      <div class="cvt-settings-section">
        <div class="cvt-settings-section-title">Data</div>
        <div class="cvt-btn-row">
          <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="export-all-btn">\u{1F4E4} Export All</button>
          <button class="cvt-btn cvt-btn-secondary cvt-btn-sm" id="import-all-btn">\u{1F4E5} Import All</button>
          <button class="cvt-btn cvt-btn-danger cvt-btn-sm" id="reset-btn">\u{1F5D1} Reset</button>
        </div>
      </div>
    </div>
  `;
    if (false) {
      document.body.classList.add("cvt-variant-pro");
    }
    panel.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.addEventListener("change", async () => {
        const theme = radio.value;
        currentSettings = await updateSettings({ theme });
        applyTheme(theme);
        try {
          const tabs = await import_webextension_polyfill2.default.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            await import_webextension_polyfill2.default.tabs.sendMessage(tabs[0].id, { action: "setTheme", theme });
          }
        } catch {
        }
        showToast(`Theme: ${theme}`);
      });
    });
    const apiKeyInput = document.getElementById("api-key-input");
    const apiKeyToggle = document.getElementById("api-key-toggle");
    apiKeyToggle.addEventListener("click", () => {
      apiKeyInput.type = apiKeyInput.type === "password" ? "text" : "password";
      apiKeyToggle.textContent = apiKeyInput.type === "password" ? "\u{1F441}" : "\u{1F648}";
    });
    apiKeyInput.addEventListener("change", async () => {
      const val = apiKeyInput.value.trim() || null;
      currentSettings = await updateSettings({ apiKey: val });
      showToast("API key saved");
    });
    panel.querySelectorAll('input[name="reactionMode"]').forEach((radio) => {
      radio.addEventListener("change", async () => {
        const mode = parseInt(radio.value, 10);
        currentSettings = await updateSettings({ defaultReactionMode: mode });
        showToast(`Reaction mode: ${mode}x`);
      });
    });
    const buzzInput = document.getElementById("buzz-amount-input");
    if (buzzInput) {
      buzzInput.addEventListener("change", async () => {
        const parsed = parseInt(buzzInput.value, 10);
        const val = Math.max(0, Math.min(1e3, isNaN(parsed) ? 10 : parsed));
        buzzInput.value = String(val);
        currentSettings = await updateSettings({ defaultBuzzAmount: val });
        showToast("Buzz amount saved");
      });
    }
    const intervalSelect = document.getElementById("tracking-interval-select");
    intervalSelect.addEventListener("change", async () => {
      const interval = parseInt(intervalSelect.value, 10);
      currentSettings = await updateSettings({ trackingInterval: interval });
      showToast(`Check interval: ${interval} min`);
    });
    document.getElementById("debug-logging-toggle").addEventListener("change", async (e) => {
      const enabled = e.target.checked;
      currentSettings = await updateSettings({ debugLogging: enabled });
      const [tab] = await import_webextension_polyfill2.default.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        import_webextension_polyfill2.default.tabs.sendMessage(tab.id, { action: "setDebugLogging", enabled }).catch(() => {
        });
      }
      showToast(enabled ? "Debug logging enabled" : "Debug logging disabled");
    });
    document.getElementById("export-all-btn").addEventListener("click", async () => {
      const json = await exportData();
      downloadJson(json, "civitai-extension-backup.json");
      showToast("All data exported");
    });
    document.getElementById("import-all-btn").addEventListener("click", () => {
      pickFile(".json", async (text) => {
        try {
          await importData(text);
          currentSettings = await getSettings();
          applyTheme(currentSettings.theme);
          showToast("Data imported successfully");
          renderSettingsTab();
        } catch {
          showToast("Invalid backup file", "error");
        }
      });
    });
    document.getElementById("reset-btn").addEventListener("click", async () => {
      if (confirm("Reset all settings to defaults? This cannot be undone.")) {
        currentSettings = await resetSettings();
        applyTheme(currentSettings.theme);
        showToast("Settings reset");
        renderSettingsTab();
      }
    });
  }
  function renderAbout() {
    const panel = document.getElementById("panel-about");
    panel.innerHTML = `
    <div class="cvt-about">
      <img class="cvt-about-avatar" src="autor.png" alt="Valerie">
      <div class="cvt-about-name">Valerie</div>
      <p class="cvt-about-tagline">made with love & passion \u{1F496}\u2728\u{1F338}</p>
      <p class="cvt-about-description">
        Hey! \u{1F31F} This little tool was built with lots of care to make your AI image workflow more enjoyable. I hope it brings a little extra joy to your creative process! \u{1F495}
      </p>
      <div class="cvt-about-cta">
        <a href="https://civitai.com/user/valerie_4659" target="_blank" class="cvt-btn cvt-btn-primary">
          Find me on CivitAI
        </a>
      </div>
      <div class="cvt-about-meta">
        <div class="cvt-about-meta-item">
          <span>Version</span>
          <span>2.0.0</span>
        </div>
        <div class="cvt-about-meta-item">
          <span>Variant</span>
          <span>${true ? "community" : "community"}</span>
        </div>
      </div>
    </div>
  `;
  }
  function downloadJson(json, filename) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function pickFile(accept, onLoad) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onLoad(reader.result);
      reader.readAsText(file);
    });
    input.click();
  }
  async function init() {
    currentSettings = await getSettings();
    applyTheme(currentSettings.theme);
    if (false) {
      document.body.classList.add("cvt-variant-pro");
    }
    initTabs();
    const data = await import_webextension_polyfill2.default.storage.local.get("lastPopupTab");
    const lastTab = data.lastPopupTab || "dashboard";
    switchTab(lastTab);
  }
  init();
})();
