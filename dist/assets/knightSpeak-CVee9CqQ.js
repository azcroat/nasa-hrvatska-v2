function o(n,i,e=0){const t=()=>{typeof window>"u"||window.dispatchEvent(new CustomEvent("knight:speak",{detail:{mood:n,text:i}}))};e>0?setTimeout(t,e):t()}export{o as k};
