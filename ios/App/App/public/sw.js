try{self["workbox:core:7.3.0"]&&_()}catch{}const jt=(t,...e)=>{let n=t;return e.length>0&&(n+=` :: ${JSON.stringify(e)}`),n},Kt=jt;class h extends Error{constructor(e,n){const s=Kt(e,n);super(s),this.name=e,this.details=n}}const m={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},te=t=>[m.prefix,t,m.suffix].filter(e=>e&&e.length>0).join("-"),Wt=t=>{for(const e of Object.keys(m))t(e)},F={updateDetails:t=>{Wt(e=>{typeof t[e]=="string"&&(m[e]=t[e])})},getGoogleAnalyticsName:t=>t||te(m.googleAnalytics),getPrecacheName:t=>t||te(m.precache),getPrefix:()=>m.prefix,getRuntimeName:t=>t||te(m.runtime),getSuffix:()=>m.suffix};function Oe(t,e){const n=e();return t.waitUntil(n),n}try{self["workbox:precaching:7.3.0"]&&_()}catch{}const Vt="__WB_REVISION__";function qt(t){if(!t)throw new h("add-to-cache-list-unexpected-type",{entry:t});if(typeof t=="string"){const i=new URL(t,location.href);return{cacheKey:i.href,url:i.href}}const{revision:e,url:n}=t;if(!n)throw new h("add-to-cache-list-unexpected-type",{entry:t});if(!e){const i=new URL(n,location.href);return{cacheKey:i.href,url:i.href}}const s=new URL(n,location.href),r=new URL(n,location.href);return s.searchParams.set(Vt,e),{cacheKey:s.href,url:r.href}}class zt{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:n})=>{n&&(n.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:n,cachedResponse:s})=>{if(e.type==="install"&&n&&n.originalRequest&&n.originalRequest instanceof Request){const r=n.originalRequest.url;s?this.notUpdatedURLs.push(r):this.updatedURLs.push(r)}return s}}}class Gt{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:n,params:s})=>{const r=s?.cacheKey||this._precacheController.getCacheKeyForURL(n.url);return r?new Request(r,{headers:n.headers}):n},this._precacheController=e}}let L;function Jt(){if(L===void 0){const t=new Response("");if("body"in t)try{new Response(t.body),L=!0}catch{L=!1}L=!1}return L}async function Yt(t,e){let n=null;if(t.url&&(n=new URL(t.url).origin),n!==self.location.origin)throw new h("cross-origin-copy-response",{origin:n});const s=t.clone(),i={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},a=Jt()?s.body:await s.blob();return new Response(a,i)}const Qt=t=>new URL(String(t),location.href).href.replace(new RegExp(`^${location.origin}`),"");function xe(t,e){const n=new URL(t);for(const s of e)n.searchParams.delete(s);return n.href}async function Xt(t,e,n,s){const r=xe(e.url,n);if(e.url===r)return t.match(e,s);const i=Object.assign(Object.assign({},s),{ignoreSearch:!0}),a=await t.keys(e,i);for(const o of a){const c=xe(o.url,n);if(r===c)return t.match(o,s)}}let Zt=class{constructor(){this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}};const Qe=new Set;async function en(){for(const t of Qe)await t()}function Xe(t){return new Promise(e=>setTimeout(e,t))}try{self["workbox:strategies:7.3.0"]&&_()}catch{}function V(t){return typeof t=="string"?new Request(t):t}class tn{constructor(e,n){this._cacheKeys={},Object.assign(this,n),this.event=n.event,this._strategy=e,this._handlerDeferred=new Zt,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:n}=this;let s=V(e);if(s.mode==="navigate"&&n instanceof FetchEvent&&n.preloadResponse){const a=await n.preloadResponse;if(a)return a}const r=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const a of this.iterateCallbacks("requestWillFetch"))s=await a({request:s.clone(),event:n})}catch(a){if(a instanceof Error)throw new h("plugin-error-request-will-fetch",{thrownErrorMessage:a.message})}const i=s.clone();try{let a;a=await fetch(s,s.mode==="navigate"?void 0:this._strategy.fetchOptions);for(const o of this.iterateCallbacks("fetchDidSucceed"))a=await o({event:n,request:i,response:a});return a}catch(a){throw r&&await this.runCallbacks("fetchDidFail",{error:a,event:n,originalRequest:r.clone(),request:i.clone()}),a}}async fetchAndCachePut(e){const n=await this.fetch(e),s=n.clone();return this.waitUntil(this.cachePut(e,s)),n}async cacheMatch(e){const n=V(e);let s;const{cacheName:r,matchOptions:i}=this._strategy,a=await this.getCacheKey(n,"read"),o=Object.assign(Object.assign({},i),{cacheName:r});s=await caches.match(a,o);for(const c of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await c({cacheName:r,matchOptions:i,cachedResponse:s,request:a,event:this.event})||void 0;return s}async cachePut(e,n){const s=V(e);await Xe(0);const r=await this.getCacheKey(s,"write");if(!n)throw new h("cache-put-with-no-response",{url:Qt(r.url)});const i=await this._ensureResponseSafeToCache(n);if(!i)return!1;const{cacheName:a,matchOptions:o}=this._strategy,c=await self.caches.open(a),l=this.hasCallback("cacheDidUpdate"),p=l?await Xt(c,r.clone(),["__WB_REVISION__"],o):null;try{await c.put(r,l?i.clone():i)}catch(d){if(d instanceof Error)throw d.name==="QuotaExceededError"&&await en(),d}for(const d of this.iterateCallbacks("cacheDidUpdate"))await d({cacheName:a,oldResponse:p,newResponse:i.clone(),request:r,event:this.event});return!0}async getCacheKey(e,n){const s=`${e.url} | ${n}`;if(!this._cacheKeys[s]){let r=e;for(const i of this.iterateCallbacks("cacheKeyWillBeUsed"))r=V(await i({mode:n,request:r,event:this.event,params:this.params}));this._cacheKeys[s]=r}return this._cacheKeys[s]}hasCallback(e){for(const n of this._strategy.plugins)if(e in n)return!0;return!1}async runCallbacks(e,n){for(const s of this.iterateCallbacks(e))await s(n)}*iterateCallbacks(e){for(const n of this._strategy.plugins)if(typeof n[e]=="function"){const s=this._pluginStateMap.get(n);yield i=>{const a=Object.assign(Object.assign({},i),{state:s});return n[e](a)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){for(;this._extendLifetimePromises.length;){const e=this._extendLifetimePromises.splice(0),s=(await Promise.allSettled(e)).find(r=>r.status==="rejected");if(s)throw s.reason}}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let n=e,s=!1;for(const r of this.iterateCallbacks("cacheWillUpdate"))if(n=await r({request:this.request,response:n,event:this.event})||void 0,s=!0,!n)break;return s||n&&n.status!==200&&(n=void 0),n}}class H{constructor(e={}){this.cacheName=F.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[n]=this.handleAll(e);return n}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const n=e.event,s=typeof e.request=="string"?new Request(e.request):e.request,r="params"in e?e.params:void 0,i=new tn(this,{event:n,request:s,params:r}),a=this._getResponse(i,s,n),o=this._awaitComplete(a,i,s,n);return[a,o]}async _getResponse(e,n,s){await e.runCallbacks("handlerWillStart",{event:s,request:n});let r;try{if(r=await this._handle(n,e),!r||r.type==="error")throw new h("no-response",{url:n.url})}catch(i){if(i instanceof Error){for(const a of e.iterateCallbacks("handlerDidError"))if(r=await a({error:i,event:s,request:n}),r)break}if(!r)throw i}for(const i of e.iterateCallbacks("handlerWillRespond"))r=await i({event:s,request:n,response:r});return r}async _awaitComplete(e,n,s,r){let i,a;try{i=await e}catch{}try{await n.runCallbacks("handlerDidRespond",{event:r,request:s,response:i}),await n.doneWaiting()}catch(o){o instanceof Error&&(a=o)}if(await n.runCallbacks("handlerDidComplete",{event:r,request:s,response:i,error:a}),n.destroy(),a)throw a}}class E extends H{constructor(e={}){e.cacheName=F.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=e.fallbackToNetwork!==!1,this.plugins.push(E.copyRedirectedCacheableResponsesPlugin)}async _handle(e,n){const s=await n.cacheMatch(e);return s||(n.event&&n.event.type==="install"?await this._handleInstall(e,n):await this._handleFetch(e,n))}async _handleFetch(e,n){let s;const r=n.params||{};if(this._fallbackToNetwork){const i=r.integrity,a=e.integrity,o=!a||a===i;s=await n.fetch(new Request(e,{integrity:e.mode!=="no-cors"?a||i:void 0})),i&&o&&e.mode!=="no-cors"&&(this._useDefaultCacheabilityPluginIfNeeded(),await n.cachePut(e,s.clone()))}else throw new h("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return s}async _handleInstall(e,n){this._useDefaultCacheabilityPluginIfNeeded();const s=await n.fetch(e);if(!await n.cachePut(e,s.clone()))throw new h("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,n=0;for(const[s,r]of this.plugins.entries())r!==E.copyRedirectedCacheableResponsesPlugin&&(r===E.defaultPrecacheCacheabilityPlugin&&(e=s),r.cacheWillUpdate&&n++);n===0?this.plugins.push(E.defaultPrecacheCacheabilityPlugin):n>1&&e!==null&&this.plugins.splice(e,1)}}E.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:t}){return!t||t.status>=400?null:t}};E.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:t}){return t.redirected?await Yt(t):t}};class nn{constructor({cacheName:e,plugins:n=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new E({cacheName:F.getPrecacheName(e),plugins:[...n,new Gt({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const n=[];for(const s of e){typeof s=="string"?n.push(s):s&&s.revision===void 0&&n.push(s.url);const{cacheKey:r,url:i}=qt(s),a=typeof s!="string"&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(i)&&this._urlsToCacheKeys.get(i)!==r)throw new h("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(i),secondEntry:r});if(typeof s!="string"&&s.integrity){if(this._cacheKeysToIntegrities.has(r)&&this._cacheKeysToIntegrities.get(r)!==s.integrity)throw new h("add-to-cache-list-conflicting-integrities",{url:i});this._cacheKeysToIntegrities.set(r,s.integrity)}if(this._urlsToCacheKeys.set(i,r),this._urlsToCacheModes.set(i,a),n.length>0){const o=`Workbox is precaching URLs without revision info: ${n.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(o)}}}install(e){return Oe(e,async()=>{const n=new zt;this.strategy.plugins.push(n);for(const[i,a]of this._urlsToCacheKeys){const o=this._cacheKeysToIntegrities.get(a),c=this._urlsToCacheModes.get(i),l=new Request(i,{integrity:o,cache:c,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:a},request:l,event:e}))}const{updatedURLs:s,notUpdatedURLs:r}=n;return{updatedURLs:s,notUpdatedURLs:r}})}activate(e){return Oe(e,async()=>{const n=await self.caches.open(this.strategy.cacheName),s=await n.keys(),r=new Set(this._urlsToCacheKeys.values()),i=[];for(const a of s)r.has(a.url)||(await n.delete(a),i.push(a.url));return{deletedURLs:i}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const n=new URL(e,location.href);return this._urlsToCacheKeys.get(n.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const n=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(n);if(s)return(await self.caches.open(this.strategy.cacheName)).match(s)}createHandlerBoundToURL(e){const n=this.getCacheKeyForURL(e);if(!n)throw new h("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:n},s.params),this.strategy.handle(s))}}let ne;const ye=()=>(ne||(ne=new nn),ne);try{self["workbox:routing:7.3.0"]&&_()}catch{}const Ze="GET",z=t=>t&&typeof t=="object"?t:{handle:t};class v{constructor(e,n,s=Ze){this.handler=z(n),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=z(e)}}class sn extends v{constructor(e,n,s){const r=({url:i})=>{const a=e.exec(i.href);if(a&&!(i.origin!==location.origin&&a.index!==0))return a.slice(1)};super(r,n,s)}}class rn{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:n}=e,s=this.handleRequest({request:n,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:n}=e.data,s=Promise.all(n.urlsToCache.map(r=>{typeof r=="string"&&(r=[r]);const i=new Request(...r);return this.handleRequest({request:i,event:e})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}}))}handleRequest({request:e,event:n}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const r=s.origin===location.origin,{params:i,route:a}=this.findMatchingRoute({event:n,request:e,sameOrigin:r,url:s});let o=a&&a.handler;const c=e.method;if(!o&&this._defaultHandlerMap.has(c)&&(o=this._defaultHandlerMap.get(c)),!o)return;let l;try{l=o.handle({url:s,request:e,event:n,params:i})}catch(d){l=Promise.reject(d)}const p=a&&a.catchHandler;return l instanceof Promise&&(this._catchHandler||p)&&(l=l.catch(async d=>{if(p)try{return await p.handle({url:s,request:e,event:n,params:i})}catch(S){S instanceof Error&&(d=S)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:n});throw d})),l}findMatchingRoute({url:e,sameOrigin:n,request:s,event:r}){const i=this._routes.get(s.method)||[];for(const a of i){let o;const c=a.match({url:e,sameOrigin:n,request:s,event:r});if(c)return o=c,(Array.isArray(o)&&o.length===0||c.constructor===Object&&Object.keys(c).length===0||typeof c=="boolean")&&(o=void 0),{route:a,params:o}}return{}}setDefaultHandler(e,n=Ze){this._defaultHandlerMap.set(n,z(e))}setCatchHandler(e){this._catchHandler=z(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new h("unregister-route-but-not-found-with-method",{method:e.method});const n=this._routes.get(e.method).indexOf(e);if(n>-1)this._routes.get(e.method).splice(n,1);else throw new h("unregister-route-route-not-registered")}}let B;const an=()=>(B||(B=new rn,B.addFetchListener(),B.addCacheListener()),B);function y(t,e,n){let s;if(typeof t=="string"){const i=new URL(t,location.href),a=({url:o})=>o.href===i.href;s=new v(a,e,n)}else if(t instanceof RegExp)s=new sn(t,e,n);else if(typeof t=="function")s=new v(t,e,n);else if(t instanceof v)s=t;else throw new h("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});return an().registerRoute(s),s}function on(t,e=[]){for(const n of[...t.searchParams.keys()])e.some(s=>s.test(n))&&t.searchParams.delete(n);return t}function*cn(t,{ignoreURLParametersMatching:e=[/^utm_/,/^fbclid$/],directoryIndex:n="index.html",cleanURLs:s=!0,urlManipulation:r}={}){const i=new URL(t,location.href);i.hash="",yield i.href;const a=on(i,e);if(yield a.href,n&&a.pathname.endsWith("/")){const o=new URL(a.href);o.pathname+=n,yield o.href}if(s){const o=new URL(a.href);o.pathname+=".html",yield o.href}if(r){const o=r({url:i});for(const c of o)yield c.href}}class ln extends v{constructor(e,n){const s=({request:r})=>{const i=e.getURLsToCacheKeys();for(const a of cn(r.url,n)){const o=i.get(a);if(o){const c=e.getIntegrityForCacheKey(o);return{cacheKey:o,integrity:c}}}};super(s,e.strategy)}}function un(t){const e=ye(),n=new ln(e,t);y(n)}const hn="-precache-",dn=async(t,e=hn)=>{const s=(await self.caches.keys()).filter(r=>r.includes(e)&&r.includes(self.registration.scope)&&r!==t);return await Promise.all(s.map(r=>self.caches.delete(r))),s};function fn(){self.addEventListener("activate",(t=>{const e=F.getPrecacheName();t.waitUntil(dn(e).then(n=>{}))}))}function pn(t){return ye().matchPrecache(t)}function gn(t){ye().precache(t)}function mn(t,e){gn(t),un(e)}class wn extends v{constructor(e,{allowlist:n=[/./],denylist:s=[]}={}){super(r=>this._match(r),e),this._allowlist=n,this._denylist=s}_match({url:e,request:n}){if(n&&n.mode!=="navigate")return!1;const s=e.pathname+e.search;for(const r of this._denylist)if(r.test(s))return!1;return!!this._allowlist.some(r=>r.test(s))}}class et extends H{async _handle(e,n){let s=await n.cacheMatch(e),r;if(!s)try{s=await n.fetchAndCachePut(e)}catch(i){i instanceof Error&&(r=i)}if(!s)throw new h("no-response",{url:e.url,error:r});return s}}const tt={cacheWillUpdate:async({response:t})=>t.status===200||t.status===0?t:null};class nt extends H{constructor(e={}){super(e),this.plugins.some(n=>"cacheWillUpdate"in n)||this.plugins.unshift(tt),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,n){const s=[],r=[];let i;if(this._networkTimeoutSeconds){const{id:c,promise:l}=this._getTimeoutPromise({request:e,logs:s,handler:n});i=c,r.push(l)}const a=this._getNetworkPromise({timeoutId:i,request:e,logs:s,handler:n});r.push(a);const o=await n.waitUntil((async()=>await n.waitUntil(Promise.race(r))||await a)());if(!o)throw new h("no-response",{url:e.url});return o}_getTimeoutPromise({request:e,logs:n,handler:s}){let r;return{promise:new Promise(a=>{r=setTimeout(async()=>{a(await s.cacheMatch(e))},this._networkTimeoutSeconds*1e3)}),id:r}}async _getNetworkPromise({timeoutId:e,request:n,logs:s,handler:r}){let i,a;try{a=await r.fetchAndCachePut(n)}catch(o){o instanceof Error&&(i=o)}return e&&clearTimeout(e),(i||!a)&&(a=await r.cacheMatch(n)),a}}class st extends H{constructor(e={}){super(e),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,n){let s,r;try{const i=[n.fetch(e)];if(this._networkTimeoutSeconds){const a=Xe(this._networkTimeoutSeconds*1e3);i.push(a)}if(r=await Promise.race(i),!r)throw new Error(`Timed out the network response after ${this._networkTimeoutSeconds} seconds.`)}catch(i){i instanceof Error&&(s=i)}if(!r)throw new h("no-response",{url:e.url,error:s});return r}}class rt extends H{constructor(e={}){super(e),this.plugins.some(n=>"cacheWillUpdate"in n)||this.plugins.unshift(tt)}async _handle(e,n){const s=n.fetchAndCachePut(e).catch(()=>{});n.waitUntil(s);let r=await n.cacheMatch(e),i;if(!r)try{r=await s}catch(a){a instanceof Error&&(i=a)}if(!r)throw new h("no-response",{url:e.url,error:i});return r}}function it(t){t.then(()=>{})}const bn=(t,e)=>e.some(n=>t instanceof n);let Me,Pe;function yn(){return Me||(Me=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function _n(){return Pe||(Pe=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const at=new WeakMap,de=new WeakMap,ot=new WeakMap,se=new WeakMap,_e=new WeakMap;function En(t){const e=new Promise((n,s)=>{const r=()=>{t.removeEventListener("success",i),t.removeEventListener("error",a)},i=()=>{n(w(t.result)),r()},a=()=>{s(t.error),r()};t.addEventListener("success",i),t.addEventListener("error",a)});return e.then(n=>{n instanceof IDBCursor&&at.set(n,t)}).catch(()=>{}),_e.set(e,t),e}function Cn(t){if(de.has(t))return;const e=new Promise((n,s)=>{const r=()=>{t.removeEventListener("complete",i),t.removeEventListener("error",a),t.removeEventListener("abort",a)},i=()=>{n(),r()},a=()=>{s(t.error||new DOMException("AbortError","AbortError")),r()};t.addEventListener("complete",i),t.addEventListener("error",a),t.addEventListener("abort",a)});de.set(t,e)}let fe={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return de.get(t);if(e==="objectStoreNames")return t.objectStoreNames||ot.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return w(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function Sn(t){fe=t(fe)}function In(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const s=t.call(re(this),e,...n);return ot.set(s,e.sort?e.sort():[e]),w(s)}:_n().includes(t)?function(...e){return t.apply(re(this),e),w(at.get(this))}:function(...e){return w(t.apply(re(this),e))}}function Tn(t){return typeof t=="function"?In(t):(t instanceof IDBTransaction&&Cn(t),bn(t,yn())?new Proxy(t,fe):t)}function w(t){if(t instanceof IDBRequest)return En(t);if(se.has(t))return se.get(t);const e=Tn(t);return e!==t&&(se.set(t,e),_e.set(e,t)),e}const re=t=>_e.get(t);function j(t,e,{blocked:n,upgrade:s,blocking:r,terminated:i}={}){const a=indexedDB.open(t,e),o=w(a);return s&&a.addEventListener("upgradeneeded",c=>{s(w(a.result),c.oldVersion,c.newVersion,w(a.transaction),c)}),n&&a.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),o.then(c=>{i&&c.addEventListener("close",()=>i()),r&&c.addEventListener("versionchange",l=>r(l.oldVersion,l.newVersion,l))}).catch(()=>{}),o}function q(t,{blocked:e}={}){const n=indexedDB.deleteDatabase(t);return e&&n.addEventListener("blocked",s=>e(s.oldVersion,s)),w(n).then(()=>{})}const kn=["get","getKey","getAll","getAllKeys","count"],An=["put","add","delete","clear"],ie=new Map;function Le(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(ie.get(e))return ie.get(e);const n=e.replace(/FromIndex$/,""),s=e!==n,r=An.includes(n);if(!(n in(s?IDBIndex:IDBObjectStore).prototype)||!(r||kn.includes(n)))return;const i=async function(a,...o){const c=this.transaction(a,r?"readwrite":"readonly");let l=c.store;return s&&(l=l.index(o.shift())),(await Promise.all([l[n](...o),r&&c.done]))[0]};return ie.set(e,i),i}Sn(t=>({...t,get:(e,n,s)=>Le(e,n)||t.get(e,n,s),has:(e,n)=>!!Le(e,n)||t.has(e,n)}));try{self["workbox:expiration:7.3.0"]&&_()}catch{}const Dn="workbox-expiration",U="cache-entries",Be=t=>{const e=new URL(t,location.href);return e.hash="",e.href};class Rn{constructor(e){this._db=null,this._cacheName=e}_upgradeDb(e){const n=e.createObjectStore(U,{keyPath:"id"});n.createIndex("cacheName","cacheName",{unique:!1}),n.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&q(this._cacheName)}async setTimestamp(e,n){e=Be(e);const s={url:e,timestamp:n,cacheName:this._cacheName,id:this._getId(e)},i=(await this.getDb()).transaction(U,"readwrite",{durability:"relaxed"});await i.store.put(s),await i.done}async getTimestamp(e){const s=await(await this.getDb()).get(U,this._getId(e));return s?.timestamp}async expireEntries(e,n){const s=await this.getDb();let r=await s.transaction(U).store.index("timestamp").openCursor(null,"prev");const i=[];let a=0;for(;r;){const c=r.value;c.cacheName===this._cacheName&&(e&&c.timestamp<e||n&&a>=n?i.push(r.value):a++),r=await r.continue()}const o=[];for(const c of i)await s.delete(U,c.id),o.push(c.url);return o}_getId(e){return this._cacheName+"|"+Be(e)}async getDb(){return this._db||(this._db=await j(Dn,1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class vn{constructor(e,n={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=n.maxEntries,this._maxAgeSeconds=n.maxAgeSeconds,this._matchOptions=n.matchOptions,this._cacheName=e,this._timestampModel=new Rn(e)}async expireEntries(){if(this._isRunning){this._rerunRequested=!0;return}this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-this._maxAgeSeconds*1e3:0,n=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const r of n)await s.delete(r,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,it(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){const n=await this._timestampModel.getTimestamp(e),s=Date.now()-this._maxAgeSeconds*1e3;return n!==void 0?n<s:!0}else return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}function Nn(t){Qe.add(t)}class K{constructor(e={}){this.cachedResponseWillBeUsed=async({event:n,request:s,cacheName:r,cachedResponse:i})=>{if(!i)return null;const a=this._isResponseDateFresh(i),o=this._getCacheExpiration(r);it(o.expireEntries());const c=o.updateTimestamp(s.url);if(n)try{n.waitUntil(c)}catch{}return a?i:null},this.cacheDidUpdate=async({cacheName:n,request:s})=>{const r=this._getCacheExpiration(n);await r.updateTimestamp(s.url),await r.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&Nn(()=>this.deleteCacheAndMetadata())}_getCacheExpiration(e){if(e===F.getRuntimeName())throw new h("expire-custom-caches-only");let n=this._cacheExpirations.get(e);return n||(n=new vn(e,this._config),this._cacheExpirations.set(e,n)),n}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const n=this._getDateHeaderTimestamp(e);if(n===null)return!0;const s=Date.now();return n>=s-this._maxAgeSeconds*1e3}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const n=e.headers.get("date"),r=new Date(n).getTime();return isNaN(r)?null:r}async deleteCacheAndMetadata(){for(const[e,n]of this._cacheExpirations)await self.caches.delete(e),await n.delete();this._cacheExpirations=new Map}}try{self["workbox:cacheable-response:7.3.0"]&&_()}catch{}class On{constructor(e={}){this._statuses=e.statuses,this._headers=e.headers}isResponseCacheable(e){let n=!0;return this._statuses&&(n=this._statuses.includes(e.status)),this._headers&&n&&(n=Object.keys(this._headers).some(s=>e.headers.get(s)===this._headers[s])),n}}class x{constructor(e){this.cacheWillUpdate=async({response:n})=>this._cacheableResponse.isResponseCacheable(n)?n:null,this._cacheableResponse=new On(e)}}try{self["workbox:range-requests:7.3.0"]&&_()}catch{}function xn(t,e,n){const s=t.size;if(n&&n>s||e&&e<0)throw new h("range-not-satisfiable",{size:s,end:n,start:e});let r,i;return e!==void 0&&n!==void 0?(r=e,i=n+1):e!==void 0&&n===void 0?(r=e,i=s):n!==void 0&&e===void 0&&(r=s-n,i=s),{start:r,end:i}}function Mn(t){const e=t.trim().toLowerCase();if(!e.startsWith("bytes="))throw new h("unit-must-be-bytes",{normalizedRangeHeader:e});if(e.includes(","))throw new h("single-range-only",{normalizedRangeHeader:e});const n=/(\d*)-(\d*)/.exec(e);if(!n||!(n[1]||n[2]))throw new h("invalid-range-values",{normalizedRangeHeader:e});return{start:n[1]===""?void 0:Number(n[1]),end:n[2]===""?void 0:Number(n[2])}}async function Pn(t,e){try{if(e.status===206)return e;const n=t.headers.get("range");if(!n)throw new h("no-range-header");const s=Mn(n),r=await e.blob(),i=xn(r,s.start,s.end),a=r.slice(i.start,i.end),o=a.size,c=new Response(a,{status:206,statusText:"Partial Content",headers:e.headers});return c.headers.set("Content-Length",String(o)),c.headers.set("Content-Range",`bytes ${i.start}-${i.end-1}/${r.size}`),c}catch{return new Response("",{status:416,statusText:"Range Not Satisfiable"})}}class Ln{constructor(){this.cachedResponseWillBeUsed=async({request:e,cachedResponse:n})=>n&&e.headers.has("range")?await Pn(e,n):n}}const Bn=()=>{};var Ue={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ct=function(t){const e=[];let n=0;for(let s=0;s<t.length;s++){let r=t.charCodeAt(s);r<128?e[n++]=r:r<2048?(e[n++]=r>>6|192,e[n++]=r&63|128):(r&64512)===55296&&s+1<t.length&&(t.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(t.charCodeAt(++s)&1023),e[n++]=r>>18|240,e[n++]=r>>12&63|128,e[n++]=r>>6&63|128,e[n++]=r&63|128):(e[n++]=r>>12|224,e[n++]=r>>6&63|128,e[n++]=r&63|128)}return e},Un=function(t){const e=[];let n=0,s=0;for(;n<t.length;){const r=t[n++];if(r<128)e[s++]=String.fromCharCode(r);else if(r>191&&r<224){const i=t[n++];e[s++]=String.fromCharCode((r&31)<<6|i&63)}else if(r>239&&r<365){const i=t[n++],a=t[n++],o=t[n++],c=((r&7)<<18|(i&63)<<12|(a&63)<<6|o&63)-65536;e[s++]=String.fromCharCode(55296+(c>>10)),e[s++]=String.fromCharCode(56320+(c&1023))}else{const i=t[n++],a=t[n++];e[s++]=String.fromCharCode((r&15)<<12|(i&63)<<6|a&63)}}return e.join("")},lt={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<t.length;r+=3){const i=t[r],a=r+1<t.length,o=a?t[r+1]:0,c=r+2<t.length,l=c?t[r+2]:0,p=i>>2,d=(i&3)<<4|o>>4;let S=(o&15)<<2|l>>6,W=l&63;c||(W=64,a||(S=64)),s.push(n[p],n[d],n[S],n[W])}return s.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(ct(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):Un(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<t.length;){const i=n[t.charAt(r++)],o=r<t.length?n[t.charAt(r)]:0;++r;const l=r<t.length?n[t.charAt(r)]:64;++r;const d=r<t.length?n[t.charAt(r)]:64;if(++r,i==null||o==null||l==null||d==null)throw new $n;const S=i<<2|o>>4;if(s.push(S),l!==64){const W=o<<4&240|l>>2;if(s.push(W),d!==64){const Ht=l<<6&192|d;s.push(Ht)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class $n extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Fn=function(t){const e=ct(t);return lt.encodeByteArray(e,!0)},ut=function(t){return Fn(t).replace(/\./g,"")},Hn=function(t){try{return lt.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kn=()=>jn().__FIREBASE_DEFAULTS__,Wn=()=>{if(typeof process>"u"||typeof Ue>"u")return;const t=Ue.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},Vn=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&Hn(t[1]);return e&&JSON.parse(e)},qn=()=>{try{return Bn()||Kn()||Wn()||Vn()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},ht=()=>qn()?.config;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zn{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,s)=>{n?this.reject(n):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,s))}}}function dt(){try{return typeof indexedDB=="object"}catch{return!1}}function ft(){return new Promise((t,e)=>{try{let n=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(s),t(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{e(r.error?.message||"")}}catch(n){e(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gn="FirebaseError";class M extends Error{constructor(e,n,s){super(n),this.code=e,this.customData=s,this.name=Gn,Object.setPrototypeOf(this,M.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,X.prototype.create)}}class X{constructor(e,n,s){this.service=e,this.serviceName=n,this.errors=s}create(e,...n){const s=n[0]||{},r=`${this.service}/${e}`,i=this.errors[e],a=i?Jn(i,s):"Error",o=`${this.serviceName}: ${a} (${r}).`;return new M(r,o,s)}}function Jn(t,e){return t.replace(Yn,(n,s)=>{const r=e[s];return r!=null?String(r):`<${s}?>`})}const Yn=/\{\$([^}]+)}/g;function pe(t,e){if(t===e)return!0;const n=Object.keys(t),s=Object.keys(e);for(const r of n){if(!s.includes(r))return!1;const i=t[r],a=e[r];if($e(i)&&$e(a)){if(!pe(i,a))return!1}else if(i!==a)return!1}for(const r of s)if(!n.includes(r))return!1;return!0}function $e(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pt(t){return t&&t._delegate?t._delegate:t}class k{constructor(e,n,s){this.name=e,this.instanceFactory=n,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const I="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qn{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const s=new zn;if(this.instancesDeferred.set(n,s),this.isInitialized(n)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:n});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e?.identifier),s=e?.optional??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Zn(e))try{this.getOrInitializeService({instanceIdentifier:I})}catch{}for(const[n,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(n);try{const i=this.getOrInitializeService({instanceIdentifier:r});s.resolve(i)}catch{}}}}clearInstance(e=I){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=I){return this.instances.has(e)}getOptions(e=I){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:n});for(const[i,a]of this.instancesDeferred.entries()){const o=this.normalizeInstanceIdentifier(i);s===o&&a.resolve(r)}return r}onInit(e,n){const s=this.normalizeInstanceIdentifier(n),r=this.onInitCallbacks.get(s)??new Set;r.add(e),this.onInitCallbacks.set(s,r);const i=this.instances.get(s);return i&&e(i,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,n){const s=this.onInitCallbacks.get(n);if(s)for(const r of s)try{r(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Xn(e),options:n}),this.instances.set(e,s),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=I){return this.component?this.component.multipleInstances?e:I:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Xn(t){return t===I?void 0:t}function Zn(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class es{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new Qn(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var u;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(u||(u={}));const ts={debug:u.DEBUG,verbose:u.VERBOSE,info:u.INFO,warn:u.WARN,error:u.ERROR,silent:u.SILENT},ns=u.INFO,ss={[u.DEBUG]:"log",[u.VERBOSE]:"log",[u.INFO]:"info",[u.WARN]:"warn",[u.ERROR]:"error"},rs=(t,e,...n)=>{if(e<t.logLevel)return;const s=new Date().toISOString(),r=ss[e];if(r)console[r](`[${s}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class is{constructor(e){this.name=e,this._logLevel=ns,this._logHandler=rs,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in u))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ts[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,u.DEBUG,...e),this._logHandler(this,u.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,u.VERBOSE,...e),this._logHandler(this,u.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,u.INFO,...e),this._logHandler(this,u.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,u.WARN,...e),this._logHandler(this,u.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,u.ERROR,...e),this._logHandler(this,u.ERROR,...e)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class as{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(os(n)){const s=n.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(n=>n).join(" ")}}function os(t){return t.getComponent()?.type==="VERSION"}const ge="@firebase/app",Fe="0.14.9";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b=new is("@firebase/app"),cs="@firebase/app-compat",ls="@firebase/analytics-compat",us="@firebase/analytics",hs="@firebase/app-check-compat",ds="@firebase/app-check",fs="@firebase/auth",ps="@firebase/auth-compat",gs="@firebase/database",ms="@firebase/data-connect",ws="@firebase/database-compat",bs="@firebase/functions",ys="@firebase/functions-compat",_s="@firebase/installations",Es="@firebase/installations-compat",Cs="@firebase/messaging",Ss="@firebase/messaging-compat",Is="@firebase/performance",Ts="@firebase/performance-compat",ks="@firebase/remote-config",As="@firebase/remote-config-compat",Ds="@firebase/storage",Rs="@firebase/storage-compat",vs="@firebase/firestore",Ns="@firebase/ai",Os="@firebase/firestore-compat",xs="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const me="[DEFAULT]",Ms={[ge]:"fire-core",[cs]:"fire-core-compat",[us]:"fire-analytics",[ls]:"fire-analytics-compat",[ds]:"fire-app-check",[hs]:"fire-app-check-compat",[fs]:"fire-auth",[ps]:"fire-auth-compat",[gs]:"fire-rtdb",[ms]:"fire-data-connect",[ws]:"fire-rtdb-compat",[bs]:"fire-fn",[ys]:"fire-fn-compat",[_s]:"fire-iid",[Es]:"fire-iid-compat",[Cs]:"fire-fcm",[Ss]:"fire-fcm-compat",[Is]:"fire-perf",[Ts]:"fire-perf-compat",[ks]:"fire-rc",[As]:"fire-rc-compat",[Ds]:"fire-gcs",[Rs]:"fire-gcs-compat",[vs]:"fire-fst",[Os]:"fire-fst-compat",[Ns]:"fire-vertex","fire-js":"fire-js",[xs]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const G=new Map,Ps=new Map,we=new Map;function He(t,e){try{t.container.addComponent(e)}catch(n){b.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function O(t){const e=t.name;if(we.has(e))return b.debug(`There were multiple attempts to register component ${e}.`),!1;we.set(e,t);for(const n of G.values())He(n,t);for(const n of Ps.values())He(n,t);return!0}function Ee(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ls={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},C=new X("app","Firebase",Ls);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bs{constructor(e,n,s){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new k("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw C.create("app-deleted",{appName:this._name})}}function gt(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const s={name:me,automaticDataCollectionEnabled:!0,...e},r=s.name;if(typeof r!="string"||!r)throw C.create("bad-app-name",{appName:String(r)});if(n||(n=ht()),!n)throw C.create("no-options");const i=G.get(r);if(i){if(pe(n,i.options)&&pe(s,i.config))return i;throw C.create("duplicate-app",{appName:r})}const a=new es(r);for(const c of we.values())a.addComponent(c);const o=new Bs(n,s,a);return G.set(r,o),o}function Us(t=me){const e=G.get(t);if(!e&&t===me&&ht())return gt();if(!e)throw C.create("no-app",{appName:t});return e}function N(t,e,n){let s=Ms[t]??t;n&&(s+=`-${n}`);const r=s.match(/\s|\//),i=e.match(/\s|\//);if(r||i){const a=[`Unable to register library "${s}" with version "${e}":`];r&&a.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&i&&a.push("and"),i&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),b.warn(a.join(" "));return}O(new k(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $s="firebase-heartbeat-database",Fs=1,$="firebase-heartbeat-store";let ae=null;function mt(){return ae||(ae=j($s,Fs,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore($)}catch(n){console.warn(n)}}}}).catch(t=>{throw C.create("idb-open",{originalErrorMessage:t.message})})),ae}async function Hs(t){try{const n=(await mt()).transaction($),s=await n.objectStore($).get(wt(t));return await n.done,s}catch(e){if(e instanceof M)b.warn(e.message);else{const n=C.create("idb-get",{originalErrorMessage:e?.message});b.warn(n.message)}}}async function je(t,e){try{const s=(await mt()).transaction($,"readwrite");await s.objectStore($).put(e,wt(t)),await s.done}catch(n){if(n instanceof M)b.warn(n.message);else{const s=C.create("idb-set",{originalErrorMessage:n?.message});b.warn(s.message)}}}function wt(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const js=1024,Ks=30;class Ws{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new qs(n),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){try{const n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=Ke();if(this._heartbeatsCache?.heartbeats==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(r=>r.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:n}),this._heartbeatsCache.heartbeats.length>Ks){const r=zs(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(r,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){b.warn(e)}}async getHeartbeatsHeader(){try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=Ke(),{heartbeatsToSend:n,unsentEntries:s}=Vs(this._heartbeatsCache.heartbeats),r=ut(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=e,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(e){return b.warn(e),""}}}function Ke(){return new Date().toISOString().substring(0,10)}function Vs(t,e=js){const n=[];let s=t.slice();for(const r of t){const i=n.find(a=>a.agent===r.agent);if(i){if(i.dates.push(r.date),We(n)>e){i.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),We(n)>e){n.pop();break}s=s.slice(1)}return{heartbeatsToSend:n,unsentEntries:s}}class qs{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return dt()?ft().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Hs(this.app);return n?.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return je(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return je(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function We(t){return ut(JSON.stringify({version:2,heartbeats:t})).length}function zs(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let s=1;s<t.length;s++)t[s].date<n&&(n=t[s].date,e=s);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gs(t){O(new k("platform-logger",e=>new as(e),"PRIVATE")),O(new k("heartbeat",e=>new Ws(e),"PRIVATE")),N(ge,Fe,t),N(ge,Fe,"esm2020"),N("fire-js","")}Gs("");var Js="firebase",Ys="12.10.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */N(Js,Ys,"app");const bt="@firebase/installations",Ce="0.6.20";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yt=1e4,_t=`w:${Ce}`,Et="FIS_v2",Qs="https://firebaseinstallations.googleapis.com/v1",Xs=3600*1e3,Zs="installations",er="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},A=new X(Zs,er,tr);function Ct(t){return t instanceof M&&t.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function St({projectId:t}){return`${Qs}/projects/${t}/installations`}function It(t){return{token:t.token,requestStatus:2,expiresIn:sr(t.expiresIn),creationTime:Date.now()}}async function Tt(t,e){const s=(await e.json()).error;return A.create("request-failed",{requestName:t,serverCode:s.code,serverMessage:s.message,serverStatus:s.status})}function kt({apiKey:t}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t})}function nr(t,{refreshToken:e}){const n=kt(t);return n.append("Authorization",rr(e)),n}async function At(t){const e=await t();return e.status>=500&&e.status<600?t():e}function sr(t){return Number(t.replace("s","000"))}function rr(t){return`${Et} ${t}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ir({appConfig:t,heartbeatServiceProvider:e},{fid:n}){const s=St(t),r=kt(t),i=e.getImmediate({optional:!0});if(i){const l=await i.getHeartbeatsHeader();l&&r.append("x-firebase-client",l)}const a={fid:n,authVersion:Et,appId:t.appId,sdkVersion:_t},o={method:"POST",headers:r,body:JSON.stringify(a)},c=await At(()=>fetch(s,o));if(c.ok){const l=await c.json();return{fid:l.fid||n,registrationStatus:2,refreshToken:l.refreshToken,authToken:It(l.authToken)}}else throw await Tt("Create Installation",c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Dt(t){return new Promise(e=>{setTimeout(e,t)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ar(t){return btoa(String.fromCharCode(...t)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const or=/^[cdef][\w-]{21}$/,be="";function cr(){try{const t=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(t),t[0]=112+t[0]%16;const n=lr(t);return or.test(n)?n:be}catch{return be}}function lr(t){return ar(t).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Z(t){return`${t.appName}!${t.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rt=new Map;function vt(t,e){const n=Z(t);Nt(n,e),ur(n,e)}function Nt(t,e){const n=Rt.get(t);if(n)for(const s of n)s(e)}function ur(t,e){const n=hr();n&&n.postMessage({key:t,fid:e}),dr()}let T=null;function hr(){return!T&&"BroadcastChannel"in self&&(T=new BroadcastChannel("[Firebase] FID Change"),T.onmessage=t=>{Nt(t.data.key,t.data.fid)}),T}function dr(){Rt.size===0&&T&&(T.close(),T=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fr="firebase-installations-database",pr=1,D="firebase-installations-store";let oe=null;function Se(){return oe||(oe=j(fr,pr,{upgrade:(t,e)=>{switch(e){case 0:t.createObjectStore(D)}}})),oe}async function J(t,e){const n=Z(t),r=(await Se()).transaction(D,"readwrite"),i=r.objectStore(D),a=await i.get(n);return await i.put(e,n),await r.done,(!a||a.fid!==e.fid)&&vt(t,e.fid),e}async function Ot(t){const e=Z(t),s=(await Se()).transaction(D,"readwrite");await s.objectStore(D).delete(e),await s.done}async function ee(t,e){const n=Z(t),r=(await Se()).transaction(D,"readwrite"),i=r.objectStore(D),a=await i.get(n),o=e(a);return o===void 0?await i.delete(n):await i.put(o,n),await r.done,o&&(!a||a.fid!==o.fid)&&vt(t,o.fid),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ie(t){let e;const n=await ee(t.appConfig,s=>{const r=gr(s),i=mr(t,r);return e=i.registrationPromise,i.installationEntry});return n.fid===be?{installationEntry:await e}:{installationEntry:n,registrationPromise:e}}function gr(t){const e=t||{fid:cr(),registrationStatus:0};return xt(e)}function mr(t,e){if(e.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(A.create("app-offline"));return{installationEntry:e,registrationPromise:r}}const n={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},s=wr(t,n);return{installationEntry:n,registrationPromise:s}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:br(t)}:{installationEntry:e}}async function wr(t,e){try{const n=await ir(t,e);return J(t.appConfig,n)}catch(n){throw Ct(n)&&n.customData.serverCode===409?await Ot(t.appConfig):await J(t.appConfig,{fid:e.fid,registrationStatus:0}),n}}async function br(t){let e=await Ve(t.appConfig);for(;e.registrationStatus===1;)await Dt(100),e=await Ve(t.appConfig);if(e.registrationStatus===0){const{installationEntry:n,registrationPromise:s}=await Ie(t);return s||n}return e}function Ve(t){return ee(t,e=>{if(!e)throw A.create("installation-not-found");return xt(e)})}function xt(t){return yr(t)?{fid:t.fid,registrationStatus:0}:t}function yr(t){return t.registrationStatus===1&&t.registrationTime+yt<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _r({appConfig:t,heartbeatServiceProvider:e},n){const s=Er(t,n),r=nr(t,n),i=e.getImmediate({optional:!0});if(i){const l=await i.getHeartbeatsHeader();l&&r.append("x-firebase-client",l)}const a={installation:{sdkVersion:_t,appId:t.appId}},o={method:"POST",headers:r,body:JSON.stringify(a)},c=await At(()=>fetch(s,o));if(c.ok){const l=await c.json();return It(l)}else throw await Tt("Generate Auth Token",c)}function Er(t,{fid:e}){return`${St(t)}/${e}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Te(t,e=!1){let n;const s=await ee(t.appConfig,i=>{if(!Mt(i))throw A.create("not-registered");const a=i.authToken;if(!e&&Ir(a))return i;if(a.requestStatus===1)return n=Cr(t,e),i;{if(!navigator.onLine)throw A.create("app-offline");const o=kr(i);return n=Sr(t,o),o}});return n?await n:s.authToken}async function Cr(t,e){let n=await qe(t.appConfig);for(;n.authToken.requestStatus===1;)await Dt(100),n=await qe(t.appConfig);const s=n.authToken;return s.requestStatus===0?Te(t,e):s}function qe(t){return ee(t,e=>{if(!Mt(e))throw A.create("not-registered");const n=e.authToken;return Ar(n)?{...e,authToken:{requestStatus:0}}:e})}async function Sr(t,e){try{const n=await _r(t,e),s={...e,authToken:n};return await J(t.appConfig,s),n}catch(n){if(Ct(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Ot(t.appConfig);else{const s={...e,authToken:{requestStatus:0}};await J(t.appConfig,s)}throw n}}function Mt(t){return t!==void 0&&t.registrationStatus===2}function Ir(t){return t.requestStatus===2&&!Tr(t)}function Tr(t){const e=Date.now();return e<t.creationTime||t.creationTime+t.expiresIn<e+Xs}function kr(t){const e={requestStatus:1,requestTime:Date.now()};return{...t,authToken:e}}function Ar(t){return t.requestStatus===1&&t.requestTime+yt<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dr(t){const e=t,{installationEntry:n,registrationPromise:s}=await Ie(e);return s?s.catch(console.error):Te(e).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rr(t,e=!1){const n=t;return await vr(n),(await Te(n,e)).token}async function vr(t){const{registrationPromise:e}=await Ie(t);e&&await e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nr(t){if(!t||!t.options)throw ce("App Configuration");if(!t.name)throw ce("App Name");const e=["projectId","apiKey","appId"];for(const n of e)if(!t.options[n])throw ce(n);return{appName:t.name,projectId:t.options.projectId,apiKey:t.options.apiKey,appId:t.options.appId}}function ce(t){return A.create("missing-app-config-values",{valueName:t})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pt="installations",Or="installations-internal",xr=t=>{const e=t.getProvider("app").getImmediate(),n=Nr(e),s=Ee(e,"heartbeat");return{app:e,appConfig:n,heartbeatServiceProvider:s,_delete:()=>Promise.resolve()}},Mr=t=>{const e=t.getProvider("app").getImmediate(),n=Ee(e,Pt).getImmediate();return{getId:()=>Dr(n),getToken:r=>Rr(n,r)}};function Pr(){O(new k(Pt,xr,"PUBLIC")),O(new k(Or,Mr,"PRIVATE"))}Pr();N(bt,Ce);N(bt,Ce,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lt="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Lr="https://fcmregistrations.googleapis.com/v1",Bt="FCM_MSG",Br="google.c.a.c_id",Ur=3,$r=1;var Y;(function(t){t[t.DATA_MESSAGE=1]="DATA_MESSAGE",t[t.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(Y||(Y={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var Q;(function(t){t.PUSH_RECEIVED="push-received",t.NOTIFICATION_CLICKED="notification-clicked"})(Q||(Q={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function g(t){const e=new Uint8Array(t);return btoa(String.fromCharCode(...e)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Fr(t){const e="=".repeat((4-t.length%4)%4),n=(t+e).replace(/\-/g,"+").replace(/_/g,"/"),s=atob(n),r=new Uint8Array(s.length);for(let i=0;i<s.length;++i)r[i]=s.charCodeAt(i);return r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le="fcm_token_details_db",Hr=5,ze="fcm_token_object_Store";async function jr(t){if("databases"in indexedDB&&!(await indexedDB.databases()).map(i=>i.name).includes(le))return null;let e=null;return(await j(le,Hr,{upgrade:async(s,r,i,a)=>{if(r<2||!s.objectStoreNames.contains(ze))return;const o=a.objectStore(ze),c=await o.index("fcmSenderId").get(t);if(await o.clear(),!!c){if(r===2){const l=c;if(!l.auth||!l.p256dh||!l.endpoint)return;e={token:l.fcmToken,createTime:l.createTime??Date.now(),subscriptionOptions:{auth:l.auth,p256dh:l.p256dh,endpoint:l.endpoint,swScope:l.swScope,vapidKey:typeof l.vapidKey=="string"?l.vapidKey:g(l.vapidKey)}}}else if(r===3){const l=c;e={token:l.fcmToken,createTime:l.createTime,subscriptionOptions:{auth:g(l.auth),p256dh:g(l.p256dh),endpoint:l.endpoint,swScope:l.swScope,vapidKey:g(l.vapidKey)}}}else if(r===4){const l=c;e={token:l.fcmToken,createTime:l.createTime,subscriptionOptions:{auth:g(l.auth),p256dh:g(l.p256dh),endpoint:l.endpoint,swScope:l.swScope,vapidKey:g(l.vapidKey)}}}}}})).close(),await q(le),await q("fcm_vapid_details_db"),await q("undefined"),Kr(e)?e:null}function Kr(t){if(!t||!t.subscriptionOptions)return!1;const{subscriptionOptions:e}=t;return typeof t.createTime=="number"&&t.createTime>0&&typeof t.token=="string"&&t.token.length>0&&typeof e.auth=="string"&&e.auth.length>0&&typeof e.p256dh=="string"&&e.p256dh.length>0&&typeof e.endpoint=="string"&&e.endpoint.length>0&&typeof e.swScope=="string"&&e.swScope.length>0&&typeof e.vapidKey=="string"&&e.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wr="firebase-messaging-database",Vr=1,R="firebase-messaging-store";let ue=null;function ke(){return ue||(ue=j(Wr,Vr,{upgrade:(t,e)=>{switch(e){case 0:t.createObjectStore(R)}}})),ue}async function Ae(t){const e=Re(t),s=await(await ke()).transaction(R).objectStore(R).get(e);if(s)return s;{const r=await jr(t.appConfig.senderId);if(r)return await De(t,r),r}}async function De(t,e){const n=Re(t),r=(await ke()).transaction(R,"readwrite");return await r.objectStore(R).put(e,n),await r.done,e}async function qr(t){const e=Re(t),s=(await ke()).transaction(R,"readwrite");await s.objectStore(R).delete(e),await s.done}function Re({appConfig:t}){return t.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},f=new X("messaging","Messaging",zr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Gr(t,e){const n=await Ne(t),s=$t(e),r={method:"POST",headers:n,body:JSON.stringify(s)};let i;try{i=await(await fetch(ve(t.appConfig),r)).json()}catch(a){throw f.create("token-subscribe-failed",{errorInfo:a?.toString()})}if(i.error){const a=i.error.message;throw f.create("token-subscribe-failed",{errorInfo:a})}if(!i.token)throw f.create("token-subscribe-no-token");return i.token}async function Jr(t,e){const n=await Ne(t),s=$t(e.subscriptionOptions),r={method:"PATCH",headers:n,body:JSON.stringify(s)};let i;try{i=await(await fetch(`${ve(t.appConfig)}/${e.token}`,r)).json()}catch(a){throw f.create("token-update-failed",{errorInfo:a?.toString()})}if(i.error){const a=i.error.message;throw f.create("token-update-failed",{errorInfo:a})}if(!i.token)throw f.create("token-update-no-token");return i.token}async function Ut(t,e){const s={method:"DELETE",headers:await Ne(t)};try{const i=await(await fetch(`${ve(t.appConfig)}/${e}`,s)).json();if(i.error){const a=i.error.message;throw f.create("token-unsubscribe-failed",{errorInfo:a})}}catch(r){throw f.create("token-unsubscribe-failed",{errorInfo:r?.toString()})}}function ve({projectId:t}){return`${Lr}/projects/${t}/registrations`}async function Ne({appConfig:t,installations:e}){const n=await e.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function $t({p256dh:t,auth:e,endpoint:n,vapidKey:s}){const r={web:{endpoint:n,auth:e,p256dh:t}};return s!==Lt&&(r.web.applicationPubKey=s),r}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yr=10080*60*1e3;async function Qr(t){const e=await Zr(t.swRegistration,t.vapidKey),n={vapidKey:t.vapidKey,swScope:t.swRegistration.scope,endpoint:e.endpoint,auth:g(e.getKey("auth")),p256dh:g(e.getKey("p256dh"))},s=await Ae(t.firebaseDependencies);if(s){if(ei(s.subscriptionOptions,n))return Date.now()>=s.createTime+Yr?Xr(t,{token:s.token,createTime:Date.now(),subscriptionOptions:n}):s.token;try{await Ut(t.firebaseDependencies,s.token)}catch(r){console.warn(r)}return Je(t.firebaseDependencies,n)}else return Je(t.firebaseDependencies,n)}async function Ge(t){const e=await Ae(t.firebaseDependencies);e&&(await Ut(t.firebaseDependencies,e.token),await qr(t.firebaseDependencies));const n=await t.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Xr(t,e){try{const n=await Jr(t.firebaseDependencies,e),s={...e,token:n,createTime:Date.now()};return await De(t.firebaseDependencies,s),n}catch(n){throw n}}async function Je(t,e){const s={token:await Gr(t,e),createTime:Date.now(),subscriptionOptions:e};return await De(t,s),s.token}async function Zr(t,e){const n=await t.pushManager.getSubscription();return n||t.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Fr(e)})}function ei(t,e){const n=e.vapidKey===t.vapidKey,s=e.endpoint===t.endpoint,r=e.auth===t.auth,i=e.p256dh===t.p256dh;return n&&s&&r&&i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ti(t){const e={from:t.from,collapseKey:t.collapse_key,messageId:t.fcmMessageId};return ni(e,t),si(e,t),ri(e,t),e}function ni(t,e){if(!e.notification)return;t.notification={};const n=e.notification.title;n&&(t.notification.title=n);const s=e.notification.body;s&&(t.notification.body=s);const r=e.notification.image;r&&(t.notification.image=r);const i=e.notification.icon;i&&(t.notification.icon=i)}function si(t,e){e.data&&(t.data=e.data)}function ri(t,e){if(!e.fcmOptions&&!e.notification?.click_action)return;t.fcmOptions={};const n=e.fcmOptions?.link??e.notification?.click_action;n&&(t.fcmOptions.link=n);const s=e.fcmOptions?.analytics_label;s&&(t.fcmOptions.analyticsLabel=s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ii(t){return typeof t=="object"&&!!t&&Br in t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ai(t){return new Promise(e=>{setTimeout(e,t)})}async function oi(t,e){const n=ci(e,await t.firebaseDependencies.installations.getId());li(t,n,e.productId)}function ci(t,e){const n={};return t.from&&(n.project_number=t.from),t.fcmMessageId&&(n.message_id=t.fcmMessageId),n.instance_id=e,t.notification?n.message_type=Y.DISPLAY_NOTIFICATION.toString():n.message_type=Y.DATA_MESSAGE.toString(),n.sdk_platform=Ur.toString(),n.package_name=self.origin.replace(/(^\w+:|^)\/\//,""),t.collapse_key&&(n.collapse_key=t.collapse_key),n.event=$r.toString(),t.fcmOptions?.analytics_label&&(n.analytics_label=t.fcmOptions?.analytics_label),n}function li(t,e,n){const s={};s.event_time_ms=Math.floor(Date.now()).toString(),s.source_extension_json_proto3=JSON.stringify({messaging_client_event:e}),n&&(s.compliance_data=ui(n)),t.logEvents.push(s)}function ui(t){return{privacy_context:{prequest:{origin_associated_product_id:t}}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hi(t,e){const{newSubscription:n}=t;if(!n){await Ge(e);return}const s=await Ae(e.firebaseDependencies);await Ge(e),e.vapidKey=s?.subscriptionOptions?.vapidKey??Lt,await Qr(e)}async function di(t,e){const n=gi(t);if(!n)return;e.deliveryMetricsExportedToBigQueryEnabled&&await oi(e,n);const s=await Ft();if(wi(s))return bi(s,n);if(n.notification&&await yi(pi(n)),!!e&&e.onBackgroundMessageHandler){const r=ti(n);typeof e.onBackgroundMessageHandler=="function"?await e.onBackgroundMessageHandler(r):e.onBackgroundMessageHandler.next(r)}}async function fi(t){const e=t.notification?.data?.[Bt];if(e){if(t.action)return}else return;t.stopImmediatePropagation(),t.notification.close();const n=_i(e);if(!n)return;const s=new URL(n,self.location.href),r=new URL(self.location.origin);if(s.host!==r.host)return;let i=await mi(s);if(i?i=await i.focus():(i=await self.clients.openWindow(n),await ai(3e3)),!!i)return e.messageType=Q.NOTIFICATION_CLICKED,e.isFirebaseMessaging=!0,i.postMessage(e)}function pi(t){const e={...t.notification};return e.data={[Bt]:t},e}function gi({data:t}){if(!t)return null;try{return t.json()}catch{return null}}async function mi(t){const e=await Ft();for(const n of e){const s=new URL(n.url,self.location.href);if(t.host===s.host)return n}return null}function wi(t){return t.some(e=>e.visibilityState==="visible"&&!e.url.startsWith("chrome-extension://"))}function bi(t,e){e.isFirebaseMessaging=!0,e.messageType=Q.PUSH_RECEIVED;for(const n of t)n.postMessage(e)}function Ft(){return self.clients.matchAll({type:"window",includeUncontrolled:!0})}function yi(t){const{actions:e}=t,{maxActions:n}=Notification;return e&&n&&e.length>n&&console.warn(`This browser only supports ${n} actions. The remaining actions will not be displayed.`),self.registration.showNotification(t.title??"",t)}function _i(t){const e=t.fcmOptions?.link??t.notification?.click_action;return e||(ii(t.data)?self.location.origin:null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ei(t){if(!t||!t.options)throw he("App Configuration Object");if(!t.name)throw he("App Name");const e=["projectId","apiKey","appId","messagingSenderId"],{options:n}=t;for(const s of e)if(!n[s])throw he(s);return{appName:t.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function he(t){return f.create("missing-app-config-values",{valueName:t})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ci{constructor(e,n,s){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const r=Ei(e);this.firebaseDependencies={app:e,appConfig:r,installations:n,analyticsProvider:s}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Si=t=>{const e=new Ci(t.getProvider("app").getImmediate(),t.getProvider("installations-internal").getImmediate(),t.getProvider("analytics-internal"));return self.addEventListener("push",n=>{n.waitUntil(di(n,e))}),self.addEventListener("pushsubscriptionchange",n=>{n.waitUntil(hi(n,e))}),self.addEventListener("notificationclick",n=>{n.waitUntil(fi(n))}),e};function Ii(){O(new k("messaging-sw",Si,"PUBLIC"))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ti(){return dt()&&await ft()&&"PushManager"in self&&"Notification"in self&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ki(t,e){if(self.document!==void 0)throw f.create("only-available-in-sw");return t.onBackgroundMessageHandler=e,()=>{t.onBackgroundMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ai(t=Us()){return Ti().then(e=>{if(!e)throw f.create("unsupported-browser")},e=>{throw f.create("indexed-db-unsupported")}),Ee(pt(t),"messaging-sw").getImmediate()}function Di(t,e){return t=pt(t),ki(t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ii();self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",t=>{t.waitUntil((async()=>{const n=(await self.clients.matchAll({type:"window"})).length>0;await self.clients.claim(),n&&(await self.clients.matchAll({type:"window"})).forEach(r=>r.postMessage({type:"SW_UPDATED"}))})())});self.addEventListener("message",t=>{t.data?.type==="SKIP_WAITING"&&self.skipWaiting()});mn([{"revision":"4ccc10111627fec4c4df610c654fe5fa","url":"index.html"},{"revision":"ce64e0aae0c9fb5ecbfaeced928cb26e","url":"fonts/fonts.css"},{"revision":null,"url":"assets/index-CpVMdfwc.css"},{"revision":"ef05b30d6e5ca86ef9deda8c5bfa599a","url":"fonts/playfair-normal-latin.woff2"},{"revision":"319e6b2aad48bec980d22efb27163e79","url":"fonts/playfair-normal-latin-ext.woff2"},{"revision":"4450ccfb75331d6c98ed7095f1467b7b","url":"fonts/playfair-italic-latin.woff2"},{"revision":"fbc900d5891ba53af743dd637f37ed1e","url":"fonts/playfair-italic-latin-ext.woff2"},{"revision":"fdf9c509a8095ffa556117f486a94a8d","url":"fonts/outfit-latin.woff2"},{"revision":"6a2414e384c386019774bd42eae42c9b","url":"fonts/outfit-latin-ext.woff2"},{"revision":"867a69b6d1af58666f8c1253027fbc7e","url":"icon-512.png"},{"revision":"e5647ff8eef30f4e75cb82c9fafa3c9d","url":"icon-512-playstore.png"},{"revision":"8909438890bbf1be0bee24b1f5879a9a","url":"icon-192.png"},{"revision":"86eaa5b55915b032880d8508c0625368","url":"icon-1024.png"},{"revision":"d37dc334ea6a98c3d97296a75b91aa1c","url":"apple-touch-icon.png"},{"revision":"b1073128978181c854e69a7f046b86ba","url":"offline.html"},{"revision":"d37dc334ea6a98c3d97296a75b91aa1c","url":"apple-touch-icon.png"},{"revision":"8909438890bbf1be0bee24b1f5879a9a","url":"icon-192.png"},{"revision":"867a69b6d1af58666f8c1253027fbc7e","url":"icon-512.png"},{"revision":"edad1764e66a5365351e5ef9835def31","url":"icon.svg"},{"revision":"3ed6b6e03622345becf6f253a6b52ef6","url":"manifest.webmanifest"}]||[]);fn();const P="nasa-hrvatska-v1776026434622";y(/\/assets\/chunk-(data|vocabulary|grammar|exercises|lessons|scenarios|cultural|geo|stories|pitch-data|daily|songs)[^/]*\.js$/,new rt({cacheName:`${P}-data`,plugins:[new K({maxEntries:3,maxAgeSeconds:3600*24*7}),new x({statuses:[200]}),{cacheWillUpdate:async({response:t})=>t?.headers?.get("content-type")?.startsWith("text/html")?null:t}]}));y(/\.js$/,new nt({cacheName:`${P}-js`,networkTimeoutSeconds:10,plugins:[new K({maxEntries:150,maxAgeSeconds:720*60*60}),new x({statuses:[200]}),{fetchDidSucceed:async({response:t})=>{if(t?.headers?.get("content-type")?.startsWith("text/html"))throw new Error("Failed to fetch");return t},cacheWillUpdate:async({response:t})=>t?.headers?.get("content-type")?.startsWith("text/html")?null:t}]}));y(/\.(svg|png|webp|jpg|jpeg)$/,new et({cacheName:`${P}-images`,plugins:[new K({maxEntries:100,maxAgeSeconds:365*24*60*60}),new x({statuses:[0,200]})]}));y(new wn(new nt({cacheName:`${P}-html`,networkTimeoutSeconds:10,plugins:[new x({statuses:[0,200]}),{handlerDidError:async()=>pn("index.html")}]}),{denylist:[/^\/api\//]}));y(/\/audio\/.*\.(mp3|ogg|wav)$/i,new rt({cacheName:`${P}-audio`,plugins:[new K({maxEntries:300,maxAgeSeconds:3600*24*30}),new Ln,new x({statuses:[0,200,206]})]}));y(/^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,new et({cacheName:`${P}-fonts`,plugins:[new K({maxEntries:20,maxAgeSeconds:3600*24*365}),new x({statuses:[0,200]})]}));y(/^https:\/\/[a-z0-9-]+\.firebaseio\.com\/.*/i,new st);y(/^https:\/\/firestore\.googleapis\.com\/.*/i,new st);const Ri=gt({apiKey:void 0,authDomain:void 0,projectId:void 0,storageBucket:void 0,messagingSenderId:void 0,appId:void 0}),vi=Ai(Ri);Di(vi,t=>{const{title:e,body:n,icon:s}=t.notification||{};self.registration.showNotification(e||"Naša Hrvatska",{body:n||"Time to practice your Croatian! 🇭🇷",icon:s||"/icons/icon-192x192.png",badge:"/icons/badge-72.png",tag:"nh-daily-reminder",renotify:!0,data:t.data||{},actions:[{action:"study",title:"📚 Study Now"},{action:"dismiss",title:"Later"}]})});self.addEventListener("push",t=>{let e={title:"Naša Hrvatska",body:"Time to practice your Croatian! 🇭🇷"};try{t.data&&(e={...e,...t.data.json()})}catch{}const n=Object.assign({url:"/"},e.data||{});t.waitUntil(self.registration.showNotification(e.title,{body:e.body,icon:e.icon||"/icons/icon-192x192.png",badge:e.badge||"/icons/badge-72.png",tag:e.tag||"streak-reminder",renotify:!0,data:n,actions:e.actions||[{action:"study",title:"📚 Study Now"},{action:"dismiss",title:"Later"}]}))});const Ye=[{title:"🇭🇷 Naša Hrvatska",body:"Time to practice your Croatian today!"},{title:"📚 Review time!",body:"Your Croatian words are waiting — 5 minutes keeps the momentum going."},{title:"🔥 Keep your streak alive!",body:"Dobar dan! Complete today's lesson to stay on track."},{title:"🧠 Memory check!",body:"Croatian words fade without practice — a quick review locks them in."},{title:"⚡ Just 5 minutes!",body:"Quick quiz? Your future self will thank you. Hajde! 🇭🇷"}];self.addEventListener("periodicsync",t=>{if(t.tag!=="nh-daily-reminder")return;const e=Ye[Math.floor(Date.now()/864e5)%Ye.length];t.waitUntil(self.registration.showNotification(e.title,{body:e.body,icon:"/icons/icon-192x192.png",badge:"/icons/badge-72.png",tag:"nh-daily-reminder",renotify:!0,data:{url:"/",action:"open_lesson"},actions:[{action:"study",title:"📚 Study Now"},{action:"dismiss",title:"Later"}]}))});self.addEventListener("notificationclick",t=>{if(t.notification.close(),t.action==="dismiss")return;const e=t.notification.data?.url||"/";t.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:!0}).then(n=>{for(const s of n)if(s.url.includes(self.location.origin)&&"focus"in s)return s.focus();return self.clients.openWindow(e)}))});
