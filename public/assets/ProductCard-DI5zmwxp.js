import{e as h,u as w,a as j,d as N,j as t,S as k,f as c,m as C,h as _,y as x}from"./index-Cq2iuTYL.js";/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],A=h("image",v);/**
 * @license lucide-react v0.522.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],$=h("zap",z),g=(e,o=15)=>{if(!e)return"";const r=e.split(" ");return r.length<=o?e:r.slice(0,o).join(" ")+"..."},U=({product:e,showBuy:o=!1})=>{const r=w(),d=j(),u=N(a=>a.user.user),f=()=>{r(`/product/${e._id}`)},y=a=>{if(a.stopPropagation(),!u){r(`/login?redirect=${encodeURIComponent(`/checkout/${e._id}?quantity=1`)}`);return}r(`/checkout/${e._id}`,{state:{quantity:1}})},p=async a=>{a.stopPropagation();try{await d(C(e._id)).unwrap(),await d(_()).unwrap().catch(()=>{}),x.success(`${e.title} added to your cart list `)}catch{x.error("Please login to add items to cart"),r(`/login?redirect=/product/${e._id}`)}},m="https://via.placeholder.com/600x400?text=No+Image",b=(()=>{const a=s=>s?typeof s=="string"?s:typeof s=="object"&&(s.url||s.secure_url||s.path||s.src||s.publicUrl||s.public_id)||"":"";let n="";if(Array.isArray(e==null?void 0:e.images))for(const s of e.images){const l=a(s);if(l&&typeof l=="string"&&l.trim()!==""){n=l;break}}n||(n=a(e==null?void 0:e.image)||"");let i=n||m;return typeof i=="string"&&i.startsWith("/")&&(i=((c&&c.defaults&&c.defaults.baseURL||"").replace(/\/$/,"")||"")+i),i})();return t.jsxs("div",{onClick:f,className:`
        relative bg-white border border-gray-200 rounded-2xl overflow-hidden  
        transition-all duration-500 ease-out cursor-pointer 
        w-full max-w-full sm:max-w-[350px] 
        h-[350px] sm:h-[400px] 
        flex flex-col group
      `,children:[t.jsxs("div",{className:"overflow-hidden h-52 sm:h-68 relative bg-gray-50",children:[t.jsx("img",{src:b,alt:e.title,className:"w-full h-full object-scale-down transition-transform duration-700 group-hover:scale-110",loading:"lazy",onError:a=>{(!a.currentTarget.src||!a.currentTarget.src.includes("placeholder.com"))&&(a.currentTarget.src=m)}}),Array.isArray(e.images)&&e.images.length>1&&t.jsxs("span",{className:"absolute bottom-2 right-2 bg-black/80 text-white text-[9px] sm:text-[10px] flex items-center gap-1 px-2 py-1 rounded-full",children:[t.jsx(A,{size:12})," ",e.images.length]}),t.jsx("div",{className:"absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500",children:t.jsx("button",{onClick:p,className:`
              bg-white text-black p-3 sm:p-4 
              rounded-full shadow-xl 
              hover:bg-gray-200 transition-all duration-300 
              scale-90 group-hover:scale-110
            `,title:"Add to cart",children:t.jsx(k,{size:12,className:"sm:size-6 "})})})]}),t.jsxs("div",{className:"p-4 sm:p-5 flex flex-col justify-between flex-grow",children:[t.jsxs("div",{children:[t.jsx("h3",{className:"text-gray-900 text-lg sm:text-xl font-bold leading-snug mb-2 sm:mb-4 capitalize truncate",children:g(e.title,3)}),t.jsx("p",{className:"text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 leading-tight font-medium h-4 overflow-hidden",children:g(e.description,10)})]}),t.jsxs("div",{className:"flex items-center justify-between mt-auto pt-2 border-t border-gray-200",children:[t.jsxs("span",{className:"text-lg sm:text-xl font-medium text-black",children:["₹",e.price]}),t.jsxs("button",{onClick:y,className:`
              flex items-center gap-1 
              bg-black hover:bg-zinc-950 text-white 
              text-xs sm:text-sm font-medium 
              px-3 py-1.5
              rounded-xl transition-all duration-300 
              shadow-lg hover:shadow-2xl
            `,title:"Buy Now",children:[t.jsx($,{size:16,className:""})," Buy Now"]})]})]})]})};export{U as P};
