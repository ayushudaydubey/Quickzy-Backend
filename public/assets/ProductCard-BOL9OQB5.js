import{e as g,u as y,a as j,d as w,j as t,S as N,f as c,m as k,h as C,y as x}from"./index-CoR9VuZL.js";/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],A=g("image",_);/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],z=g("zap",v),m=(e,r=15)=>{if(!e)return"";const n=e.split(" ");return n.length<=r?e:n.slice(0,r).join(" ")+"..."},U=({product:e})=>{const r=y(),n=j(),h=w(a=>a.user.user),u=()=>{r(`/product/${e._id}`)},f=a=>{if(a.stopPropagation(),!h){r(`/login?redirect=${encodeURIComponent(`/checkout/${e._id}?quantity=1`)}`);return}r(`/checkout/${e._id}`,{state:{quantity:1}})},p=async a=>{a.stopPropagation();try{await n(k(e._id)).unwrap(),await n(C()).unwrap().catch(()=>{}),x.success(`${e.title} added to your cart list`)}catch{x.error("please login to add items to cart"),r(`/login?redirect=/product/${e._id}`)}},d="https://via.placeholder.com/600x400?text=No+Image",b=(()=>{const a=s=>s?typeof s=="string"?s:typeof s=="object"&&(s.url||s.secure_url||s.path||s.src||s.publicUrl||s.public_id)||"":"";let i="";if(Array.isArray(e==null?void 0:e.images))for(const s of e.images){const o=a(s);if(o&&o.trim()!==""){i=o;break}}i||(i=a(e==null?void 0:e.image)||"");let l=i||d;return typeof l=="string"&&l.startsWith("/")&&(l=((c&&c.defaults&&c.defaults.baseURL||"").replace(/\/$/,"")||"")+l),l})();return t.jsxs("div",{onClick:u,className:`
        relative bg-white border border-gray-200 rounded-2xl overflow-hidden
        transition-all duration-500 ease-out cursor-pointer
        w-full sm:max-w-[350px]
        h-[400px]
        flex flex-col group
      `,children:[t.jsxs("div",{className:"overflow-hidden h-52 relative bg-gray-50",children:[t.jsx("img",{src:b,alt:e.title,className:"w-full h-full object-scale-down transition-transform duration-700 group-hover:scale-110",loading:"lazy",onError:a=>a.currentTarget.src=d}),Array.isArray(e.images)&&e.images.length>1&&t.jsxs("span",{className:"absolute bottom-2 right-2 bg-black/80 text-white text-[10px] flex items-center gap-1 px-2 py-1 rounded-full",children:[t.jsx(A,{size:12}),e.images.length]})]}),t.jsxs("div",{className:"p-4 sm:p-5 flex flex-col flex-grow",children:[t.jsxs("div",{children:[t.jsx("h3",{className:"text-gray-900 text-lg sm:text-xl font-bold mb-2 capitalize truncate",children:m(e.title,3)}),t.jsx("p",{className:"text-gray-600 text-xs sm:text-sm mb-3 leading-tight font-medium line-clamp-2",children:m(e.description,10)})]}),t.jsx("div",{className:"mt-auto pt-3 border-t border-gray-200",children:t.jsxs("div",{className:"flex items-center justify-between gap-3",children:[t.jsxs("span",{className:"text-lg sm:text-xl font-semibold text-black whitespace-nowrap",children:["₹",e.price]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx("button",{onClick:p,className:`
                  flex items-center justify-center
                  bg-white border border-gray-300 text-black
                  hover:bg-black hover:text-white
                  p-2 sm:p-2.5
                  rounded-lg transition-all duration-300
                `,children:t.jsx(N,{size:16})}),t.jsxs("button",{onClick:f,className:`
                  flex items-center gap-1
                  bg-black hover:bg-zinc-900 text-white
                  px-3 py-1.5 sm:px-4 sm:py-2
                  text-[10px] sm:text-sm font-light
                  rounded-lg transition-all duration-300
                `,children:[t.jsx(z,{size:16})," Buy Now"]})]})]})})]})]})};export{U as P};
